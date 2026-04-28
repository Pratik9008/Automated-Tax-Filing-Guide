const express = require('express');
const verifyToken = require('../middleware/auth');
const {
  addIncome,
  getIncome,
  updateIncome,
  deleteIncome
} = require('../controllers/income');

const router = express.Router();

router.use(verifyToken);

router.post('/income', addIncome);
router.get('/income', getIncome);
router.put('/income/:id', updateIncome);
router.delete('/income/:id', deleteIncome);

module.exports = router;
