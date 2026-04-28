const { token: expenseToken } = getTokenOrRedirect();
const expenseForm = document.getElementById('expenseForm');
const expenseList = document.getElementById('expenseList');
const expenseFilterYear = document.getElementById('filterYear');
let expenses = [];

expenseForm.addEventListener('submit', saveExpense);
expenseFilterYear.addEventListener('change', loadExpenses);
document.getElementById('resetButton').addEventListener('click', resetExpenseForm);
document.getElementById('logoutButton').addEventListener('click', () => logoutUser(expenseToken));

loadExpenses();

async function loadExpenses() {
  try {
    const response = await fetch(`/api/expense?financialYear=${encodeURIComponent(expenseFilterYear.value)}`, {
      headers: apiHeaders(expenseToken)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Unable to load deductions');
    expenses = result.expenses;
    renderExpenses();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function saveExpense(event) {
  event.preventDefault();
  clearErrors(expenseForm);
  const data = Object.fromEntries(new FormData(expenseForm));
  const id = data.expenseId;
  const payload = {
    section: data.section,
    category: data.category,
    amount: Number(data.amount),
    description: data.description,
    financialYear: data.financialYear
  };

  if (!payload.section) return setError('section', 'Select a deduction section.');
  if (Number.isNaN(payload.amount) || payload.amount <= 0) return setError('amount', 'Enter an amount greater than ₹0.');

  const button = expenseForm.querySelector('button[type="submit"]');
  setLoading(button, true);
  try {
    const response = await fetch(id ? `/api/expense/${id}` : '/api/expense', {
      method: id ? 'PUT' : 'POST',
      headers: apiHeaders(expenseToken),
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Unable to save deduction');
    showToast(result.message, 'success');
    expenseFilterYear.value = payload.financialYear;
    resetExpenseForm();
    await loadExpenses();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    setLoading(button, false);
  }
}

function renderExpenses() {
  const total = expenses.reduce((sum, item) => sum + item.amount, 0);
  document.getElementById('expenseTotal').textContent = formatRupees(total);
  if (!expenses.length) {
    expenseList.innerHTML = '<div class="empty-state">No deduction records yet for this financial year.</div>';
    return;
  }

  expenseList.innerHTML = expenses.map((expense) => `
    <article class="income-item">
      <div>
        <h3>${escapeHtml(expense.section)} <span class="amount">${formatRupees(expense.amount)}</span></h3>
        <p class="income-meta">${escapeHtml(expense.category || 'Deduction')} | ${escapeHtml(expense.financialYear)}${expense.description ? ` | ${escapeHtml(expense.description)}` : ''}</p>
      </div>
      <div class="row-actions">
        <button class="small-button" type="button" title="Edit" onclick="editExpense('${expense._id}')">✎</button>
        <button class="small-button" type="button" title="Delete" onclick="deleteExpense('${expense._id}')">×</button>
      </div>
    </article>
  `).join('');
}

async function deleteExpense(id) {
  try {
    const response = await fetch(`/api/expense/${id}`, {
      method: 'DELETE',
      headers: apiHeaders(expenseToken)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Unable to delete deduction');
    showToast(result.message, 'success');
    await loadExpenses();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function editExpense(id) {
  const expense = expenses.find((item) => item._id === id);
  if (!expense) return;
  document.getElementById('formTitle').textContent = 'Edit deduction';
  document.getElementById('expenseId').value = expense._id;
  document.getElementById('financialYear').value = expense.financialYear;
  document.getElementById('section').value = expense.section;
  document.getElementById('category').value = expense.category || '';
  document.getElementById('amount').value = expense.amount;
  document.getElementById('description').value = expense.description || '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetExpenseForm() {
  expenseForm.reset();
  document.getElementById('formTitle').textContent = 'Add deduction';
  document.getElementById('expenseId').value = '';
  document.getElementById('financialYear').value = expenseFilterYear.value;
  clearErrors(expenseForm);
}
