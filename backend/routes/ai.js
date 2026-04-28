const express = require('express');
const verifyToken = require('../middleware/auth');
const { getTaxAdvice } = require('../controllers/ai');

const router = express.Router();

router.post('/ai-advice', verifyToken, getTaxAdvice);

module.exports = router;
