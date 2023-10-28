const Post = require("../models/Post");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const postController = {};

const postValidation = [
  body("title")
    .isLength(3)
    .withMessage("title should be 3 letters long")
    .escape(),
  body("text").exists().escape(),
];
const postValidationErrHandler = (req, res, next) => {
  errors = validationResult(req);
  if (!errors.isEmpty()) {
    // sent errors
    res.status(400).send(errors);
  }
  next();
};
postController.create = [
  ...postValidation,
  postValidationErrHandler,
  asyncHandler(async (req, res) => {
    if (req.user == ("admin" || "editor" || "author")) {
      // Create a post object
      const post = Post.create({
        title: req.body.title,
        text: req.body.text,
        author: req.user._id,
        state: req.body.state,
      });
      await post.save();
      res.status(201).send(post);
    } else {
      res.status(401).send("Unauthorized");
    }
  }),
];
postController.getAll = asyncHandler(async (req, res) => {
  // query only published posts
  const filter = { state: "published" };
  // check if unpublished post are queried
  if (req.query.unpublished) {
    // check if user is a an admin or editor
    if (req.user.role === ("admin" | "editor")) {
      delete filter.state;
    }
    // check if query is filtered with an author
    if (req.query.author == undefined) {
      // if not send code 401 Unauthorized
      res.status(401).send("Unauthorized");
    }
  }
  if (req.query.author) {
    // filter query with an author
    filter.author = req.query.author;
    // check if unpublished post are queried
    if (req.query.unpublished) {
      // check if user is a an admin or editor or the user is the author
      if (
        req.user === req.query.author ||
        req.user.role === ("admin" | "editor")
      ) {
        delete filter.state;
      } else {
        //if not send code 401 Unauthorized
        res.status(401).send("Unauthorized");
      }
    }
  }
  const posts = await Post.find(filter);
  res.status(200).send(posts);
});

postController.getOne = asyncHandler(async (req, res) => {
  const post = await Post.findOne(filter);
  if (post.state === "published") {
    res.status(200).send(post);
  }
  // check if user is a an admin or editor or the user is the author
  else if (
    req.user.role === ("admin" | "editor") ||
    post.author == req.user._id
  ) {
    res.status(200).send(post);
  } else {
    //if not send code 401 Unauthorized
    res.status(401).send("you don't have access to this post");
  }
});
postController.update = [
  ...postValidation,
  postValidationErrHandler,
  asyncHandler(async (rec, res, next) => {
    const filter = { _id: rec.params.id };
    const post = await Post.findOne(filter);

    // check if user is the author or an admin or editor
    if (
      post.author === req.user._id ||
      req.user.role == ("admin" || "editor")
    ) {
      post.title = req.body.title;
      post.text = req.body.text;
      post.state = req.body.state;
      await post.save();
      res.status(204).send("user updated successfully");
    } else {
      //if not send code 401 Unauthorized
      res.status(401).send("you don't have access to this post");
    }
  }),
];
postController.delete = asyncHandler(async (rec, res, next) => {
  const filter = { _id: rec.params.id };
  const post = await Post.findOne(filter);
  // check if the user is an admin
  if (post.author === req.user._id || req.user.role == "admin") {
    await post.deleteOne();
    res.status(204).send("user deleted successfully");
  } else {
    //if not send code 401 Unauthorized
    res.status(401).send("you don't have access to this post");
  }
});

module.exports = postController;
