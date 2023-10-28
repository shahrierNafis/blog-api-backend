const bcrypt = require("bcrypt");
const User = require("../models/User");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const userController = {};

// REGISTER A USER

const userValidation = [
  body("username", "Name length must be at least 3 characters!")
    .isLength({
      min: 3,
    })
    .escape()
    .custom(async (value) => {
      const user = await User.findOne({ username: value });
      if (user) {
        return Promise.reject("User name taken!");
      }
    }),
  body("password", "Password must be at least 8 characters long!").isLength({
    min: 8,
  }),
];
const userValidationErrHandler = (req, res, next) => {
  // get errors from req
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send(errors);
  }
  next();
};
userController.create = [
  ...userValidation,
  userValidationErrHandler,
  asyncHandler(async (req, res) => {
    const username = req.body.username;
    const passwordHash = await bcrypt.hash(req.body.password, 10);
    const user = await User.create({ username, passwordHash });
    await user.save();
    const users = await User.find({});
    res.status(201).send(users);
  }),
];

// Get all users
userController.getALL = asyncHandler(async (req, res) => {
  return res.json(await User.find());
});

// Get me
userController.me = asyncHandler(async (req, res) => {
  res.json(req.user);
});

// Get one users
userController.getOne = asyncHandler(async (req, res) => {
  return await User.findOne({ username: req.params.username });
});

userController.update = [
  ...userValidation,
  userValidationErrHandler,
  asyncHandler(async (req, res, next) => {
    const filter = { username: req.params.username };
    const user = await User.findOne(filter);
    // check if the user is an admin or editor
    if (user._id === req.user._id || req.user.role == ("admin" || "editor")) {
      user.username = req.body.username;
      user.passwordHash = await bcrypt.hash(req.body.password, 10);
      user.role = req.body.role;
      await user.save();
      res.status(204).send("user updated successfully.");
    } else {
      //if not send code 401 Unauthorized
      res.status(401).send("you don't have access to this user!");
    }
  }),
];
userController.delete = asyncHandler(async (req, res, next) => {
  const filter = { username: req.params.username };
  const user = await User.findOne(filter);
  // check if the user is an admin
  if (user._id === req.user._id || req.user.role == "admin") {
    await user.deleteOne();
    res.status(204).send("user deleted successfully!");
  } else {
    //if not send code 401 Unauthorized
    res.status(401).send("you don't have access to this user!");
  }
});
module.exports = userController;
