const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'development_secret_change_me';
const TOKEN_EXPIRES_IN = '7d';

function createToken(user) {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRES_IN }
  );
}

function sanitizeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    PAN: user.PAN,
    createdAt: user.createdAt
  };
}

async function registerUser(req, res, next) {
  try {
    const { name, email, password, PAN } = req.body;

    if (!name || !email || !password || !PAN) {
      return res.status(400).json({ message: 'Name, email, password and PAN are required' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const normalizedPAN = String(PAN).toUpperCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: hashedPassword,
      PAN: normalizedPAN
    });

    const token = createToken(user);

    return res.status(201).json({
      message: 'Registration successful',
      token,
      user: sanitizeUser(user)
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(error.errors)[0].message });
    }
    if (error.code === 11000) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }
    return next(error);
  }
}

async function loginUser(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = createToken(user);

    return res.json({
      message: 'Login successful',
      token,
      user: sanitizeUser(user)
    });
  } catch (error) {
    return next(error);
  }
}

async function logoutUser(req, res) {
  return res.json({
    message: 'Logout successful. Please remove the token from client storage.'
  });
}

module.exports = {
  registerUser,
  loginUser,
  logoutUser
};
