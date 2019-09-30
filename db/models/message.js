const mongoose = require('mongoose');
const MessageSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
  },
  sender_id: {
    type: String,
    required: true,
  }
},
{
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

module.exports = mongoose.model('Message', MessageSchema);