const { Schema, model } = require("mongoose");

const userSchema = new Schema({
  username: {
    type: String,
    required: [true, "Username is required"],
    unique: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: [true, "Password is required"],
  },
  role: {
    type: String,
    enum: ["subscriber", "admin", "editor", "author", "contributor"],
    default: "subscriber",
  },
});

module.exports = model("User", userSchema);
