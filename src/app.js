const path = require("path");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectToDatabase = require("./config/db");
const env = require("./config/env");
const authRoutes = require("./routes/authRoutes");
const accountRoutes = require("./routes/accountRoutes");

const app = express();
const publicDir = path.join(__dirname, "..");

function errorDetails(error) {
  return {
    message: error.message,
    name: error.name,
    code: error.code || null
  };
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || origin === env.appOrigin) {
        return callback(null, true);
      }

      return callback(new Error("CORS blocked for this origin."));
    },
    credentials: true
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(express.static(publicDir));

app.get("/api/health", async (req, res) => {
  try {
    const connection = await connectToDatabase();

    res.json({
      status: "ok",
      service: "banking-api",
      database: {
        readyState: connection.readyState,
        name: connection.name
      }
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      service: "banking-api",
      message: "Database connection failed.",
      details: errorDetails(error)
    });
  }
});

app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    res.status(500).json({
      message: "Database connection failed.",
      details: errorDetails(error)
    });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/accounts", accountRoutes);

app.use((req, res) => {
  if (!req.path.startsWith("/api")) {
    return res.sendFile(path.join(publicDir, "index.html"));
  }

  res.status(404).json({ message: "Route not found." });
});

module.exports = app;
