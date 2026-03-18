const User = require("../models/User");
const { verifyAccessToken } = require("../utils/tokens");

async function authenticate(req, res, next) {
  try {
    const authorization = req.headers.authorization || "";

    if (!authorization.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Access token missing." });
    }

    const token = authorization.slice(7);
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId).select("-passwordHash -refreshTokenHash");

    if (!user) {
      return res.status(401).json({ message: "User not found." });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired access token." });
  }
}

module.exports = authenticate;
