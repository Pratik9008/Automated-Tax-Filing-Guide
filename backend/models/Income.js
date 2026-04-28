const mongoose = require('mongoose');

const incomeTypes = [
  'Salary',
  'Freelance / Consulting',
  'Business income',
  'Rental income',
  'Other sources'
];

const incomeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    required: [true, 'Income type is required'],
    enum: incomeTypes
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
  employerName: {
    type: String,
    trim: true,
    default: ''
  },
  ctc: {
    type: Number,
    min: [0, 'CTC cannot be negative'],
    default: 0
  },
  inHand: {
    type: Number,
    min: [0, 'In-hand salary cannot be negative'],
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Income', incomeSchema);
