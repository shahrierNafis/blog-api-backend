const express = require("express");
const v1Router = require("./routes/v1");
require("dotenv").config();
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const mongoose = require("mongoose");
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("Connected to MongoDB"))
  .catch((error) => handleError(error));

mongoose.connection.on("error", (err) => {
  logError(err);
});

app.use("/v1", v1Router);

app.listen(3000, () => {
  console.log("Listening on port 3000");
});
