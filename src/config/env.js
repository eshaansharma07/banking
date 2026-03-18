const dotenv = require("dotenv");

dotenv.config();

const env = {
  mongoUri: process.env.MONGODB_URI,
  accessSecret: process.env.JWT_ACCESS_SECRET,
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  accessExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
  refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  appOrigin: process.env.APP_ORIGIN || "http://localhost:3000",
  nodeEnv: process.env.NODE_ENV || "development"
};

const required = ["mongoUri", "accessSecret", "refreshSecret"];

for (const key of required) {
  if (!env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

module.exports = env;
