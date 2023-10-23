const { Schema, model } = require("mongoose");
const User = require("./User");
const commentSchema = new Schema({
  text: {
    type: String,
    required: [true, "Text is required"],
  },
  date: {
    type: Date,
    default: Date.now,
    required: [true, "Date is required"],
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Author is required"],
  },
});

module.exports = model("Comment", commentSchema);
