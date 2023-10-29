const Post = require("../models/Post");
const User = require("../models/User");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const postController = {};

const postValidation = [
  body("title").isLength(3).withMessage("title should be 3 letters long"),
  body("text").exists(),
];
const postValidationErrHandler = (req, res, next) => {
  errors = validationResult(req);
  if (!errors.isEmpty()) {
    // sent errors
    return res.status(400).send(errors);
  }
  next();
};
postController.create = [
  (req, res, next) => {
    console.log("====================================");
    console.log(req.body);
    console.log("====================================");
    next();
  },
  ...postValidation,
  postValidationErrHandler,
  asyncHandler(async (req, res) => {
    if (["admin", "editor", "author"].includes(req.user.role)) {
      // Create a post object
      const post = new Post({
        title: req.body.title,
        text: req.body.text,
        author: req.user._id,
        state: req.body.statrse,
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
  // check if draft post are queried
  if (req.query.draft) {
    // check if user is a an admin or editor
    if (["admin", "editor"].includes(req.user.role)) {
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
    // check if draft post are queried
    if (req.query.draft) {
      // check if user is a an admin or editor or the user is the author
      if (
        req.user._id.toString() === req.query.author ||
        ["admin", "editor"].includes(req.user.role)
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
  const post = await Post.findOne({ _id: req.params.id });
  if (post.state === "published") {
    res.status(200).send(post);
  }
  // check if user is a an admin or editor or the user is the author
  else if (
    ["admin", "editor"].includes(req.user.role) ||
    post.author.toString() == req.user._id.toString()
  ) {
    res.status(200).send(post);
  } else {
    //if not send code 401 Unauthorized
    res.status(401).send("you don't have access to this post");
  }
});
postController.update = [
  asyncHandler(async (req, res, next) => {
    const filter = { _id: req.params.id };
    const post = await Post.findOne(filter);
    // update only provided fields or use old values
    req.body.title = req.body.title || post.title;
    req.body.text = req.body.text || post.text;
    req.body.state = req.body.state || post.state;
    req.post = post;
    next();
  }),
  ...postValidation,
  postValidationErrHandler,
  asyncHandler(async (req, res, next) => {
    // check if user is the author or an admin or editor
    if (
      req.post.author.toString() === req.user._id.toString() ||
      ["admin", "editor"].includes(req.user.role)
    ) {
      req.post.title = req.body.title;
      req.post.text = req.body.text;
      req.post.state = req.body.state;
      await req.post.save();
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
