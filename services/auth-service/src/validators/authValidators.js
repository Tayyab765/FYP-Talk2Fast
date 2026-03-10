import { body } from 'express-validator';

export const signupValidator = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password min length 6'),
  body('full_name').notEmpty().withMessage('Full name required')
];

export const loginValidator = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required')
];

export const forgotPasswordValidator = [
  body('email').isEmail().withMessage('Valid email required')
];

function validateSignup(req, res, next) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  next();
}

function validateLogin(req, res, next) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  next();
}

function validateForgotPassword(req, res, next) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email required' });
  next();
}

export { validateSignup, validateLogin, validateForgotPassword };
