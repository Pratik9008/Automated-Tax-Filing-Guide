const API_BASE = '/api';
const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const themeToggle = document.querySelector('[data-theme-toggle]');

initTheme();

if (themeToggle) {
  themeToggle.addEventListener('click', toggleTheme);
}

if ((location.pathname === '/' || location.pathname.endsWith('/index.html')) && localStorage.getItem('taxAdvisorToken')) {
  window.location.href = 'dashboard.html';
}

if (loginForm) {
  loginForm.addEventListener('submit', handleLogin);
}

if (signupForm) {
  const panInput = document.getElementById('PAN');
  panInput.addEventListener('input', () => {
    panInput.value = panInput.value.toUpperCase();
  });
  signupForm.addEventListener('submit', handleSignup);
}

function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark');
  }
}

function toggleTheme() {
  document.body.classList.toggle('dark');
  localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
}

async function handleLogin(event) {
  event.preventDefault();
  clearErrors(loginForm);

  const data = Object.fromEntries(new FormData(loginForm));
  if (!validateLogin(data)) return;

  await submitAuth('/login', data, loginForm);
}

async function handleSignup(event) {
  event.preventDefault();
  clearErrors(signupForm);

  const data = Object.fromEntries(new FormData(signupForm));
  data.PAN = data.PAN.toUpperCase().trim();

  if (!validateSignup(data)) return;

  await submitAuth('/register', data, signupForm);
}

async function submitAuth(path, payload, form) {
  const button = form.querySelector('button[type="submit"]');
  setLoading(button, true);

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Something went wrong');
    }

    localStorage.setItem('taxAdvisorToken', result.token);
    localStorage.setItem('taxAdvisorUser', JSON.stringify(result.user));

    showToast(result.message || 'Success', 'success');

    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 650);
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    setLoading(button, false);
  }
}

function validateLogin(data) {
  let valid = true;

  if (!isEmail(data.email)) {
    setError('email', 'Enter a valid email address.');
    valid = false;
  }

  if (!data.password || data.password.length < 8) {
    setError('password', 'Password must be at least 8 characters.');
    valid = false;
  }

  return valid;
}

function validateSignup(data) {
  let valid = validateLogin(data);

  if (!data.name || data.name.trim().length < 2) {
    setError('name', 'Enter your full name.');
    valid = false;
  }

  if (!panPattern.test(data.PAN)) {
    setError('PAN', 'Enter a valid PAN, for example ABCDE1234F.');
    valid = false;
  }

  return valid;
}

function isEmail(value) {
  return /^\S+@\S+\.\S+$/.test(String(value || '').trim());
}

function setError(field, message) {
  const input = document.getElementById(field);
  const error = document.querySelector(`[data-error-for="${field}"]`);

  if (input) input.classList.add('invalid');
  if (error) error.textContent = message;
}

function clearErrors(form) {
  form.querySelectorAll('.field-error').forEach((node) => {
    node.textContent = '';
  });
  form.querySelectorAll('.invalid').forEach((node) => {
    node.classList.remove('invalid');
  });
}

function setLoading(button, isLoading) {
  button.disabled = isLoading;
  button.classList.toggle('loading', isLoading);
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 4200);
}
