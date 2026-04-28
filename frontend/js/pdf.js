const { token: reportToken, user: reportUser } = getTokenOrRedirect();
document.getElementById('logoutButton').addEventListener('click', () => logoutUser(reportToken));
document.getElementById('generateReportButton').addEventListener('click', generatePDFReport);

async function generatePDFReport() {
  const button = document.getElementById('generateReportButton');
  const financialYear = document.getElementById('reportYear').value;
  setLoading(button, true);
  try {
    const [summaryRes, incomeRes, expenseRes, adviceRes] = await Promise.all([
      fetch(`/api/summary?financialYear=${encodeURIComponent(financialYear)}`, { headers: apiHeaders(reportToken) }),
      fetch(`/api/income?financialYear=${encodeURIComponent(financialYear)}`, { headers: apiHeaders(reportToken) }),
      fetch(`/api/expense?financialYear=${encodeURIComponent(financialYear)}`, { headers: apiHeaders(reportToken) }),
      fetch('/api/ai-advice', {
        method: 'POST',
        headers: apiHeaders(reportToken),
        body: JSON.stringify({ financialYear, question: 'Give 3 to 5 tax tips for my report.' })
      })
    ]);

    const summary = await summaryRes.json();
    const incomeData = await incomeRes.json();
    const expenseData = await expenseRes.json();
    const adviceData = await adviceRes.json();

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let y = 16;
    doc.setFontSize(18);
    doc.text('Automated Tax Filing Guide', 14, y);
    y += 10;
    doc.setFontSize(11);
    doc.text(`Name: ${reportUser.name}`, 14, y);
    y += 7;
    doc.text(`PAN: ${reportUser.PAN}`, 14, y);
    y += 7;
    doc.text(`Financial Year: ${financialYear}`, 14, y);
    y += 10;

    doc.text(`Gross Income: ${formatRupees(summary.grossIncome)}`, 14, y);
    y += 7;
    doc.text(`Total Deductions: ${formatRupees(summary.totalDeductions)}`, 14, y);
    y += 7;
    doc.text(`Taxable Income: ${formatRupees(summary.taxableIncome)}`, 14, y);
    y += 7;
    doc.text(`Old Regime Tax: ${formatRupees(summary.oldRegimeTax)}`, 14, y);
    y += 7;
    doc.text(`New Regime Tax: ${formatRupees(summary.newRegimeTax)}`, 14, y);
    y += 7;
    doc.text(`Recommended: ${summary.recommendedRegime} | Savings: ${formatRupees(summary.savings)}`, 14, y);
    y += 12;

    y = addSection(doc, 'Income Statement', incomeData.incomes.map((i) => `${i.type}: ${formatRupees(i.amount)} (${i.financialYear})`), y);
    y = addSection(doc, 'Deductions', expenseData.expenses.map((e) => `${e.section} - ${e.category || 'Deduction'}: ${formatRupees(e.amount)}`), y);
    addSection(doc, 'AI Tax Tips', String(adviceData.advice || '').split('\n').filter(Boolean).slice(0, 8), y);

    doc.save(`tax-report-${financialYear.replace(/\s/g, '-')}.pdf`);
    showToast('PDF report generated', 'success');
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    setLoading(button, false);
  }
}

function addSection(doc, title, rows, y) {
  if (y > 250) {
    doc.addPage();
    y = 16;
  }
  doc.setFontSize(14);
  doc.text(title, 14, y);
  y += 8;
  doc.setFontSize(10);
  (rows.length ? rows : ['No records added']).forEach((row) => {
    if (y > 280) {
      doc.addPage();
      y = 16;
    }
    doc.text(String(row).replace(/^-\s*/, '- '), 18, y, { maxWidth: 176 });
    y += 7;
  });
  return y + 5;
}
