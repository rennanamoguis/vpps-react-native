const express = require("express");
const pool = require("../config/db");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.get("/bootstrap", authMiddleware, async (req, res) => {
  try {
    const municipalityId = req.user.assignedMunicipality;

    const [voters] = await pool.execute(
      `
                SELECT
                    c.id,
                    c.fullname,
                    m.municipality_name,
                    b.name_of_barangay AS barangay_name,
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
                ORDER BY b.name_of_barangay ASC, c.fullname ASC
            `,
      [municipalityId],
    );

    const [barangays] = await pool.execute(
      `
            SELECT
                name_of_barangay AS barangay_name
            FROM barangay
            WHERE municipal_id = ?
            ORDER BY name_of_barangay ASC
        `,
      [municipalityId],
    );

    return res.json({
      municipalityId,
      syncedAt: new Date().toISOString,
      voters,
      barangays,
    });
  } catch (error) {
    console.error("SYNC BOOTSTRAP ERROR:", {
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
      stack: error.stack,
    });

    return res.status(500).json({
      message: "Unable to prepare sync data.",
    });
  }
});

module.exports = router;
