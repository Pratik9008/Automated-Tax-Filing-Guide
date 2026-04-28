const Chat = require('../models/Chat');
const { getAITaxAdvice } = require('../utils/aiHelper');

// Start a new chat
const startChat = async (req, res) => {
  try {
    const { subject, category, message } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!subject || !message) {
      return res.status(400).json({
        message: 'Subject and message are required'
      });
    }

    // Create new chat
    const newChat = new Chat({
      userId,
      subject,
      category: category || 'general-inquiry',
      messages: [{
        sender: 'user',
        message,
        timestamp: new Date()
      }]
    });

    await newChat.save();

    // Trigger AI Response in background
    (async () => {
      try {
        const aiAdvice = await getAITaxAdvice(userId, message);
        const chat = await Chat.findById(newChat._id);
        if (chat && chat.status !== 'closed') {
          chat.messages.push({
            sender: 'support',
            message: aiAdvice,
            timestamp: new Date()
          });
          chat.status = 'in-progress';
          await chat.save();
        }
      } catch (e) {
        console.error('AI Chat Response Error:', e);
      }
    })();

    res.status(201).json({
      message: 'Chat started successfully',
      chatId: newChat._id,
      chat: newChat
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Error starting chat'
    });
  }
};

// Send a message in a chat
const sendMessage = async (req, res) => {
  try {
    const { chatId, message } = req.body;
    const userId = req.user.id;

    if (!message) {
      return res.status(400).json({
        message: 'Message cannot be empty'
      });
    }

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        message: 'Chat not found'
      });
    }

    if (chat.userId.toString() !== userId) {
      return res.status(403).json({
        message: 'Unauthorized to access this chat'
      });
    }

    chat.messages.push({
      sender: 'user',
      message,
      timestamp: new Date()
    });

    chat.updatedAt = new Date();
    await chat.save();

    // Trigger AI Response in background
    (async () => {
      try {
        const aiAdvice = await getAITaxAdvice(userId, message);
        const currentChat = await Chat.findById(chatId);
        if (currentChat && currentChat.status !== 'closed') {
          currentChat.messages.push({
            sender: 'support',
            message: aiAdvice,
            timestamp: new Date()
          });
          currentChat.status = 'in-progress';
          await currentChat.save();
        }
      } catch (e) {
        console.error('AI Chat Response Error:', e);
      }
    })();

    res.status(200).json({
      message: 'Message sent successfully',
      chat
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Error sending message'
    });
  }
};

// Get all chats for a user
const getUserChats = async (req, res) => {
  try {
    const userId = req.user.id;

    const chats = await Chat.find({ userId })
      .sort({ updatedAt: -1 })
      .select('_id subject status priority category createdAt updatedAt');

    res.status(200).json({
      chats,
      count: chats.length
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Error fetching chats'
    });
  }
};

// Get a specific chat
const getChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    const chat = await Chat.findById(chatId).populate('userId', 'name email');

    if (!chat) {
      return res.status(404).json({
        message: 'Chat not found'
      });
    }

    if (chat.userId._id.toString() !== userId) {
      return res.status(403).json({
        message: 'Unauthorized to access this chat'
      });
    }

    res.status(200).json({ chat });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Error fetching chat'
    });
  }
};

// Close a chat
const closeChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        message: 'Chat not found'
      });
    }

    if (chat.userId.toString() !== userId) {
      return res.status(403).json({
        message: 'Unauthorized to close this chat'
      });
    }

    chat.status = 'closed';
    chat.updatedAt = new Date();
    await chat.save();

    res.status(200).json({
      message: 'Chat closed successfully',
      chat
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Error closing chat'
    });
  }
};

// Add support agent response (for admin use)
const addSupportResponse = async (req, res) => {
  try {
    const { chatId, message } = req.body;

    if (!message) {
      return res.status(400).json({
        message: 'Message cannot be empty'
      });
    }

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        message: 'Chat not found'
      });
    }

    chat.messages.push({
      sender: 'support',
      message,
      timestamp: new Date()
    });

    chat.status = 'in-progress';
    chat.updatedAt = new Date();
    await chat.save();

    res.status(200).json({
      message: 'Support response added successfully',
      chat
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Error adding support response'
    });
  }
};

module.exports = {
  startChat,
  sendMessage,
  getUserChats,
  getChat,
  closeChat,
  addSupportResponse
};
