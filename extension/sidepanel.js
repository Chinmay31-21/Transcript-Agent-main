const API_BASE = 'http://localhost:8000/api';

const chatBox = document.getElementById('chat-box');
const queryInput = document.getElementById('query-input');
const sendBtn = document.getElementById('send-btn');
const serverStatus = document.getElementById('server-status');
const sideCredits = document.getElementById('side-credits');
const sideUserName = document.getElementById('side-user-name');

let currentSessionId = null;
let currentUser = null;

// Check server status & load current user profile
async function checkStatus() {
  try {
    const res = await fetch(`${API_BASE}/system/status`);
    if (res.ok) {
      serverStatus.style.background = '#22c55e';
      loadUserProfile();
      loadLatestSession();
    } else {
      serverStatus.style.background = '#f59e0b';
    }
  } catch (e) {
    serverStatus.style.background = '#ef4444';
  }
}

async function loadUserProfile() {
  try {
    const res = await fetch(`${API_BASE}/auth/me`);
    if (res.ok) {
      currentUser = await res.json();
      sideUserName.innerText = currentUser.name.split(' ')[0] || 'Student';
      if (currentUser.subscription_tier === 'PRO_MONTHLY' || currentUser.subscription_tier === 'ANNUAL_PASS') {
        sideCredits.innerText = '⚡ Infinite';
      } else {
        sideCredits.innerText = `${currentUser.credits_balance} Passes`;
      }
    }
  } catch (_) {}
}

async function loadLatestSession() {
  try {
    const res = await fetch(`${API_BASE}/sessions`);
    if (res.ok) {
      const list = await res.json();
      if (list && list.length > 0) {
        currentSessionId = list[0].id;
      }
    }
  } catch (_) {}
}

sendBtn.addEventListener('click', () => sendMessage());
queryInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendMessage();
});

// Quick action chips
document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    const cmd = chip.getAttribute('data-cmd');
    if (cmd) {
      queryInput.value = cmd;
      sendMessage();
    }
  });
});

async function sendMessage() {
  const text = queryInput.value.trim();
  if (!text) return;

  // Add user message to UI
  const userDiv = document.createElement('div');
  userDiv.className = 'msg user';
  userDiv.innerText = text;
  chatBox.appendChild(userDiv);
  queryInput.value = '';
  chatBox.scrollTop = chatBox.scrollHeight;

  const thinkingDiv = document.createElement('div');
  thinkingDiv.className = 'msg assistant';
  thinkingDiv.innerText = 'Analyzing lecture transcript & slide context...';
  chatBox.appendChild(thinkingDiv);
  chatBox.scrollTop = chatBox.scrollHeight;

  try {
    if (!currentSessionId) await loadLatestSession();
    const sid = currentSessionId || 'demo_cybersecurity_module_2';

    const res = await fetch(`${API_BASE}/sessions/${sid}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sid,
        message: text,
        mode: 'simple'
      })
    });

    if (res.ok) {
      const data = await res.json();
      thinkingDiv.innerText = data.text;
    } else {
      thinkingDiv.innerText = 'Could not get response from LearnLens engine.';
    }
  } catch (err) {
    thinkingDiv.innerText = 'LearnLens AI server is unreachable at http://localhost:8000.';
  }
  chatBox.scrollTop = chatBox.scrollHeight;
}

checkStatus();
setInterval(checkStatus, 12000);
