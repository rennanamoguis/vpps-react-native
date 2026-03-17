const express = require("express");
const pool = require("../config/db");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

async function resolveMunicipalityId(req) {
  if (!req || !req.user) {
    throw new Error("Authenticated request is missing req.user.");
  }

  let municipalityId = req.user.assignedMunicipality ?? null;

  if (municipalityId == null && req.user.userId != null) {
    const [userRows] = await pool.execute(
      `
      SELECT assigned_municipality
      FROM app_users
      WHERE id = ?
      LIMIT 1
      `,
      [req.user.userId],
    );

    municipalityId = userRows[0]?.assigned_municipality ?? null;
  }

  if (municipalityId == null && req.user.email) {
    const [userRows] = await pool.execute(
      `
      SELECT assigned_municipality
      FROM app_users
      WHERE email = ?
      LIMIT 1
      `,
      [req.user.email],
    );

    municipalityId = userRows[0]?.assigned_municipality ?? null;
  }

  return municipalityId;
}

router.get("/meta", authMiddleware, async (req, res) => {
  try {
    const municipalityId = await resolveMunicipalityId(req);

    if (municipalityId == null) {
      return res.status(400).json({
        message: "No assigned municipality found for this user.",
      });
    }

    const [countRows] = await pool.execute(
      `
      SELECT COUNT(*) AS total_voters
      FROM comelec c
      INNER JOIN barangay b
        ON b.id = c.barangay_id
      WHERE c.municipality_id = ?
        AND b.name_of_barangay IS NOT NULL
        AND TRIM(b.name_of_barangay) <> ''
      `,
      [municipalityId],
    );

    const [barangays] = await pool.execute(
      `
      SELECT DISTINCT
        TRIM(name_of_barangay) AS barangay_name
      FROM barangay
      WHERE municipal_id = ?
        AND name_of_barangay IS NOT NULL
        AND TRIM(name_of_barangay) <> ''
      ORDER BY name_of_barangay ASC
      `,
      [municipalityId],
    );

    const totalVoters = Number(countRows[0]?.total_voters ?? 0);

    return res.json({
      municipalityId,
      syncedAt: new Date().toISOString(),
      totalVoters,
      pageSize: 1000,
      barangays,
    });
  } catch (error) {
    console.error("SYNC META ERROR:", {
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
      stack: error.stack,
    });

    return res.status(500).json({
      message: "Unable to prepare sync metadata.",
    });
  }
});

router.get("/voters", authMiddleware, async (req, res) => {
  try {
    const municipalityId = await resolveMunicipalityId(req);

    if (municipalityId == null) {
      return res.status(400).json({
        message: "No assigned municipality found for this user.",
      });
    }

    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(1000, Math.max(1, Number(req.query.limit || 1000)));
    const offset = (page - 1) * limit;

    const [rows] = await pool.execute(
      `
      SELECT
        c.id,
        c.fullname,
        m.municipality_name,
        TRIM(b.name_of_barangay) AS barangay_name,
        c.precinct,
        c.seq,
        c.sitio,
        COALESCE(p.meaning, '') AS priority_meaning,
        CASE
          WHEN c.verify_id IS NULL THEN 'Verified'
          ELSE COALESCE(v.verification, 'Verified')
        END AS verification,
        CASE WHEN c.searched = 1 THEN 1 ELSE 0 END AS searched
      FROM comelec c
      INNER JOIN municipality m
        ON m.id = c.municipality_id
      INNER JOIN barangay b
        ON b.id = c.barangay_id
      LEFT JOIN tbl_priority p
        ON p.code = c.priority
      LEFT JOIN tbl_verify v
        ON v.code = c.verify_id
      WHERE c.municipality_id = ?
        AND b.name_of_barangay IS NOT NULL
        AND TRIM(b.name_of_barangay) <> ''
      ORDER BY c.id ASC
      LIMIT ? OFFSET ?
      `,
      [municipalityId, limit, offset],
    );

    return res.json({
      page,
      limit,
      count: rows.length,
      voters: rows,
    });
  } catch (error) {
    console.error("SYNC VOTERS PAGE ERROR:", {
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
      stack: error.stack,
    });

    return res.status(500).json({
      message: "Unable to prepare voter page.",
    });
  }
});

module.exports = router;
