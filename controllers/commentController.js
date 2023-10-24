const Comment = require("../models/Comment");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const commentController = {};

const commentValidation = [body("text").exists().escape()];
const commentValidationErrHandler = (req, res) => {
  errors = validationResult(req);
  if (!errors.isEmpty()) {
    // sent errors
    res.status(400).send(errors);
  }
};
commentController.create = [
  ...commentValidation,
  commentValidationErrHandler,
  asyncHandler(async (req, res) => {
    // Create a Comment object
    const comment = Comment.create({
      text: req.body.text,
      author: req.user._id,
      post: req.body.post,
    });
    await comment.save();
    res.status(201).send(comment);
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
  asyncHandler(async (rec, res, next) => {
    const filter = { _id: rec.params.commentID };
    const comment = await Comment.findOne(filter);

    // check if user is the author or an admin or editor
    if (
      comment.author === req.user._id ||
      req.user.role == ("admin" || "editor")
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
commentController.delete = asyncHandler(async (rec, res, next) => {
  const filter = { _id: rec.params.commentID };
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
