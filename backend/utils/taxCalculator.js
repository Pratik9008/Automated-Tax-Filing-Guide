function slabTax(taxableIncome, slabs) {
  let tax = 0;
  let previousLimit = 0;

  for (const slab of slabs) {
    const upperLimit = slab.limit;
    const amountInSlab = Math.max(0, Math.min(taxableIncome, upperLimit) - previousLimit);
    tax += amountInSlab * slab.rate;
    previousLimit = upperLimit;
    if (taxableIncome <= upperLimit) break;
  }

  return tax;
}

function calculateOldRegimeTax(taxableIncome) {
  const tax = slabTax(taxableIncome, [
    { limit: 250000, rate: 0 },
    { limit: 500000, rate: 0.05 },
    { limit: 1000000, rate: 0.2 },
    { limit: Infinity, rate: 0.3 }
  ]);

  return Math.round(tax * 1.04);
}

function calculateNewRegimeTax(grossIncome) {
  const taxableIncome = Math.max(0, grossIncome - 75000);

  if (taxableIncome <= 700000) {
    return { taxableIncome, tax: 0 };
  }

  const tax = slabTax(taxableIncome, [
    { limit: 300000, rate: 0 },
    { limit: 700000, rate: 0.05 },
    { limit: 1000000, rate: 0.1 },
    { limit: 1200000, rate: 0.15 },
    { limit: 1500000, rate: 0.2 },
    { limit: Infinity, rate: 0.3 }
  ]);

  return { taxableIncome, tax: Math.round(tax * 1.04) };
}

function calculateTax(income, regime, deductions = 0) {
  if (regime === 'old') {
    return calculateOldRegimeTax(Math.max(0, income - deductions));
  }

  return calculateNewRegimeTax(income).tax;
}

function calculateDeductionsFromExpenses(expenses) {
  const totals = expenses.reduce((acc, expense) => {
    acc[expense.section] = (acc[expense.section] || 0) + expense.amount;
    return acc;
  }, {});

  const eligibleBySection = {
    '80C': Math.min(totals['80C'] || 0, 150000),
    '80D': Math.min(totals['80D'] || 0, 25000),
    '80TTA': Math.min(totals['80TTA'] || 0, 10000),
    HRA: totals.HRA || 0,
    'Standard Deduction': Math.min(totals['Standard Deduction'] || 50000, 50000),
    '24B': Math.min(totals['24B'] || 0, 200000)
  };

  const totalEligibleDeductions = Object.values(eligibleBySection).reduce((sum, value) => sum + value, 0);

  return {
    rawBySection: totals,
    eligibleBySection,
    totalEligibleDeductions
  };
}

function buildTaxSummary(incomes, expenses) {
  const grossIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
  const incomeBreakdown = incomes.reduce((acc, income) => {
    acc[income.type] = (acc[income.type] || 0) + income.amount;
    return acc;
  }, {});

  const deductions = calculateDeductionsFromExpenses(expenses);
  const taxableIncome = Math.max(0, grossIncome - deductions.totalEligibleDeductions);
  const oldRegimeTax = calculateOldRegimeTax(taxableIncome);
  const newRegime = calculateNewRegimeTax(grossIncome);
  const newRegimeTax = newRegime.tax;
  const recommendedRegime = oldRegimeTax <= newRegimeTax ? 'Old Regime' : 'New Regime';
  const savings = Math.abs(oldRegimeTax - newRegimeTax);

  return {
    grossIncome,
    totalDeductions: deductions.totalEligibleDeductions,
    taxableIncome,
    oldRegimeTax,
    newRegimeTax,
    newRegimeTaxableIncome: newRegime.taxableIncome,
    recommendedRegime,
    savings,
    incomeBreakdown,
    deductionsBySection: deductions.eligibleBySection
  };
}

module.exports = {
  calculateTax,
  calculateDeductionsFromExpenses,
  buildTaxSummary
};
