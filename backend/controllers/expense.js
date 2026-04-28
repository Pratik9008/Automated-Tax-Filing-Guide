const Expense = require('../models/Expense');
const { calculateDeductionsFromExpenses } = require('../utils/taxCalculator');

function cleanExpensePayload(body) {
  return {
    section: body.section,
    category: body.category || '',
    amount: Number(body.amount),
    description: body.description || '',
    financialYear: body.financialYear || 'FY 2024-25'
  };
}

async function addExpense(req, res, next) {
  try {
    const payload = cleanExpensePayload(req.body);
    if (!payload.section || Number.isNaN(payload.amount)) {
      return res.status(400).json({ message: 'Section and amount are required' });
    }

    const expense = await Expense.create({ userId: req.userId, ...payload });
    return res.status(201).json({ message: 'Deduction added successfully', expense });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(error.errors)[0].message });
    }
    return next(error);
  }
}

async function getExpenses(req, res, next) {
  try {
    const filter = { userId: req.userId };
    if (req.query.financialYear) filter.financialYear = req.query.financialYear;

    const expenses = await Expense.find(filter).sort({ createdAt: -1 });
    return res.json({ expenses });
  } catch (error) {
    return next(error);
  }
}

async function updateExpense(req, res, next) {
  try {
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      cleanExpensePayload(req.body),
      { new: true, runValidators: true }
    );

    if (!expense) return res.status(404).json({ message: 'Deduction record not found' });
    return res.json({ message: 'Deduction updated successfully', expense });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(error.errors)[0].message });
    }
    return next(error);
  }
}

async function deleteExpense(req, res, next) {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!expense) return res.status(404).json({ message: 'Deduction record not found' });
    return res.json({ message: 'Deduction deleted successfully' });
  } catch (error) {
    return next(error);
  }
}

async function calculateDeductions(req, res, next) {
  try {
    const filter = { userId: req.userId };
    if (req.query.financialYear) filter.financialYear = req.query.financialYear;
    const expenses = await Expense.find(filter);
    return res.json(calculateDeductionsFromExpenses(expenses));
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  addExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
  calculateDeductions
};
