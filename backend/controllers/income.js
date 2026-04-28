const Income = require('../models/Income');

function cleanIncomePayload(body) {
  return {
    type: body.type,
    amount: Number(body.amount),
    description: body.description || '',
    financialYear: body.financialYear || 'FY 2024-25',
    employerName: body.employerName || '',
    ctc: body.ctc ? Number(body.ctc) : 0,
    inHand: body.inHand ? Number(body.inHand) : 0
  };
}

async function addIncome(req, res, next) {
  try {
    const payload = cleanIncomePayload(req.body);

    if (!payload.type || Number.isNaN(payload.amount)) {
      return res.status(400).json({ message: 'Income type and amount are required' });
    }

    const income = await Income.create({
      userId: req.userId,
      ...payload
    });

    return res.status(201).json({
      message: 'Income added successfully',
      income
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(error.errors)[0].message });
    }
    return next(error);
  }
}

async function getIncome(req, res, next) {
  try {
    const filter = { userId: req.userId };
    if (req.query.financialYear) {
      filter.financialYear = req.query.financialYear;
    }

    const incomes = await Income.find(filter).sort({ createdAt: -1 });
    return res.json({ incomes });
  } catch (error) {
    return next(error);
  }
}

async function updateIncome(req, res, next) {
  try {
    const payload = cleanIncomePayload(req.body);
    const income = await Income.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      payload,
      { new: true, runValidators: true }
    );

    if (!income) {
      return res.status(404).json({ message: 'Income record not found' });
    }

    return res.json({
      message: 'Income updated successfully',
      income
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(error.errors)[0].message });
    }
    return next(error);
  }
}

async function deleteIncome(req, res, next) {
  try {
    const income = await Income.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!income) {
      return res.status(404).json({ message: 'Income record not found' });
    }

    return res.json({ message: 'Income deleted successfully' });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  addIncome,
  getIncome,
  updateIncome,
  deleteIncome
};
