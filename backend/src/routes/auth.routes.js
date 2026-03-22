const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const authMiddleware = require("../middleware/auth");
const { OAuth2Client } = require("google-auth-library");
const db = require("../config/db");

const router = express.Router();
const googleClient = new OAuth2Client();

function buildAuthResponse(user) {
  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      assigned_municipality: user.assigned_municipality,
    },
    process.env.JWT_SECRET,
    { expiresIn: "30d" },
  );

  return {
    token,
    user: {
      id: user.id,
      firstname: user.firstname,
      middlename: user.middlename,
      lastname: user.lastname,
      nick_name: user.nick_name,
      email: user.email,
      img: user.img || null,
      assigned_municipality: user.assigned_municipality,
      municipality_name: user.municipality_name || null,
      status: Boolean(Number(user.status)),
    },
  };
}

function normalizeBoolean(value) {
  return value === true || value === 1 || value === "1";
}

function buildUserPayload(row) {
  return {
    id: row.id,
    firstname: row.firstname,
    middlename: row.middlename,
    lastname: row.lastname,
    nick_name: row.nick_name,
    email: row.email,
    img: row.img,
    assigned_municipality: row.assigned_municipality,
    municipality_name: row.municipality_name,
    status: normalizeBoolean(row.status),
  };
}

function buildToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      assigned_municipality: user.assigned_municipality,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "30d",
    },
  );
}

async function findUserByEmail(email) {
  const [rows] = await pool.execute(
    `
        SELECT
            u.id,
            u.firstname,
            u.middlename,
            u.lastname,
            u.nick_name,
            u.email,
            u.password,
            u.img,
            u.assigned_municipality,
            u.status,
            m.municipality_name
        FROM app_users u
        LEFT JOIN municipality m
            ON m.id = u.assigned_municipality
        WHERE u.email = ?
        LIMIT 1
        `,
    [email],
  );
  return rows[0] || null;
}

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(422).json({
        message: "Email and password are required.",
      });
    }

    const userRow = await findUserByEmail(email.trim());

    if (!userRow) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    if (!normalizeBoolean(userRow.status)) {
      return res.status(403).json({
        message: "Your account is not yet activated.",
      });
    }

    const passwordMatched = await bcrypt.compare(password, userRow.password);

    if (!passwordMatched) {
      return res.status(401).json({
        message: "Invalid Credentials.",
      });
    }

    const user = buildUserPayload(userRow);
    const token = buildToken(user);

    const expiresAt = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000,
    ).toISOString();

    return res.json({
      message: "Login successful.",
      token,
      expiresAt,
      user,
    });
  } catch (error) {
    // console.error("LOGIN ERROR:", {
    //   message: error.message,
    //   code: error.code,
    //   errno: error.errno,
    //   sqlMessage: error.sqlMessage,
    //   sqlState: error.sqlState,
    //   stack: error.stack,
    // });

    // return res.status(500).json({
    //   message: "Server error.",
    //   debug: error.message,
    // });
    console.error("LOGIN ERROR:", error);
    return res.status(500).json({
      message: "Server error.",
    });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const userRow = await findUserByEmail(req.user.email);

    if (!userRow) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    if (!normalizeBoolean(userRow.status)) {
      return res.status(403).json({
        message: "User is inactive.",
      });
    }

    return res.json({
      user: buildUserPayload(userRow),
    });
  } catch (error) {
    console.error("ME ERROR: ", error);
    return res.status(500).json({ message: "Server error." });
  }
});

router.post("/google", async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({
      message: "Google ID token is required.",
    });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_WEB_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      return res.status(401).json({
        message: "Invalid Google token payload.",
      });
    }

    if (!payload.email_verified) {
      return res.status(401).json({
        message: "Google email is not verified.",
      });
    }

    const email = String(payload.email).trim().toLowerCase();
    const [rows] = await db.execute(
      `
        SELECT
            u.id,
            u.firstname,
            u.middlename,
            u.lastname,
            u.nick_name,
            u.email,
            u.password,
            u.img,
            u.assigned_municipality,
            u.status,
            m.municipality_name
        FROM app_users u
        LEFT JOIN municipality m
            ON m.id = u.assigned_municipality
        WHERE u.email = ?
        LIMIT 1
      `,
      [email],
    );

    if (!rows.length) {
      return res.status(403).json({
        message: "This Google account is not authorized for this app.",
      });
    }

    const user = rows[0];

    if (!Boolean(Number(user.status))) {
      return res.status(403).json({
        message: "This account is inactive.",
      });
    }

    return res.status(200).json({
      message: "Google login successful.",
      ...buildAuthResponse(user),
    });
  } catch (error) {
    console.error("GOOGLE LOGIN ERROR:", error);
    return res.status(401).json({
      message: "Google token verification failed.",
    });
  }
});

module.exports = router;
