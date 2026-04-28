const Income = require('../models/Income');
const Expense = require('../models/Expense');
const { buildTaxSummary } = require('../utils/taxCalculator');

async function getTaxSummary(req, res, next) {
  try {
    const financialYear = req.query.financialYear || 'FY 2024-25';
    const [incomes, expenses] = await Promise.all([
      Income.find({ userId: req.userId, financialYear }),
      Expense.find({ userId: req.userId, financialYear })
    ]);

    return res.json({
      financialYear,
      ...buildTaxSummary(incomes, expenses)
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { getTaxSummary };
