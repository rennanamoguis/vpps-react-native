const express = require("express");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const multer = require("multer");

const pool = require("../config/db");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

const uploadDir = path.join(process.cwd(), "uploads", "profile");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "") || ".jpg";
    cb(null, `user-${req.user.userId}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith("image/")) {
      cb(null, true);
      return;
    }
    cb(new Error("Only image uploads are allowed."));
  },
});

function buildAbsoluteImageUrl(imgPath) {
  if (!imgPath) return null;
  if (/^https?:\/\//i.test(imgPath)) return imgPath;
  return `${process.env.APP_BASE_URL}${imgPath}`;
}

router.post(
  "/image",
  authMiddleware,
  upload.single("avatar"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(442).json({
          message: "Please select an image to upload.",
        });
      }

      const imagePath = `/uploads/profile/${req.file.filename}`;

      await pool.execute(
        `
            UPDATE app_users
            SET img = ?
            WHERE id = ?
            `,
        [imagePath, req.user.userId],
      );

      return res.json({
        message: "Profile image updated successfully.",
        img: imagePath,
        imageUrl: buildAbsoluteImageUrl(imagePath),
      });
    } catch (error) {
      console.error("PROFILE IMAGE ERROR.", {
        message: error.message,
        stack: error.stack,
      });

      return res.status(500).json({
        message: "Unable to update profile image.",
      });
    }
  },
);

router.post("/change-password", authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(422).json({
        message: "Current password and new password are required.",
      });
    }

    if (String(newPassword).length < 8) {
      return res.status(422).json({
        message: "New password must be at least 8 characters.",
      });
    }

    const [rows] = await pool.execute(
      `
            SELECT password
            FROM app_users
            WHERE id = ?
            LIMIT 1
            `,
      [req.user.userId],
    );

    const userRow = rows[0];

    if (!userRow) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    const matched = await bcrypt.compare(currentPassword, userRow.password);

    if (!matched) {
      return res.status(401).json({
        message: "Current password is incorrect.",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await pool.execute(
      `
            UPDATE app_users
            SET password = ?
            WHERE id = ?
            `,
      [hashedPassword, req.user.userId],
    );

    return res.json({
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", {
      message: error.message,
      stack: error.stack,
    });
    return res.status(500).json({
      message: "Unable to change password.",
    });
  }
});

module.exports = router;
