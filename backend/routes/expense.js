const express = require('express');
const verifyToken = require('../middleware/auth');
const {
  addExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
  calculateDeductions
} = require('../controllers/expense');

const router = express.Router();

router.use(verifyToken);
router.post('/expense', addExpense);
router.get('/expense', getExpenses);
router.get('/deductions', calculateDeductions);
router.put('/expense/:id', updateExpense);
router.delete('/expense/:id', deleteExpense);

module.exports = router;
