// -------------------------------
// server.js — Full backend for Wordle v4
// -------------------------------

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// -------------------------------
// Configuration
// -------------------------------
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key_change_me";

// SQLite DB
const DB_FILE = process.env.DATABASE_FILE || path.join(__dirname, "data.sqlite");
const db = new sqlite3.Database(DB_FILE);

// -------------------------------
// Load word lists from /words/*.txt
// -------------------------------
const WORDS = {};
["en", "es", "fr"].forEach((lang) => {
  const filePath = path.join(__dirname, "words", `${lang}.txt`);
  WORDS[lang] = fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map((w) => w.trim().toLowerCase())
    .filter(Boolean);
});

// -------------------------------
// Helper functions
// -------------------------------
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      err ? reject(err) : resolve(this);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      err ? reject(err) : resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      err ? reject(err) : resolve(rows);
    });
  });
}

function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ error: "Missing Authorization header" });

  const token = authHeader.replace(/^Bearer\s+/, "");
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// -------------------------------
// Register
// -------------------------------
app.post("/api/register", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: "Email & password required" });

  try {
    const hash = await bcrypt.hash(password, 10);
    await run(
      "INSERT INTO users (email, password_hash) VALUES (?, ?)",
      [email, hash]
    );

    const user = await get("SELECT id, email FROM users WHERE email = ?", [
      email,
    ]);

    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ user, token });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(400).json({ error: "Email already exists" });
  }
});

// -------------------------------
// Login
// -------------------------------
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: "Missing email or password" });

  try {
    const user = await get("SELECT * FROM users WHERE email = ?", [email]);
    if (!user) return res.status(401).json({ error: "Invalid login" });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid login" });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ user: { id: user.id, email: user.email }, token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// -------------------------------
// Daily word (one per language)
// -------------------------------
app.get("/api/day-word/:lang", (req, res) => {
  const lang = req.params.lang;
  const list = WORDS[lang];

  if (!list)
    return res.status(400).json({ error: "Unknown language" });

  const epoch = new Date(2023, 0, 1); // Jan 1, 2023
  const today = new Date();
  const daysSince = Math.floor((today - epoch) / (24 * 3600 * 1000));

  const index = daysSince % list.length;

  res.json({ word: list[index] });
});

// -------------------------------
// Validate guess
// -------------------------------
app.get("/api/validate/:lang/:guess", (req, res) => {
  const { lang, guess } = req.params;

  const list = WORDS[lang];
  if (!list)
    return res.status(400).json({ error: "Unknown language" });

  const word = guess.toLowerCase();
  const valid = list.includes(word);

  res.json({ valid });
});

// -------------------------------
// Save result
// -------------------------------
app.post("/api/result", auth, async (req, res) => {
  const { date, language, attempts, won } = req.body;

  if (!date || !language || attempts === undefined || won === undefined) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    await run(
      `INSERT INTO results (user_id, date, language, attempts, won)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(user_id, date, language)
       DO UPDATE SET attempts=excluded.attempts, won=excluded.won`,
      [req.user.id, date, language, attempts, won ? 1 : 0]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("Result save error:", err);
    res.status(500).json({ error: "DB error" });
  }
});

// -------------------------------
// Get stats
// -------------------------------
app.get("/api/stats", auth, async (req, res) => {
  try {
    const rows = await all(
      "SELECT date, language, attempts, won FROM results WHERE user_id = ?",
      [req.user.id]
    );

    const stats = {};

    for (const lang of ["en", "es", "fr"]) {
      const list = rows.filter((r) => r.language === lang);
      const wins = list.filter((r) => r.won === 1).length;

      let streak = 0;
      let maxStreak = 0;

      list
        .sort((a, b) => a.date.localeCompare(b.date))
        .forEach((r) => {
          if (r.won === 1) {
            streak++;
            maxStreak = Math.max(maxStreak, streak);
          } else {
            streak = 0;
          }
        });

      stats[lang] = {
        total: list.length,
        wins,
        maxStreak
      };
    }

    res.json({ stats });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// -------------------------------
// Start server
// -------------------------------
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
