const express = require("express");
const router = express.Router();
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const { check, validationResult } = require("express-validator");

const User = require("../../models/User");

// @route  POST /api/users
// @desc   Register User
// @access Public
router.post(
  "/",
  [
    check("name", "Name is required").not().isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check("password", "Enter a password with atleast 6 characters").isLength({
      min: 6,
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
      });
    }

    const { name, email, password } = req.body;

    try {
      // Checking if a user with the same email already exists
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({
          errors: [{ msg: "User already exists" }],
        });
      }

      // assigning gravatar if it exists for the email or use default
      const avatar = gravatar.url(email, {
        size: "200",
        rating: "pg",
        default: "mm",
      });

      user = new User({
        name,
        email,
        avatar,
        password,
      });

      // encrypt password
      const salt = await bcrypt.genSalt(10);
      // create a hash and puts it in the user object
      user.password = await bcrypt.hash(password, salt);

      await user.save();

      // jwt token generation
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
          // respond with the token for the new user
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
