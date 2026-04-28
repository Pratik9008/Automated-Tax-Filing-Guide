function getTokenOrRedirect() {
  const token = localStorage.getItem('taxAdvisorToken');
  const user = JSON.parse(localStorage.getItem('taxAdvisorUser') || 'null');
  if (!token || !user) window.location.href = 'index.html';
  return { token, user };
}

function apiHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };
}

function formatRupees(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value || 0);
}

async function logoutUser(token) {
  try {
    await fetch('/api/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
  } finally {
    localStorage.removeItem('taxAdvisorToken');
    localStorage.removeItem('taxAdvisorUser');
    window.location.href = 'index.html';
  }
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[char]));
}
