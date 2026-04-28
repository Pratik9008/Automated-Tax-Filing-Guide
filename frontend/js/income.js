const { token, user } = getTokenOrRedirect();
const incomeForm = document.getElementById('incomeForm');
const incomeList = document.getElementById('incomeList');
const filterYear = document.getElementById('filterYear');
const salaryFields = document.getElementById('salaryFields');
const typeInput = document.getElementById('type');
const resetButton = document.getElementById('resetButton');
const logoutButton = document.getElementById('logoutButton');
let incomes = [];

initTheme();

typeInput.addEventListener('change', toggleSalaryFields);
filterYear.addEventListener('change', loadIncome);
incomeForm.addEventListener('submit', saveIncome);
resetButton.addEventListener('click', resetIncomeForm);
logoutButton.addEventListener('click', () => logoutUser(token));

loadIncome();

function authHeaders() {
  return apiHeaders(token);
}

async function loadIncome() {
  try {
    const response = await fetch(`/api/income?financialYear=${encodeURIComponent(filterYear.value)}`, {
      headers: authHeaders()
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Unable to load income');
    }

    incomes = result.incomes;
    renderIncome();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function saveIncome(event) {
  event.preventDefault();
  clearErrors(incomeForm);

  const data = Object.fromEntries(new FormData(incomeForm));
  const id = data.incomeId;
  const payload = {
    type: data.type,
    amount: Number(data.amount),
    description: data.description,
    financialYear: data.financialYear,
    employerName: data.employerName,
    ctc: Number(data.ctc || 0),
    inHand: Number(data.inHand || 0)
  };

  if (!payload.type) {
    setError('type', 'Select an income type.');
    return;
  }

  if (Number.isNaN(payload.amount) || payload.amount <= 0) {
    setError('amount', 'Enter an amount greater than ₹0.');
    return;
  }

  const button = incomeForm.querySelector('button[type="submit"]');
  setLoading(button, true);

  try {
    const response = await fetch(id ? `/api/income/${id}` : '/api/income', {
      method: id ? 'PUT' : 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload)
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Unable to save income');
    }

    showToast(result.message, 'success');
    resetIncomeForm();
    filterYear.value = payload.financialYear;
    await loadIncome();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    setLoading(button, false);
  }
}

async function deleteIncome(id) {
  try {
    const response = await fetch(`/api/income/${id}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Unable to delete income');
    }

    showToast(result.message, 'success');
    await loadIncome();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function editIncome(id) {
  const income = incomes.find((item) => item._id === id);
  if (!income) return;

  document.getElementById('formTitle').textContent = 'Edit income';
  document.getElementById('incomeId').value = income._id;
  document.getElementById('financialYear').value = income.financialYear;
  document.getElementById('type').value = income.type;
  document.getElementById('amount').value = income.amount;
  document.getElementById('description').value = income.description || '';
  document.getElementById('employerName').value = income.employerName || '';
  document.getElementById('ctc').value = income.ctc || '';
  document.getElementById('inHand').value = income.inHand || '';
  toggleSalaryFields();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderIncome() {
  const total = incomes.reduce((sum, item) => sum + item.amount, 0);
  document.getElementById('incomeTotal').textContent = formatRupees(total);

  if (!incomes.length) {
    incomeList.innerHTML = '<div class="empty-state">No income records yet for this financial year.</div>';
    return;
  }

  incomeList.innerHTML = incomes.map((income) => `
    <article class="income-item">
      <div>
        <h3>${escapeHtml(income.type)} <span class="amount">${formatRupees(income.amount)}</span></h3>
        <p class="income-meta">${escapeHtml(income.financialYear)}${income.description ? ` · ${escapeHtml(income.description)}` : ''}</p>
        ${income.type === 'Salary' ? `<p class="income-meta">${escapeHtml(income.employerName || 'Employer not added')} · CTC ${formatRupees(income.ctc || 0)} · In-hand ${formatRupees(income.inHand || 0)}</p>` : ''}
      </div>
      <div class="row-actions">
        <button class="small-button" type="button" title="Edit" onclick="editIncome('${income._id}')">✎</button>
        <button class="small-button" type="button" title="Delete" onclick="deleteIncome('${income._id}')">×</button>
      </div>
    </article>
  `).join('');
}

function resetIncomeForm() {
  incomeForm.reset();
  document.getElementById('formTitle').textContent = 'Add income';
  document.getElementById('incomeId').value = '';
  document.getElementById('financialYear').value = filterYear.value;
  clearErrors(incomeForm);
  toggleSalaryFields();
}

function toggleSalaryFields() {
  salaryFields.classList.toggle('visible', typeInput.value === 'Salary');
}


