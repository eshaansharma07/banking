const mongoose = require("mongoose");
const env = require("./env");

mongoose.set("bufferCommands", false);

const globalCache = global.__mongooseCache || {
  conn: null,
  promise: null
};

global.__mongooseCache = globalCache;

async function connectToDatabase() {
  if (globalCache.conn && mongoose.connection.readyState === 1) {
    return globalCache.conn;
  }

  if (!globalCache.promise) {
    globalCache.promise = mongoose.connect(env.mongoUri, {
      dbName: "banking",
      family: 4,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 10000,
      maxPoolSize: 5
    });
  }

  try {
    globalCache.conn = await globalCache.promise;
    return globalCache.conn.connection;
  } catch (error) {
    globalCache.promise = null;
    throw error;
  }
}

module.exports = connectToDatabase;
