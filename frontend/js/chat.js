// Get JWT token from localStorage
const getToken = () => localStorage.getItem('taxAdvisorToken');

// Logout function
const logoutUser = () => {
  localStorage.removeItem('taxAdvisorToken');
  localStorage.removeItem('taxAdvisorUser');
  window.location.href = 'index.html';
};

// Load all chats for the user
const loadChats = async () => {
  try {
    const response = await fetch('/api/chats', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Error loading chats:', data.message);
      return;
    }

    const chatsList = document.getElementById('chatsList');
    
    if (data.chats.length === 0) {
      chatsList.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">No chats yet</p>';
      return;
    }

    chatsList.innerHTML = data.chats.map(chat => `
      <div class="chat-item" onclick="loadChat('${chat._id}')">
        <div class="chat-item-title">${chat.subject}</div>
        <div class="chat-item-meta">Status: ${chat.status}</div>
        <div class="chat-item-meta">${new Date(chat.updatedAt).toLocaleDateString()}</div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('chatsList').innerHTML = '<p style="color: red;">Error loading chats</p>';
  }
};

// Load a specific chat
const loadChat = async (chatId) => {
  try {
    const response = await fetch(`/api/chats/${chatId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Error loading chat:', data.message);
      return;
    }

    const chat = data.chat;
    displayChat(chat);

    // Update active state
    document.querySelectorAll('.chat-item').forEach(item => item.classList.remove('active'));
    event.target.closest('.chat-item')?.classList.add('active');
  } catch (error) {
    console.error('Error:', error);
  }
};

// Display chat in the main area
const displayChat = (chat) => {
  const statusClass = `status-${chat.status}`;
  
  const messagesHTML = chat.messages.map(msg => `
    <div class="message ${msg.sender}">
      <div>
        <div class="message-content">${escapeHtml(msg.message)}</div>
        <div class="message-time">${new Date(msg.timestamp).toLocaleTimeString()}</div>
      </div>
    </div>
  `).join('');

  const closeBtn = chat.status !== 'closed' ? `<button class="btn-secondary" onclick="closeChat('${chat._id}')" style="margin-left: 10px;">Close Chat</button>` : '';

  const chatMain = document.getElementById('chatMain');
  chatMain.innerHTML = `
    <div class="chat-header">
      <div>
        <h3>${chat.subject}</h3>
        <span class="chat-status ${statusClass}">${chat.status.toUpperCase()}</span>
      </div>
      <div>
        ${closeBtn}
      </div>
    </div>
    <div class="messages" id="messagesContainer">
      ${messagesHTML}
    </div>
    <div class="input-area">
      <textarea id="messageInput" placeholder="Type your message..." ${chat.status === 'closed' ? 'disabled' : ''}></textarea>
      <button onclick="sendMessage('${chat._id}')" ${chat.status === 'closed' ? 'disabled' : ''}>Send</button>
    </div>
  `;

  // Scroll to bottom
  setTimeout(() => {
    const messagesContainer = document.getElementById('messagesContainer');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }, 0);

  // Store current chat ID for sending messages
  window.currentChatId = chat._id;
};

// Send a message
const sendMessage = async (chatId) => {
  const messageInput = document.getElementById('messageInput');
  const message = messageInput.value.trim();

  if (!message) {
    alert('Please enter a message');
    return;
  }

  try {
    const response = await fetch('/api/chats/message', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chatId,
        message
      })
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || 'Error sending message');
      return;
    }

    messageInput.value = '';
    displayChat(data.chat);
  } catch (error) {
    console.error('Error:', error);
    alert('Error sending message');
  }
};

// Create a new chat
const createNewChat = async (event) => {
  event.preventDefault();

  const subject = document.getElementById('subject').value;
  const category = document.getElementById('category').value;
  const message = document.getElementById('initialMessage').value;

  if (!subject || !message) {
    alert('Please fill in all required fields');
    return;
  }

  try {
    const response = await fetch('/api/chats/start', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subject,
        category,
        message
      })
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || 'Error creating chat');
      return;
    }

    closeNewChatForm();
    document.getElementById('newChatForm').reset();
    loadChats();
    displayChat(data.chat);
  } catch (error) {
    console.error('Error:', error);
    alert('Error creating chat');
  }
};

// Close a chat
const closeChat = async (chatId) => {
  if (!confirm('Are you sure you want to close this chat?')) {
    return;
  }

  try {
    const response = await fetch(`/api/chats/${chatId}/close`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || 'Error closing chat');
      return;
    }

    displayChat(data.chat);
    loadChats();
  } catch (error) {
    console.error('Error:', error);
    alert('Error closing chat');
  }
};

// Show new chat form
const showNewChatForm = () => {
  document.getElementById('newChatModal').style.display = 'flex';
};

// Close new chat form
const closeNewChatForm = () => {
  document.getElementById('newChatModal').style.display = 'none';
};

// Close modal when clicking outside
window.onclick = function(event) {
  const modal = document.getElementById('newChatModal');
  if (event.target == modal) {
    modal.style.display = 'none';
  }
};

// Escape HTML to prevent XSS
const escapeHtml = (text) => {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
};

// Load chats on page load
document.addEventListener('DOMContentLoaded', () => {
  // Check if user is logged in
  const token = getToken();
  if (!token) {
    window.location.href = 'index.html';
    return;
  }

  loadChats();

  // Reload chats every 5 seconds
  setInterval(() => {
    loadChats();
    if (window.currentChatId) {
      loadChat(window.currentChatId);
    }
  }, 5000);
});
