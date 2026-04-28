const express = require('express');
const verifyToken = require('../middleware/auth');
const { getTaxSummary } = require('../controllers/tax');

const router = express.Router();

router.get('/summary', verifyToken, getTaxSummary);

module.exports = router;
