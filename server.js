const mongoose = require("mongoose");
const dotenv = require("dotenv");

process.on("unhandledRejection", (err) => {
  console.log(err.name, err.message);
  console.log("UNHANDLER REJECTION! SHUTTING DOWN...");
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.log(err.name, err.message);
  console.log("UNCAUGHT EXCEPTION! SHUTTING DOWN...");
  process.exit(1);
});

dotenv.config({ path: `${__dirname}/config.env` });
const app = require("./app");
const DB = process.env.DATABASE;
mongoose.connect(DB).then((con) => {
  console.log("Connecting to MongoDB succesfully");
});

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`Listening at PORT ${port}`);
});
