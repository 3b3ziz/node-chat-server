import jwt from 'jsonwebtoken';
import { RequestHandler } from 'express';

const authenticate: RequestHandler = function(req, res, next) {
  try {
    const authHeader = req.get('Authorization');
    const authToken = authHeader.split(' ')[1];
    const secretKey = process.env.SECRET_KEY;
    const decodedToken = jwt.verify(authToken, secretKey) as DecodedToken;
    if (!decodedToken.activated)
      return res.status(403).json({ error: 'User is deactivated' });

    req.decodedToken = decodedToken;
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ error: 'User is unauthorized to perform this action' });
  }
};

export { authenticate };
