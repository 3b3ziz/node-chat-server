var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var Chat = require('../db/models/chat');
var Message = require('../db/models/message');

router.get('/delete', function(req, res, next) {
  Chat.deleteMany({ }, function (err) {
    Chat.find({}, async (err, chats) => {
      res.json(chats);
    });
  });
});


/* GET PAGINATED MESSAGES BY CHAT IDS */
// TODO: Paginate
router.get('/:id/messages', async (req, res, next) => {
  const chatID = req.params.id;
  Message.
    paginate({ chat_id: chatID }, { limit: 2 }, (err, chat) => {
      if(err) res.json(err); 
      res.json(chat);
    });
});

/* GET all chats */
router.get('/', function(req, res, next) {
  // const users = req.app.get('users');
  // console.log(users);
  try {
    const authHeader = req.get('Authorization');
    const authToken = authHeader.split(' ')[1];
    // TODO: verify jwtToken instead.
    // const secretKey = '';
    // const decodedToken = jwt.verify(authToken, secretKey);
    const decodedToken = jwt.decode(authToken);
    const { user_id: userID, type: userType } = decodedToken;
    
    const requestQuery = req.query;
    const jobTitle = requestQuery.job_title;
    const jobID = requestQuery.job_id;
    
    const clientID = userType === 'Client' ? userID : requestQuery.client_id;
    const clientName = requestQuery.client_name;
    
    const freelancerID = userType === 'Freelancer' ? userID : requestQuery.freelancer_id;
    const freelancerName = requestQuery.freelancer_name;

    const queryObject = {
      // https://stackoverflow.com/a/46857668/8373219
      ...userType === 'Client' && { client_id: userID },
      ...userType === 'Freelancer' && { freelancer_id: userID }
    };

    Chat.find(queryObject).
      sort({ updated_at: -1 }).
      lean().
      exec((err, chats) => {
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
            }).toObject();
            chats.unshift(newChatInstance);
            res.json(chats);
          } else {
            const lastChatID = chats[0]._id;
            Message.
              paginate({ chat_id: lastChatID }, { limit: 10 }, (err, messages) => {
                if(err) res.json(err); 
                chats[0] = { ...chats[0], messages };
                res.json(chats);
              });
          }
        });
      } else {
        if(!chats.length) {
          res.json(chats);
        } else {
          const lastChatID = chats[0]._id;
          Message.
            paginate({ chat_id: lastChatID }, { limit: 10 }, (err, messages) => {
              if(err) res.json(err);
              chats[0] = { ...chats[0], messages };
              res.json(chats);
            });
        }
      }
    });
  } catch(err) {
    res.status(401).json({ error: 'User is unauthorized to perform this action' });
  }
});

/* POST chat message. */
router.post('/', function(req, res, next) {

  try {
    const io = req.app.get('io');
    const users = req.app.get('users');

    const authHeader = req.get('Authorization');
    const authToken = authHeader.split(' ')[1];
    // TODO: verify jwtToken instead.
    // const secretKey = '';
    // const decodedToken = jwt.verify(authToken, secretKey);
    const decodedToken = jwt.decode(authToken);
    const { user_id: userID, type: userType } = decodedToken;

    const requestBody = req.body;
    const jobTitle = requestBody.job_title;
    const jobID = requestBody.job_id;

    const clientID = userType === 'Client' ? userID : requestBody.client_id;
    const clientName = requestBody.client_name;
    
    const freelancerID = userType === 'Freelancer' ? userID : requestBody.freelancer_id;
    const freelancerName = requestBody.freelancer_name;

    const toID = userType === 'Client' ? freelancerID : clientID;
    const recieverSocketIDs = users[toID];
    const message = requestBody.message;

    if (
      clientID &&
      jobID &&
      freelancerID &&
      jobTitle &&
      clientName &&
      freelancerName &&
      message &&
      userID
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
            client_name: clientName
          });
          newChatInstance.save((err, chatInstance) => {
            if (err) return console.error(err);
            const newMessageInstance = new Message({
              message: message,
              sender_id: userID,
              chat_id: chatInstance._id
            });
            newMessageInstance.save((err, messageInstance) => {
              // TODO: if error exists, rollback message creation
              if (err) return console.error(err);

              if (recieverSocketIDs && recieverSocketIDs.length){
                recieverSocketIDs.forEach(recieverSocketID => {
                  io.to(recieverSocketID).emit('message', chatInstance);
                })
              }
              res.status(200).json(messageInstance);
            });
          });
        }
        // if not, append the message to the messages of the chat
        else {
          const newMessageInstance = new Message({
            message: message,
            sender_id: userID,
            chat_id: chat.id
          });
          newMessageInstance.save((err, messageInstance) => {
            if (recieverSocketIDs && recieverSocketIDs.length){
              recieverSocketIDs.forEach(recieverSocketID => {
                io.to(recieverSocketID).emit('message', messageInstance);
              })
            }
            res.status(200).json(messageInstance);
          });
        }
      });
    } else {
      res.status(500).json({ error: 'message' });
    }
  } catch(err) {
    res.status(401).json({ error: 'User is unauthorized to perform this action' });
  }
});

module.exports = router;
