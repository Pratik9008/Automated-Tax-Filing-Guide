const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  section: {
    type: String,
    required: [true, 'Deduction section is required'],
    enum: ['80C', '80D', '80TTA', 'HRA', 'Standard Deduction', '24B']
  },
  category: {
    type: String,
    trim: true,
    default: ''
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  financialYear: {
    type: String,
    required: [true, 'Financial year is required'],
    enum: ['FY 2024-25', 'FY 2023-24'],
    default: 'FY 2024-25'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Expense', expenseSchema);
