const mongoose = require("mongoose");
mongoose.connect("mongodb://127.0.0.1:27017/userDataBase");

const express = require("express");
const app = express();

//for user routes
const userRoute = require("./routes/userRoute");
app.use("/", userRoute);

// for admin routes
const adminRoute = require("./routes/admin");
app.use("/admin", adminRoute);

app.listen(5500, function () {
  console.log("server is running at 5500");
});
