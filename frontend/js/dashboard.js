const { token: dashboardToken, user: dashboardUser } = getTokenOrRedirect();
let taxChart;
let incomeChart;
let deductionChart;

document.getElementById('dashboardUser').textContent = `Welcome, ${dashboardUser.name}`;
document.getElementById('dashboardMeta').textContent = `${dashboardUser.email} | PAN ${dashboardUser.PAN}`;
document.getElementById('logoutButton').addEventListener('click', () => logoutUser(dashboardToken));
document.getElementById('dashboardYear').addEventListener('change', loadDashboard);

document.querySelectorAll('[data-question]').forEach((button) => {
  button.addEventListener('click', () => {
    document.getElementById('aiQuestion').value = button.dataset.question;
  });
});
document.getElementById('aiForm').addEventListener('submit', askAI);

loadDashboard();

async function loadDashboard() {
  const year = document.getElementById('dashboardYear').value;
  try {
    const response = await fetch(`/api/summary?financialYear=${encodeURIComponent(year)}`, {
      headers: apiHeaders(dashboardToken)
    });
    const summary = await response.json();
    if (!response.ok) throw new Error(summary.message || 'Unable to load dashboard');
    renderSummary(summary);
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function renderSummary(summary) {
  document.getElementById('totalIncome').textContent = formatRupees(summary.grossIncome);
  document.getElementById('totalDeductions').textContent = formatRupees(summary.totalDeductions);
  document.getElementById('taxableIncome').textContent = formatRupees(summary.taxableIncome);
  const finalTax = Math.min(summary.oldRegimeTax, summary.newRegimeTax);
  document.getElementById('finalTax').textContent = formatRupees(finalTax);
  document.getElementById('regimeBadge').textContent = `Save ${formatRupees(summary.savings)} by choosing ${summary.recommendedRegime}`;

  taxChart = drawChart(taxChart, 'taxComparisonChart', 'bar', ['Old Regime', 'New Regime'], [summary.oldRegimeTax, summary.newRegimeTax], ['#d7a93b', '#12715b']);
  incomeChart = drawChart(incomeChart, 'incomeBreakdownChart', 'doughnut', Object.keys(summary.incomeBreakdown), Object.values(summary.incomeBreakdown), ['#d7a93b', '#12715b', '#3b82f6', '#b45309', '#7c3aed']);
  deductionChart = drawChart(deductionChart, 'deductionChart', 'bar', Object.keys(summary.deductionsBySection), Object.values(summary.deductionsBySection), ['#d7a93b']);
}

function drawChart(existing, id, type, labels, data, colors) {
  if (existing) existing.destroy();
  return new Chart(document.getElementById(id), {
    type,
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: type === 'doughnut' } },
      scales: type === 'doughnut' ? {} : { y: { beginAtZero: true } }
    }
  });
}

async function askAI(event) {
  event.preventDefault();
  const button = event.target.querySelector('button[type="submit"]');
  const question = document.getElementById('aiQuestion').value.trim();
  if (!question) return;
  setLoading(button, true);

  try {
    const response = await fetch('/api/ai-advice', {
      method: 'POST',
      headers: apiHeaders(dashboardToken),
      body: JSON.stringify({ question, financialYear: document.getElementById('dashboardYear').value })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Unable to get AI advice');
    document.getElementById('aiResponse').textContent = result.advice;
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    setLoading(button, false);
  }
}
