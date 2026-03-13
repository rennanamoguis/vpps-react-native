require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("../src/config/db");

function looksLikeBcrypt(hash) {
  return /^\$2[aby]\$\d{2}\$/.test(hash);
}

(async () => {
  try {
    const [rows] = await pool.execute("SELECT id, password FROM app_users");

    for (const row of rows) {
      if (!row.password) continue;
      if (looksLikeBcrypt(row.password)) continue;

      const hashedPassword = await bcrypt.hash(row.password, 12);

      await pool.execute("UPDATE app_users SET password = ? WHERE id = ?", [
        hashedPassword,
        row.id,
      ]);

      console.log(`Hashed password for user ID ${row.id}`);
    }

    console.log("Done.");
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
