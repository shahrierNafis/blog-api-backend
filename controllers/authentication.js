const asyncHandler = require("express-async-handler");
const { default: mongoose } = require("mongoose");
const authentication = {};
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { jwtDecode } = require("jwt-decode");

// login controller
authentication.login = [
  body("username").custom((value) => {
    return User.findOne({ username: value }).then((user) => {
      if (!user) {
        return Promise.reject("no such user");
      }
    });
  }),
  asyncHandler(async (req, res) => {
    // get errors from req
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(404).send(errors);
    }
    const user = await User.findOne({ username: req.body.username });
    //check to see if the user exists in the list of registered users
    if (user == null) res.status(404).send("User does not exist!");
    //if user does not exist, send a 400 response
    if (await bcrypt.compare(req.body.password, user.passwordHash)) {
      const accessToken = generateAccessToken({ _id: user._id });
      const refreshToken = await generateRefreshToken({ _id: user._id });
      res.json({ accessToken: accessToken, refreshToken: refreshToken });
    } else {
      res.status(401).send([{ msg: "Password Incorrect!" }]);
    }
  }),
];
// accessTokens
function generateAccessToken(user) {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });
}
// refreshToken mongodb model
const refreshTokens = mongoose.model(
  "refreshTokens",
  new mongoose.Schema({
    token: String,
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  })
);
async function generateRefreshToken(user) {
  const refreshToken = new refreshTokens({
    token: jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: "30d",
    }),
  });
  await refreshToken.save();
  console.log("====================================");
  console.log(refreshToken.token);
  console.log("====================================");
  return refreshToken.token;
}

//REFRESH TOKEN API
authentication.refreshToken = async (req, res, next) => {
  try {
    //remove the old refreshToken from the refreshTokens list
    const OldRefreshToken = await refreshTokens.findOneAndDelete({
      token: req.body.token,
    });
    // if old refresh token not found
    if (!OldRefreshToken) {
      return res.status(400).send("Refresh Token Invalid");
    }
    // Get user from the refresh token
    const user = jwtDecode(OldRefreshToken.token);
    //generate new accessToken and refreshTokens
    const accessToken = generateAccessToken({ _id: user._id });
    const refreshToken = await generateRefreshToken({ _id: user._id });
    res.json({ accessToken: accessToken, refreshToken: refreshToken }).send();
  } catch (error) {
    console.log(error);
    console.error(error);
    res.status(400).send("Refresh Token Invalid");
  }
};

// logout controller
authentication.logout = asyncHandler(async (req, res) => {
  //remove the old refreshToken from the refreshTokens list
  await refreshTokens.findOneAndDelete({ token: req.body.token });
});
function validateToken(req, res, next) {
  //get token from request header
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    req.user = { role: "visitor" };
    return next();
  }
  const token = authHeader.split(" ")[1];
  //the request header contains the token "Bearer <token>", split the string and use the second value in the split array.
  if (token == null) res.sendStatus(400).send("Token not present");

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      res.status(403).send("Token invalid");
    } else {
      User.findById(user._id).then((user) => {
        req.user = user;
        next(); //proceed to the next action in the calling function
      });
    }
  });
}
module.exports = { authentication, validateToken };
