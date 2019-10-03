const mongoose = require('mongoose');
const url = process.env.MONGO_URL || 'localhost'
const connectDb = () => {
  return mongoose.connect(`mongodb://${url}:27017/chat-mongoose`);
};
module.exports = connectDb;