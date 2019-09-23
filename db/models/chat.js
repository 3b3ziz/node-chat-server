const mongoose = require('mongoose');
const ChatSchema = new mongoose.Schema({
  chat_id: {
    type: String,
    required: true,
  },
  job_id: {
    type: String,
    required: true,
  },
  freelancer_id: {
    type: String,
    required: true,
  },
  client_id: {
    type: String,
    required: true,
  },
  messages: [
    {
      message: {
        type: String,
        required: true,
      },
      sender_id: {
        type: String,
        required: true,
      },
      date: {
        type: Date,
        default: Date.now
      }
    }
  ],
});

module.exports = mongoose.model('Chat', ChatSchema);