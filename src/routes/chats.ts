import { Router } from 'express';
import { Chat } from '../db/models/chat';
import { Message } from '../db/models/message';
import { authenticate } from '../middlewares/authenticate';
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
    decodedToken: { user_id: userID, type: userType }
  } = req;

  const queryObject = {
    // https://stackoverflow.com/a/46857668/8373219
    ...(userType === 'Client' && { client_id: userID }),
    ...(userType === 'Freelancer' && { freelancer_id: userID }),
    activated: true
  };

  const chats = await Chat.find(queryObject)
    .sort({ updated_at: -1 })
    .lean();

  // populate last chat with messages
  const lastChatID = chats[0]._id;
  const chat = await getChatByChatId(lastChatID, chats[0]);
  chats[0] = chat;

  return res.json(chats);
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
