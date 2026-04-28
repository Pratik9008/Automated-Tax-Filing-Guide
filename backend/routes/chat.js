const express = require('express');
const verifyToken = require('../middleware/auth');
const {
  startChat,
  sendMessage,
  getUserChats,
  getChat,
  closeChat,
  addSupportResponse
} = require('../controllers/chat');

const router = express.Router();

// User routes
router.post('/chats/start', verifyToken, startChat);
router.post('/chats/message', verifyToken, sendMessage);
router.get('/chats', verifyToken, getUserChats);
router.get('/chats/:chatId', verifyToken, getChat);
router.put('/chats/:chatId/close', verifyToken, closeChat);

// Admin/Support routes
router.post('/chats/support/response', verifyToken, addSupportResponse);

module.exports = router;
