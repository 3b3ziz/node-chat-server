const mongoose = require('mongoose');
const ChatSchema = new mongoose.Schema({
  job_id: {
    type: String,
    required: true,
  },
  job_title: {
    type: String,
    required: true,
  },
  freelancer_id: {
    type: String,
    required: true,
  },
  freelancer_name: {
    type: String,
    required: true,
  },
  client_id: {
    type: String,
    required: true,
  },
  client_name: {
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
      created_at: {
        type: Date,
        default: Date.now
      }
    }
  ],
});

// https://stackoverflow.com/a/14284192/8373219
ChatSchema.index({ job_id: 1, freelancer_id: 1, client_id: 1 }, { unique: true });

module.exports = mongoose.model('Chat', ChatSchema);