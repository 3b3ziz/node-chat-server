const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const Schema = mongoose.Schema;
const MessageSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
  },
  sender_id: {
    type: String,
    required: true,
  },
  chat_id: {
    type: Schema.Types.ObjectId,
    ref: 'Chat'
  },
},
{
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

MessageSchema.index({ chat_id: 1 });

MessageSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Message', MessageSchema);