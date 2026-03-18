const mongoose = require("mongoose");
const env = require("./env");

let isConnected = false;

async function connectToDatabase() {
  if (isConnected) {
    return mongoose.connection;
  }

  await mongoose.connect(env.mongoUri, {
    dbName: "banking"
  });

  isConnected = true;
  return mongoose.connection;
}

module.exports = connectToDatabase;
