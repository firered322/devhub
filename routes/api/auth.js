const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const { check, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const config = require("config");
const bcrypt = require("bcryptjs");

const User = require("../../models/User");

// @route  GET /api/auth
// @desc   Test route
// @access Public
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (error) {
    console.error(error.message);
    return res.status(500).send("Server Error");
  }
});

// @route  POST /api/auth
// @desc   Authenticate user and get token (Login)
// @access Public
router.post(
  "/",
  [
    check("email", "Enter your registered Email id").isEmail(),
    check("password", "Password is required").exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    try {
      // Checking if a user with the same email already exists
      let user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({
          errors: [{ msg: "Invalid credentials." }],
        });
      }

      // comparing the passwords
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({
          errors: [{ msg: "Enter correct password." }],
        });
      }

      // jwt auth
      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payload,
        config.get("JWT_SECRET"),
        { expiresIn: 360000 },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server err");
    }
  }
);

module.exports = router;
