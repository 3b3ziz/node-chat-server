var express = require('express');
var router = express.Router();
var Chat = require('../db/models/chat');

/* GET chats page. */
router.get('/', function(req, res, next) {

  // json body in post request
  // var tmpChat = new Chat({
  //   job_id: 1,
  //   freelancer_id: 1,
  //   client_id: 1,
  // });

  // tmpChat.save((err, chatInstance) => {
  //   if (err) return console.error(err);
  //   console.log(chatInstance);
  //   Chat.find({}, async (err, chats) => {
  // await Chat.deleteMany({});
  //     res.json(chats);
  //   });
  // });

  // Chat.findOne({
  //   job_id: 1,
  //   freelancer_id: 1,
  //   client_id: 1,
  // }, (err, chat) => {
  //   chat.messages.push({
  //     message: 'Hello World',
  //     sender_id: 1
  //   });
  //   chat.save((err, chatInstance) => {
  //     Chat.find({}, async (err, chats) => {
  //       res.json(chats);
  //     });
  //   });
  // });

});

module.exports = router;
