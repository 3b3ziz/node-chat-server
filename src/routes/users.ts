import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { validate, userValidationRules } from '../middlewares/validate';
import { Chat } from '../db/models/chat';

const router = Router();
router.use(authenticate);

router.post(
  ['/:id/activate', '/:id/deactivate'],
  validate(userValidationRules()),
  async function(req, res) {
    const {
      decodedToken: { type },
      params: { id: userID },
      body: { user_type: userType }
    } = req;

    const requestPath = req.path.split('/');
    const activated = requestPath[requestPath.length - 1] !== 'deactivate';

    if (type !== 'Admin')
      return res
        .status(401)
        .json({ error: 'User is unauthorized to perform this action' });

    try {
      const queryObject = {
        // https://stackoverflow.com/a/46857668/8373219
        ...(userType === 'Client' && { client_id: userID }),
        ...(userType === 'Freelancer' && { freelancer_id: userID })
      };
      await Chat.updateMany(queryObject, { activated });
      return res.json({});
    } catch (err) {
      return res.json({ error: err });
    }
  }
);

export { router };
