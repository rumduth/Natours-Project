const fs = require("fs");
const dotenv = require("dotenv");
dotenv.config({ path: `./config.env` });
const mongoose = require("mongoose");
const DB = process.env.DATABASE;
const Tour = require("../../models/tourModel");
const User = require("../../models/userModel");
const Review = require("../../models/reviewModel");

mongoose
  .connect(DB)
  .then((con) => {
    console.log("Connecting to MongoDB succesfully");
  })
  .catch((err) => {
    console.log("Failure to connect to DB");
  });

async function gracefulExit() {
  await mongoose.connection.close();
  console.log("Close MongoDB Connection Succesfully");
  process.exit(0);
}

const importData = async () => {
  try {
    const tours = JSON.parse(
      fs.readFileSync(`${__dirname}/tours.json`, "utf-8")
    );
    const users = JSON.parse(
      fs.readFileSync(`${__dirname}/users.json`, "utf-8")
    );
    const reviews = JSON.parse(
      fs.readFileSync(`${__dirname}/reviews.json`, "utf-8")
    );
    await Tour.create(tours);
    console.log("Import Tour data to the Database succesfully");
    await User.insertMany(users);
    console.log("Import User data to the Database succesfully");
    await Review.create(reviews);
    console.log("Import Review data to the Database succesfully");
    console.log("Import all data succesfully");
  } catch (err) {
    console.log(`There is error in the importing data process: ${err.message}`);
  } finally {
    await gracefulExit();
  }
};

const deleteData = async () => {
  try {
    await Tour.deleteMany({});
    console.log("Delete Tour data in the Database succesfully");
    await User.deleteMany({});
    console.log("Delete User data in the Database succesfully");
    await Review.deleteMany({});
    console.log("Delete Review data in the Database succesfully");
    console.log("Delete all documents in the collection succesfully");
  } catch (err) {
    console.log(
      `There is an error in deleting the documents in the database: ${err.message}`
    );
  } finally {
    await gracefulExit();
  }
};

if (process.argv[2] === "--import") importData();
if (process.argv[2] === "--delete") deleteData();
