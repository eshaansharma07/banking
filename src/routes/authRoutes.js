const express = require("express");
const bcrypt = require("bcryptjs");
const Account = require("../models/Account");
const User = require("../models/User");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken
} = require("../utils/tokens");

const router = express.Router();

function createAccountNumber() {
  return `${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`;
}

function setRefreshCookie(res, token) {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

function buildAuthResponse(user) {
  const payload = {
    userId: user._id.toString(),
    email: user.email
  };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  return { accessToken, refreshToken };
}

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long." });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash
    });

    await Account.insertMany([
      {
        user: user._id,
        type: "checking",
        accountNumber: createAccountNumber(),
        balance: 25000
      },
      {
        user: user._id,
        type: "savings",
        accountNumber: createAccountNumber(),
        balance: 125000
      }
    ]);

    const { accessToken, refreshToken } = buildAuthResponse(user);
    user.refreshTokenHash = hashToken(refreshToken);
    await user.save();

    setRefreshCookie(res, refreshToken);

    return res.status(201).json({
      message: "Registration successful.",
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to register user." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const { accessToken, refreshToken } = buildAuthResponse(user);
    user.refreshTokenHash = hashToken(refreshToken);
    await user.save();

    setRefreshCookie(res, refreshToken);

    return res.json({
      message: "Login successful.",
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to login." });
  }
});

router.post("/refresh", async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token missing." });
    }

    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.userId);

    if (!user || !user.refreshTokenHash) {
      return res.status(401).json({ message: "Refresh token is invalid." });
    }

    if (user.refreshTokenHash !== hashToken(refreshToken)) {
      return res.status(401).json({ message: "Refresh token does not match." });
    }

    const nextPayload = {
      userId: user._id.toString(),
      email: user.email
    };
    const accessToken = signAccessToken(nextPayload);
    const nextRefreshToken = signRefreshToken(nextPayload);

    user.refreshTokenHash = hashToken(nextRefreshToken);
    await user.save();

    setRefreshCookie(res, nextRefreshToken);

    return res.json({
      message: "Token refreshed.",
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    return res.status(401).json({ message: "Refresh token expired or invalid." });
  }
});

router.post("/logout", async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      const decoded = verifyRefreshToken(refreshToken);
      const user = await User.findById(decoded.userId);

      if (user) {
        user.refreshTokenHash = null;
        await user.save();
      }
    }
  } catch (error) {
    // Ignore invalid refresh tokens during logout.
  }

  res.clearCookie("refreshToken", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });

  return res.json({ message: "Logged out successfully." });
});

module.exports = router;
