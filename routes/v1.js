const router = require("express").Router();
const userController = require("../controllers/userController");
const postController = require("../controllers/postController");
const commentController = require("../controllers/commentController");
const {
  authentication,
  validateToken,
} = require("../controllers/authentication");

router.use("/", validateToken);

// Users
router.post("/users", userController.create);

router.get("/users", userController.getALL);

router.get("/users/me", userController.me);

router.get("/users/:username", userController.getOne);

router.put("/users/:username", userController.update);

router.delete("/users/:username", userController.delete);

// Authentication
router.post("/login", authentication.login);

router.post("/refresh-token", authentication.refreshToken);

router.delete("/logout", authentication.logout);

// Posts
router.post("/posts", postController.create);

router.get("/posts", postController.getAll);

router.get("/posts/:id", postController.getOne);

router.put("/posts/:id", postController.update);

router.delete("/posts/:id", postController.delete);

// Comments
router.post("/posts/:postID/comments", commentController.create);

router.get("/posts/:postID/comments", commentController.getAll);

router.get("/posts/:postID/comments/:commentsID", commentController.getOne);

router.put("/posts/:postID/comments/:commentsID", commentController.update);

router.delete("/posts/:postID/comments/:commentsID", commentController.delete);
module.exports = router;
