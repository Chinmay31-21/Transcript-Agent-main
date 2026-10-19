const API_BASE = 'http://localhost:8000/api';

const authView = document.getElementById('auth-view');
const authCard = document.getElementById('authenticated-view');
const switchBtn = document.getElementById('switch-account');
const creditCount = document.getElementById('credit-count');
const userName = document.getElementById('user-name');
const userDegree = document.getElementById('user-degree');
const userInst = document.getElementById('user-inst');
const userAvatar = document.getElementById('user-avatar');

let currentUser = null;

// Initialize
async function init() {
  try {
    const res = await fetch(`${API_BASE}/auth/me`);
    if (res.ok) {
      currentUser = await res.json();
      renderUser(currentUser);
      document.getElementById('server-status').innerText = '🟢 Engine Live';
    } else {
      showAuth();
    }
  } catch (e) {
    document.getElementById('server-status').innerText = '🔴 Backend Offline';
  }
}

function renderUser(user) {
  authView.style.display = 'none';
  authCard.style.display = 'block';
  userName.innerText = user.name || 'Student';
  userDegree.innerText = `${user.degree_major || 'General'} • ${user.standard_class || 'Enrolled'}`;
  userInst.innerText = user.institution || 'School / College';
  if (user.avatar_url) userAvatar.src = user.avatar_url;
  
  if (user.subscription_tier === 'PRO_MONTHLY' || user.subscription_tier === 'ANNUAL_PASS') {
    creditCount.innerText = '⚡ Infinite Pro';
  } else {
    creditCount.innerText = `${user.credits_balance}/10 Passes`;
  }
}

function showAuth() {
  authCard.style.display = 'none';
  authView.style.display = 'block';
}

switchBtn.addEventListener('click', () => {
  if (authView.style.display === 'block') {
    if (currentUser) renderUser(currentUser);
  } else {
    showAuth();
  }
});

document.getElementById('submit-auth').addEventListener('click', async () => {
  const name = document.getElementById('reg-name').value.trim() || 'New Learner';
  const email = document.getElementById('reg-email').value.trim() || `user_${Date.now()}@learnlens.ai`;
  const degree = document.getElementById('reg-degree').value.trim() || 'Computer Science';

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        password: 'student_pass',
        degree_major: degree
      })
    });
    if (res.ok) {
      const data = await res.json();
      currentUser = data.user;
      renderUser(currentUser);
    } else {
      // Try login if existing
      const loginRes = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'student_pass' })
      });
      if (loginRes.ok) {
        const loginData = await loginRes.json();
        currentUser = loginData.user;
        renderUser(currentUser);
      }
    }
  } catch (err) {
    alert('Error connecting to backend: ' + err.message);
  }
});

document.getElementById('open-studio').addEventListener('click', () => {
  chrome.tabs.create({ url: 'http://localhost:5173' });
});

document.getElementById('open-sidepanel').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && chrome.sidePanel && chrome.sidePanel.open) {
    chrome.sidePanel.open({ windowId: tab.windowId });
  }
});

document.getElementById('upgrade-plan').addEventListener('click', () => {
  chrome.tabs.create({ url: 'http://localhost:5173#pricing' });
});

init();
