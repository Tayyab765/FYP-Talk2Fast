import { body, param } from 'express-validator';

export const sendMessageValidator = [
  body('message').isString().notEmpty().withMessage('message required')
];

export const userIdParamValidator = [
  param('userId').isUUID().withMessage('userId must be a UUID')
];

function validateMessage(req, res, next) {
  const { recipient_id, message } = req.body;
  if (!recipient_id || !message) return res.status(400).json({ error: 'recipient_id and message required' });
  next();
}

export { validateMessage };
