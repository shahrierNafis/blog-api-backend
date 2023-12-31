const Comment = require("../models/Comment");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const commentController = {};

const commentValidation = [
  body("text", "text is required").exists().escape(),
  body("post", "post is required").exists().escape(),
];
const commentValidationErrHandler = (req, res, next) => {
  errors = validationResult(req);
  if (!errors.isEmpty()) {
    // sent errors
    res.status(400).send(errors);
  }
  next();
};
commentController.create = [
  ...commentValidation,
  commentValidationErrHandler,
  asyncHandler(async (req, res) => {
    // Create a Comment object
    const comment = new Comment({
      text: req.body.text,
      author: req.user._id,
      post: req.body.post,
    });
    if (req.user.role !== "visitor") {
      await comment.save();
      res.status(201).send(comment);
    } else {
      res.status(401).send("non subscribers cant comment");
    }
  }),
];
commentController.getAll = asyncHandler(async (req, res) => {
  const comments = await Comment.find({ post: req.params.postID });
  res.status(201).send(comments);
});
commentController.getOne = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.commentID);
  res.status(201).send(comment);
});
commentController.update = [
  ...commentValidation,
  commentValidationErrHandler,
  asyncHandler(async (req, res, next) => {
    const filter = { _id: req.params.commentID };
    const comment = await Comment.findOne(filter);

    // check if user is the author or an admin or editor
    if (
      comment.author === req.user._id ||
      ["admin", "editor"].includes(req.user.role)
    ) {
      comment.text = req.body.text;
      await comment.save();
      res.status(204).send("comment updated successfully");
    } else {
      //if not send code 401 Unauthorized
      res.status(401).send("you don't have access to this comment");
    }
  }),
];
commentController.delete = asyncHandler(async (req, res, next) => {
  const filter = { _id: req.params.commentsID };
  const comment = await Comment.findOne(filter);
  // check if the user is an admin
  if (comment.author === req.user._id || req.user.role == "admin") {
    await comment.deleteOne();
    res.status(204).send("comment deleted successfully");
  } else {
    //if not send code 401 Unauthorized
    res.status(401).send("you don't have access to this comment");
  }
});
module.exports = commentController;
