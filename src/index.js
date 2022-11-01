const express = require("express");
require("dotenv").config();
const app = express();
const morgan = require("morgan");
const pg = require("./pg");
// const mongoose = require("mongoose");
const cors = require("cors");
app.use(morgan("dev"));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS, DELETE");
  next();
});

app.use(
  cors({
    origin: ["*"],
    credentials: true,
  })
);

let routes = {
  userRouter: require("./routes/user_route"),
  richListRouter: require("./routes/richlist_route"),
};

require("./controllers/richlist_cron");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

// mongoose
//   .connect(
//     "mongodb+srv://awais:awais@cluster0.tpfm3.mongodb.net/ndau?retryWrites=true&w=majority",
//     {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     }
//   )
//   .then(() => console.log("Database connected!"))
//   .catch((err) => console.log("Cannot connect to the database", err));

app.use("/api", routes.userRouter);
app.use("/api", routes.richListRouter);

//Server Port

const port = 3001;
app.listen(port, () => console.log(`listening on port ${port}`));
let moment = require("moment");
console.log("locale: " + moment("2022-02-13").locale());
