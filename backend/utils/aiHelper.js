const Income = require('../models/Income');
const Expense = require('../models/Expense');
const { buildTaxSummary } = require('./taxCalculator');

const SYSTEM_PROMPT = 'You are an expert Indian chartered accountant and tax advisor. Give specific, actionable advice based on the user income and deduction data. Always mention specific sections of Indian Income Tax Act. Keep responses concise and practical. For chat, be helpful and professional.';

function fallbackAdvice(summary, question) {
  const tips = [];
  if ((summary.deductionsBySection['80C'] || 0) < 150000) {
    tips.push('Increase Section 80C investments such as ELSS, PPF, LIC, NSC or home loan principal up to the Rs 1.5L limit.');
  }
  if ((summary.deductionsBySection['80D'] || 0) === 0) {
    tips.push('Consider health insurance premium deduction under Section 80D if eligible.');
  }
  if (summary.recommendedRegime === 'New Regime') {
    tips.push(`New Regime currently looks better by around Rs ${summary.savings.toLocaleString('en-IN')}.`);
  } else {
    tips.push(`Old Regime currently looks better by around Rs ${summary.savings.toLocaleString('en-IN')} because deductions are helping.`);
  }
  tips.push('Keep rent, investment, insurance and home loan proofs ready before filing.');

  return `Based on your question: "${question}"\n\n${tips.map((tip) => `- ${tip}`).join('\n')}`;
}

async function getAITaxAdvice(userId, question, financialYear = 'FY 2024-25') {
  try {
    const [incomes, expenses] = await Promise.all([
      Income.find({ userId, financialYear }),
      Expense.find({ userId, financialYear })
    ]);
    const summary = buildTaxSummary(incomes, expenses);

    // Try Groq
    if (process.env.GROQ_API_KEY && !process.env.GROQ_API_KEY.startsWith('replace')) {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
          temperature: 0.2,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            {
              role: 'user',
              content: `Question: ${question}\nFinancial year: ${financialYear}\nTax summary: ${JSON.stringify(summary)}`
            }
          ]
        })
      });

      const data = await response.json();
      if (response.ok) {
        return data.choices?.[0]?.message?.content || fallbackAdvice(summary, question);
      }
    }

    // Try Claude
    if (process.env.CLAUDE_API_KEY && !process.env.CLAUDE_API_KEY.startsWith('replace')) {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': process.env.CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 700,
          system: SYSTEM_PROMPT,
          messages: [{
            role: 'user',
            content: `Question: ${question}\nFinancial year: ${financialYear}\nTax summary: ${JSON.stringify(summary)}`
          }]
        })
      });

      const data = await response.json();
      if (response.ok) {
        return data.content?.[0]?.text || fallbackAdvice(summary, question);
      }
    }

    return fallbackAdvice(summary, question);
  } catch (error) {
    console.error('AI Helper Error:', error);
    return 'I apologize, but I am having trouble connecting to my AI core right now. Please try again in a moment.';
  }
}

module.exports = { getAITaxAdvice };
