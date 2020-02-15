import { Router } from 'express';
import { Chat } from '../db/models/chat';
import { Message } from '../db/models/message';
import { authenticate } from '../middlewares/authenticate';
import { authorizeChat } from '../services/authorize';
import { validate, chatValidationRules } from '../middlewares/validate';

const router = Router();
router.use(authenticate);
const limit = 10;

async function getChatByChatId(chatID: string, chat: any) {
  const messages = await Message.paginate(
    { chat_id: chatID },
    { limit, sort: { updated_at: -1 } }
  );
  chat = {
    ...chat,
    messages: {
      ...messages,
      docs: messages.docs.reverse()
    }
  };

  return chat;
}

/* GET CHAT BY CHAT ID */
router.get('/:id', async (req, res) => {
  const chatID = req.params.id;

  try {
    const chat = await Chat.findOne({
      _id: chatID,
      activated: true
    }).lean();

    const chatWithMessages = await getChatByChatId(chatID, chat);

    res.json(chatWithMessages);
  } catch (err) {
    return res.json(err);
  }
});

/* GET PAGINATED MESSAGES BY CHAT IDS */
// TODO: Paginate
router.get('/:id/messages', async (req, res) => {
  const chatID = req.params.id;
  const page = Number(req.query.page) || 1;
  try {
    const messages = await Message.paginate(
      { chat_id: chatID },
      { limit, sort: { updated_at: -1 }, page }
    );

    res.json({
      ...messages,
      docs: messages.docs.reverse()
    });
  } catch (err) {
    return res.json(err);
  }
});

/* GET all chats */
router.get('/', async function(req, res) {
  const {
    decodedToken: { user_id: userID, type: userType },
    query: { job_id: jobID, freelancer_id }
  } = req;

  const freelancerID = userType === 'Freelancer' ? userID : freelancer_id;

  if (userType === 'Admin') {
    const {
      query: { page: pageQuery, job_title, client_name, freelancer_name }
    } = req;

    const queryObject = {
      ...(job_title && { job_title: { $regex: '.*' + job_title + '.*' } }),
      ...(client_name && {
        client_name: { $regex: '.*' + client_name + '.*' }
      }),
      ...(freelancer_name && {
        freelancer_name: { $regex: '.*' + freelancer_name + '.*' }
      })
    };

    const page = Number(pageQuery) || 1;
    const chats = await Chat.paginate(queryObject, {
      limit,
      sort: { updated_at: -1 },
      page
    });
    return res.json(chats);
  }

  const queryObject = {
    // https://stackoverflow.com/a/46857668/8373219
    ...(userType === 'Client' && { client_id: userID }),
    ...(userType === 'Freelancer' && { freelancer_id: userID }),
    activated: true
  };

  const chats = await Chat.find(queryObject)
    .sort({ updated_at: -1 })
    .lean();

  // if query params does not exist
  // then, the chat should exist in the database
  if (!jobID || !freelancerID) {
    if (!chats.length) {
      return res.json(chats);
    }

    // populate last chat with messages
    const lastChatID = chats[0]._id;
    const chat = await getChatByChatId(lastChatID, chats[0]);
    chats[0] = chat;

    return res.json(chats);
  }

  // find specific chat with job_id and freelancer_id
  const chat = await Chat.findOne({
    job_id: jobID,
    freelancer_id: freelancerID,
    activated: true
  });

  // if a chat already exists, append to it
  if (chat) {
    const lastChatID = chats[0]._id;
    const chat = await getChatByChatId(lastChatID, chats[0]);
    chats[0] = chat;

    return res.json(chats);
  }

  // otherwise, this is a new chat being created
  // which requires to authorize a new chat between the two
  try {
    const {
      data: {
        deal: {
          job: {
            title: jobTitle,
            client: {
              first_name: clientFirstName,
              last_name: clientLastName,
              id: clientID
            }
          },
          freelancer: {
            first_name: freelancerFirstName,
            last_name: freelancerLastName
          }
        }
      }
    } = await authorizeChat(req, jobID, freelancerID);
    const freelancerName = `${freelancerFirstName} ${freelancerLastName}`;
    const clientName = `${clientFirstName} ${clientLastName}`;

    const newChatInstance = new Chat({
      job_id: jobID,
      job_title: jobTitle,
      freelancer_id: freelancerID,
      freelancer_name: freelancerName,
      client_id: clientID,
      client_name: clientName
    }).toObject();
    chats.unshift({
      ...newChatInstance,
      messages: {
        docs: [],
        limit,
        offset: 0,
        page: 1,
        pages: 1,
        total: 1
      }
    });
    return res.json(chats);
  } catch (error) {
    if (error && error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    return res.status(401).json({ error: "Can't authenticate this chat" });
  }
});

/* POST chat message. */
router.post('/', validate(chatValidationRules()), async function(req, res) {
  try {
    const io = req.app.get('io');
    const users = req.app.get('users');

    const {
      body: {
        job_title: jobTitle,
        job_id: jobID,
        message,
        chat_id: chatID,
        client_name: clientName,
        freelancer_name: freelancerName,
        freelancer_id,
        client_id
      },
      decodedToken: { user_id: userID, type: userType }
    } = req;

    const freelancerID = userType === 'Freelancer' ? userID : freelancer_id;
    const clientID = userType === 'Client' ? userID : client_id;

    const toID = userType === 'Client' ? freelancerID : clientID;
    const recieverSocketIDs = users[toID];

    // finding the chat by jID, cID and fID
    const chat = await Chat.findOne({
      job_id: jobID,
      freelancer_id: freelancerID,
      client_id: clientID,
      activated: true
    });

    // TODO: why it is mandatory to send chat id?
    // if not found, create a new one
    if (!chat && chatID) {
      const newChatInstance = new Chat({
        _id: chatID,
        job_id: jobID,
        job_title: jobTitle,
        freelancer_id: freelancerID,
        freelancer_name: freelancerName,
        client_id: clientID,
        client_name: clientName
      });

      const chatInstance = await newChatInstance.save();

      const newMessageInstance = new Message({
        message: message,
        sender_id: userID,
        // TODO: is chatInstance._id equal to chatID ?
        chat_id: chatInstance._id
      });

      const messageInstance = await newMessageInstance.save();

      // handling sockets
      if (recieverSocketIDs && recieverSocketIDs.length) {
        recieverSocketIDs.forEach((recieverSocketID: number | string) => {
          // TODO: revisit why sending chat instance instead of message instance.
          io.to(recieverSocketID).emit('message', chatInstance);
        });
      }

      return res.status(200).json(messageInstance);
    }

    // TODO: why it is mandatory to send chat id?
    if (!chat && !chatID) {
      return res.json({
        error: 'error'
      });
    }

    // if not, append the message to the messages of the chat
    const newMessageInstance = new Message({
      message: message,
      sender_id: userID,
      chat_id: chat.id
    });

    // Why? updating here to order chat descending with the last updated one
    // TODO: try to move to middlewares .. MessageSchema.post('save')
    await Chat.findByIdAndUpdate(chat.id, { updated_at: Date.now() });

    const messageInstance = await newMessageInstance.save();
    if (recieverSocketIDs && recieverSocketIDs.length) {
      recieverSocketIDs.forEach((recieverSocketID: number | string) => {
        io.to(recieverSocketID).emit('message', messageInstance);
      });
    }

    return res.status(200).json(messageInstance);
  } catch (err) {
    res.status(401).json({ message: err.message });
  }
});

export { router };
