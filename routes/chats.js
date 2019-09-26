var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var Chat = require('../db/models/chat');

/* GET all chats */
router.get('/', function(req, res, next) {

  try {
    const authHeader = req.get('Authorization');
    const authToken = authHeader.split(' ')[1];
    const secretKey = '4c8d2eabd74d4eb5af4d36c505fd9309847826bee6a7646414fe24782d38c70164051f83de0595571f4538c125b89c235d3e20d76d13301e8e9559ba84946198';
    const decodedToken = jwt.verify(authToken, secretKey);
    const { user_id: userID, type: userType } = decodedToken;
    
    const requestQuery = req.query;
    const jobTitle = requestQuery.job_title;
    const jobID = requestQuery.job_id;
    
    const clientID = userType === 'Client' ? userID : requestQuery.client_id;
    const clientName = requestQuery.client_name;
    
    const freelancerID = userType === 'Freelancer' ? userID : requestQuery.freelancer_id;
    const freelancerName = requestQuery.freelancer_name;

    Chat.find({}, async (err, chats) => {
      // if query params exist, create a new chat and add it to the chats array
      // to let frontend know that this is a new chat
      if (
        clientID &&
        jobID &&
        freelancerID &&
        jobTitle &&
        clientName &&
        freelancerName
      ) {  
        Chat.findOne({
          job_id: jobID,
          freelancer_id: freelancerID,
          client_id: clientID,
        }, (err, chat) => {
          if (err) return console.error(err);
          // if not found, create a new one
          if(!chat) {
            const newChatInstance = new Chat({
              job_id: jobID,
              job_title: jobTitle,
              freelancer_id: freelancerID,
              freelancer_name: freelancerName,
              client_id: clientID,
              client_name: clientName,
            });
            chats.unshift(newChatInstance);
            res.json(chats);
          } else {
            res.json(chats);
          }
        });
      } else {
        res.json(chats);
      }
    });
  } catch(err) {
    res.status(401).json({ error: 'User is unauthorized to perform this action' });
  }
});

/* POST chat message. */
router.post('/', function(req, res, next) {

  try {
    const authHeader = req.get('Authorization');
    const authToken = authHeader.split(' ')[1];
    const secretKey = '4c8d2eabd74d4eb5af4d36c505fd9309847826bee6a7646414fe24782d38c70164051f83de0595571f4538c125b89c235d3e20d76d13301e8e9559ba84946198';
    const decodedToken = jwt.verify(authToken, secretKey);
    const { user_id: userID, type: userType } = decodedToken;

    const requestBody = req.body;
    const jobTitle = requestBody.job_title;
    const jobID = requestBody.job_id;

    const clientID = userType === 'Client' ? userID : requestBody.client_id;
    const clientName = requestBody.client_name;
    
    const freelancerID = userType === 'Freelancer' ? userID : requestBody.freelancer_id;
    const freelancerName = requestBody.freelancer_name;

    const message = requestBody.message;
    const senderID = requestBody.sender_id;

    if (
      clientID &&
      jobID &&
      freelancerID &&
      jobTitle &&
      clientName &&
      freelancerName &&
      message &&
      senderID
    ) {
      // finding the chat by jID, cID and fID
      Chat.findOne({
        job_id: jobID,
        freelancer_id: freelancerID,
        client_id: clientID,
      }, (err, chat) => {
        if (err) return console.error(err);
        // if not found, create a new one
        if(!chat) {
          const newChatInstance = new Chat({
            job_id: jobID,
            job_title: jobTitle,
            freelancer_id: freelancerID,
            freelancer_name: freelancerName,
            client_id: clientID,
            client_name: clientName,
            messages: [
              {
                message: message,
                sender_id: senderID
              }
            ]
          });
          newChatInstance.save((err, chatInstance) => {
            if (err) return console.error(err);
            res.json(chatInstance);
          });
        }
        // if not, append the message to the messages of the catt
        else {
          chat.messages.push({
            message: message,
            sender_id: senderID
          });
          chat.save(err => {
            if (err) return console.error(err);
            res.status(200).json(chat);
          });
        }
      });
    } else {
      res.status(500).json({ error: 'message' });
    }
  } catch {
    res.status(401).json({ error: 'User is unauthorized to perform this action' });
  }
});

module.exports = router;
