// API Configuration
const API_URL = 'http://localhost:5000/api';

// Authentication Helper Functions
function getToken() {
  return localStorage.getItem('token');
}

function getUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

function checkAuth(requiredRole = null) {
  const token = getToken();
  const user = getUser();

  if (!token || !user) {
    window.location.href = 'login.html';
    return false;
  }

  if (requiredRole && user.role !== requiredRole) {
    alert('Access Denied! You do not have permission to access this page.');
    window.location.href = user.role === 'admin' ? 'admin-dashboard.html' : 'student-dashboard.html';
    return false;
  }

  return true;
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('role');
  window.location.href = 'login.html';
}

// UI Helper Functions
function showMessage(message, type = 'info') {
  const msgDiv = document.getElementById('message');
  if (msgDiv) {
    msgDiv.textContent = message;
    msgDiv.className = `message ${type}`;
    msgDiv.style.display = 'block';

    if (type === 'success') {
      setTimeout(() => msgDiv.style.display = 'none', 3000);
    }
  }
}

function showSection(sectionId) {
  const sections = document.querySelectorAll('.section');
  sections.forEach(section => section.classList.add('hidden'));
  const section = document.getElementById(sectionId);
  if (section) section.classList.remove('hidden');
}

function formatDate(dateString) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

// API Wrapper Functions
async function apiCall(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (getToken()) {
    headers['Authorization'] = `Bearer ${getToken()}`;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `API Error: ${response.status}`);
  }

  return data;
}

// For ADMIN pages
async function viewStudentAchievements(studentId) {
  try {
    const data = await apiCall(`/admin/students/${studentId}`);
    const achievements = data.achievements;

    const container = document.getElementById('achievementsList');
    if (container) {
      container.innerHTML = achievements.length > 0 
        ? achievements.map(achievement => `
            <div class="achievement-card">
              <h4>${achievement.title}</h4>
              <p><strong>Type:</strong> ${achievement.type}</p>
              <p><strong>Level:</strong> ${achievement.level}</p>
              <p><strong>Date:</strong> ${formatDate(achievement.date)}</p>
              <p><strong>Status:</strong> <span class="status ${achievement.status}">${achievement.status}</span></p>
            </div>
          `).join('')
        : '<p>No achievements found</p>';
    }
  } catch (error) {
    showMessage('Error: ' + error.message, 'error');
  }
}

async function approveAchievement(achievementId) {
  try {
    const remarks = prompt('Enter approval remarks (optional):');
    await apiCall(`/admin/achievements/${achievementId}/review`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'approved', remarks })
    });
    showMessage('Achievement approved!', 'success');
    loadAchievements();
  } catch (error) {
    showMessage('Error: ' + error.message, 'error');
  }
}

async function rejectAchievement(achievementId) {
  try {
    const remarks = prompt('Enter rejection remarks:');
    if (!remarks) return;
    
    await apiCall(`/admin/achievements/${achievementId}/review`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'rejected', remarks })
    });
    showMessage('Achievement rejected!', 'success');
    loadAchievements();
  } catch (error) {
    showMessage('Error: ' + error.message, 'error');
  }
}

// For STUDENT pages
async function loadMyAchievements() {
  try {
    const data = await apiCall('/achievements');
    const container = document.getElementById('achievementsList');

    if (container) {
      container.innerHTML = data.length > 0
        ? data.map(achievement => `
            <div class="achievement-card">
              <h3>${achievement.title}</h3>
              <p><strong>Type:</strong> ${achievement.type}</p>
              <p><strong>Level:</strong> ${achievement.level}</p>
              <p><strong>Position:</strong> ${achievement.position}</p>
              <p><strong>Date:</strong> ${formatDate(achievement.date)}</p>
              <p><strong>Status:</strong> <span class="status ${achievement.status}">${achievement.status}</span></p>
              <p><strong>Organizer:</strong> ${achievement.organizer}</p>
              <p>${achievement.description}</p>
              ${achievement.status === 'pending' ? `
                <button onclick="editAchievement('${achievement._id}')" class="btn btn-small">Edit</button>
                <button onclick="deleteAchievement('${achievement._id}')" class="btn btn-small btn-danger">Delete</button>
              ` : ''}
            </div>
          `).join('')
        : '<p>No achievements yet. <a href="#" onclick="showAddForm()">Add your first achievement!</a></p>';
    }
  } catch (error) {
    showMessage('Error loading achievements: ' + error.message, 'error');
  }
}

async function submitAchievement(formData) {
  try {
    const response = await fetch(`${API_URL}/achievements`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getToken()}` },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    showMessage('Achievement added successfully!', 'success');
    document.getElementById('addAchievementForm').reset();
    setTimeout(() => loadMyAchievements(), 1500);
  } catch (error) {
    showMessage('Error: ' + error.message, 'error');
  }
}

async function editAchievement(achievementId) {
  alert('Edit feature coming soon!');
}

async function deleteAchievement(achievementId) {
  if (!confirm('Are you sure you want to delete this achievement?')) return;

  try {
    await apiCall(`/achievements/${achievementId}`, { method: 'DELETE' });
    showMessage('Achievement deleted!', 'success');
    loadMyAchievements();
  } catch (error) {
    showMessage('Error: ' + error.message, 'error');
  }
}

function showAddForm() {
  const form = document.getElementById('addAchievementForm');
  if (form) form.style.display = form.style.display === 'none' ? 'block' : 'none';
}
