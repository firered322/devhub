const jwt = require("jsonwebtoken");
const config = require("config");

module.exports = function (req, res, next) {
  // get token from the header
  const token = req.header("x-auth-token");

  // check if no token
  if (!token) {
    return res.status(401).json({ msg: "No token, auth denied" });
  }

  // verify token
  try {
    // obtain the payload from verifying the token
    const decoded = jwt.verify(token, config.get("JWT_SECRET"));

    // assign a user to the req object from the payload
    req.user = decoded.user;

    next();
  } catch (error) {
    res.status(401).json({ msg: "Token is not valid" });
  }
};
