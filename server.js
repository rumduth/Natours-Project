const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config({ path: `${__dirname}/config.env` });

process.on("unhandledRejection", (err) => {
  console.log(err.name, err.message);
  console.log("UNHANDLER REJECTION! SHUTTING DOWN...");
});

process.on("uncaughtException", (err) => {
  console.log(err.name, err.message);
  console.log("UNCAUGHT EXCEPTION! SHUTTING DOWN...");
  process.exit(1);
});

process.on("SIGTERM", (err) => {
  console.log("SIGTERM RECEIVED. Shutting down gracefully");
  server.close(() => {
    console.log("Process is terminated!");
  });
});

const app = require("./app");
const DB = process.env.DATABASE;
mongoose.connect(DB).then((con) => {
  console.log("Connecting to MongoDB succesfully");
});

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`Listening at PORT ${port}`);
});
