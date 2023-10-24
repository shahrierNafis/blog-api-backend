const asyncHandler = require("express-async-handler");
const { default: mongoose } = require("mongoose");
const authentication = {};
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

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
      res.status(404).send(errors);
    }
    const user = await User.findOne({ username: req.body.username });
    //check to see if the user exists in the list of registered users
    if (user == null) res.status(404).send("User does not exist!");
    //if user does not exist, send a 400 response
    if (await bcrypt.compare(req.body.password, user.passwordHash)) {
      const accessToken = generateAccessToken({ username: req.body.username });
      const refreshToken = generateRefreshToken({
        username: req.body.username,
      });
      res.json({ accessToken: accessToken, refreshToken: refreshToken });
    } else {
      res.status(401).send([{ msg: "Password Incorrect!" }]);
    }
  }),
];
// accessTokens
function generateAccessToken(user) {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
}
// refreshToken mongodb model
const refreshTokens = mongoose.model(
  "refreshTokens",
  new mongoose.Schema({
    token: String,
  })
);
function generateRefreshToken(user) {
  const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "30d",
  });
  new refreshTokens({ token: refreshToken }).save();
  return refreshToken;
}

//REFRESH TOKEN API
authentication.refreshToken = asyncHandler(async (req, res) => {
  if (!(await refreshTokens.exists({ token: req.body.token }))) {
    res.status(400).send("Refresh Token Invalid");
  }
  await refreshTokens.findOneAndDelete({ token: req.body.token });
  //remove the old refreshToken from the refreshTokens list
  const accessToken = generateAccessToken({ user: req.body.name });
  const refreshToken = generateRefreshToken({ user: req.body.name });
  //generate new accessToken and refreshTokens
  res.json({ accessToken: accessToken, refreshToken: refreshToken });
});

// logout controller
authentication.logout = asyncHandler(async (req, res) => {
  //remove the old refreshToken from the refreshTokens list
  await refreshTokens.findOneAndDelete({ token: req.body.token });
});
function validateToken(req, res, next) {
  //get token from request header
  const authHeader = req.headers["authorization"];
  const token = authHeader.split(" ")[1];
  //the request header contains the token "Bearer <token>", split the string and use the second value in the split array.
  if (token == null) res.sendStatus(400).send("Token not present");
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      res.status(403).send("Token invalid");
    } else {
      req.user = user;
      next(); //proceed to the next action in the calling function
    }
  }); //end of jwt.verify()
} //end of function
module.exports = { authentication, validateToken };
