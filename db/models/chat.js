const mongoose = require('mongoose');
const Schema = mongoose.Schema;
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
  messages : [{ type: Schema.Types.ObjectId, ref: 'Message' }]
},
{
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// https://stackoverflow.com/a/14284192/8373219
ChatSchema.index({ job_id: 1, freelancer_id: 1, client_id: 1 }, { unique: true });

module.exports = mongoose.model('Chat', ChatSchema);