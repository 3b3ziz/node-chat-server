const mongoose = require('mongoose');
const url = process.env.MONGO_URL || 'localhost';
const port = process.env.MONGO_URL || '27017';
const connectDb = () => {
  return mongoose.connect(`mongodb://${url}:${port}/chat-mongoose`);
};

export { connectDb };
