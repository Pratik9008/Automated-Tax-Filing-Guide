const { getAITaxAdvice } = require('../utils/aiHelper');

async function getTaxAdvice(req, res, next) {
  try {
    const { question, financialYear = 'FY 2024-25' } = req.body;
    if (!question) return res.status(400).json({ message: 'Question is required' });

    const advice = await getAITaxAdvice(req.userId, question, financialYear);

    return res.json({
      advice,
      source: 'ai-helper'
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { getTaxAdvice };
