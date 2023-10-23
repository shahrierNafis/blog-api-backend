const { Schema, model } = require("mongoose");
const User = require("./User");
const postSchema = new Schema({
  title: {
    type: String,
    required: [true, "Title is required"],
    unique: true,
    trim: true,
  },
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
  state: {
    type: String,
    enum: ["published", "unpublished"],
    default: "unpublished",
  },
});

module.exports = model("Post", postSchema);
