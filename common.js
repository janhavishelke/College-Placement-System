// Common Utility for PlacementHub
// Manages Dark Mode, In-App Notifications, Toasts, and AI Assistant

const API_ROOT = window.location.protocol === 'file:' ? 'http://localhost:5000/api' : '/api';

// --- THEME MANAGEMENT ---
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 
        (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeToggleIcons(savedTheme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateThemeToggleIcons(next);
}

function updateThemeToggleIcons(theme) {
    document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
        btn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
        btn.setAttribute('title', theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode');
    });
}

// --- TOAST NOTIFICATIONS ---
function showToast(message, type = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
    toast.innerHTML = `<span>${icon}</span><span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// --- NOTIFICATION CENTER ---
async function loadNavbarNotifications() {
    const token = localStorage.getItem('token');
    const badge = document.getElementById('navbarNotifBadge');
    const dropdown = document.getElementById('navbarNotifDropdown');
    const list = document.getElementById('navbarNotifList');
    if (!token || !badge || !dropdown || !list) return;

    try {
        const res = await fetch(`${API_ROOT}/timeline/notifications`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            badge.innerText = data.unreadCount > 9 ? '9+' : data.unreadCount;
            badge.style.display = data.unreadCount > 0 ? 'flex' : 'none';

            if (data.notifications.length === 0) {
                list.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 13px;">No notifications yet.</div>';
                return;
            }

            list.innerHTML = '';
            data.notifications.forEach(n => {
                const item = document.createElement('div');
                item.className = `notif-item ${n.is_read ? '' : 'unread'}`;
                item.innerHTML = `
                    <h4>${escapeHtml(n.title)}</h4>
                    <p>${escapeHtml(n.message)}</p>
                    <time>${new Date(n.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</time>
                `;
                item.onclick = async () => {
                    if (!n.is_read) {
                        await fetch(`${API_ROOT}/timeline/notifications/${n.id}/read`, {
                            method: 'PATCH',
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        item.classList.remove('unread');
                        loadNavbarNotifications();
                    }
                    if (n.link) window.location.href = n.link;
                };
                list.appendChild(item);
            });
        }
    } catch (e) {
        console.warn('Could not load notifications:', e);
    }
}

function toggleNotifDropdown() {
    const dd = document.getElementById('navbarNotifDropdown');
    if (dd) dd.classList.toggle('show');
}

async function markAllNotificationsRead() {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
        await fetch(`${API_ROOT}/timeline/notifications/read-all`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        showToast('All notifications marked as read', 'success');
        loadNavbarNotifications();
    } catch (e) {
        showToast('Failed to update notifications', 'error');
    }
}

// Close dropdown if clicked outside
document.addEventListener('click', (e) => {
    const notifWrapper = document.querySelector('.notif-wrapper');
    const dd = document.getElementById('navbarNotifDropdown');
    if (dd && notifWrapper && !notifWrapper.contains(e.target)) {
        dd.classList.remove('show');
    }
});

// --- AI PLACEMENT ASSISTANT FLOATING WIDGET ---
function initAiAssistant() {
    const token = localStorage.getItem('token');
    if (!token) return; // Only show for logged in users

    if (document.getElementById('aiAssistantRoot')) return;

    const root = document.createElement('div');
    root.id = 'aiAssistantRoot';
    root.innerHTML = `
        <button class="assistant-float-btn" id="assistantToggleBtn" title="Ask Placement Assistant">
            🤖
        </button>
        <div class="assistant-chat-panel" id="assistantChatPanel">
            <div class="assistant-header">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 20px;">🤖</span>
                    <div>
                        <strong style="font-size: 14px; display: block;">PlacementHub Assistant</strong>
                        <small style="font-size: 11px; opacity: 0.8;">Live Database Grounded</small>
                    </div>
                </div>
                <button onclick="toggleAssistantChat()" style="background:none; border:none; color:white; font-size:18px; cursor:pointer;">✕</button>
            </div>
            <div class="assistant-messages" id="assistantMessages">
                <div class="chat-bubble bot">
Hello! I am your PlacementHub Assistant. I have live, authorized access to placement drives, your profile, eligibility criteria, and preparation guides.

How can I help you today?
                </div>
            </div>
            <div class="chat-quick-prompts">
                <span class="chat-prompt-pill" onclick="sendQuickPrompt('Am I eligible for open drives?')">Am I eligible?</span>
                <span class="chat-prompt-pill" onclick="sendQuickPrompt('What are my missing skills?')">Missing Skills</span>
                <span class="chat-prompt-pill" onclick="sendQuickPrompt('What is my application status?')">Application Status</span>
                <span class="chat-prompt-pill" onclick="sendQuickPrompt('Upcoming drive deadlines')">Deadlines</span>
                <span class="chat-prompt-pill" onclick="sendQuickPrompt('Placement package statistics')">Salary Stats</span>
            </div>
            <form class="assistant-input-box" onsubmit="handleAssistantSubmit(event)">
                <input type="text" id="assistantInput" placeholder="Ask about jobs, skills, criteria..." autocomplete="off">
                <button type="submit">Send</button>
            </form>
        </div>
    `;
    document.body.appendChild(root);

    document.getElementById('assistantToggleBtn').addEventListener('click', toggleAssistantChat);
}

function toggleAssistantChat() {
    const panel = document.getElementById('assistantChatPanel');
    if (panel) panel.classList.toggle('active');
}

function sendQuickPrompt(promptText) {
    const input = document.getElementById('assistantInput');
    if (input) {
        input.value = promptText;
        handleAssistantSubmit(new Event('submit'));
    }
}

async function handleAssistantSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    const input = document.getElementById('assistantInput');
    const msgContainer = document.getElementById('assistantMessages');
    const text = input ? input.value.trim() : '';
    if (!text || !msgContainer) return;

    // Add user bubble
    const userBubble = document.createElement('div');
    userBubble.className = 'chat-bubble user';
    userBubble.innerText = text;
    msgContainer.appendChild(userBubble);
    input.value = '';
    msgContainer.scrollTop = msgContainer.scrollHeight;

    // Bot typing bubble
    const botBubble = document.createElement('div');
    botBubble.className = 'chat-bubble bot';
    botBubble.innerText = 'Analyzing platform records...';
    msgContainer.appendChild(botBubble);
    msgContainer.scrollTop = msgContainer.scrollHeight;

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_ROOT}/assistant/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ message: text })
        });
        const data = await res.json();
        if (data.success) {
            botBubble.innerHTML = formatAssistantMarkdown(data.reply);
        } else {
            botBubble.innerText = data.message || 'Sorry, I encountered an error answering your question.';
        }
    } catch (err) {
        botBubble.innerText = 'Unable to connect to PlacementHub Assistant server.';
    }
    msgContainer.scrollTop = msgContainer.scrollHeight;
}

function formatAssistantMarkdown(text) {
    if (!text) return '';
    let formatted = escapeHtml(text)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');
    return formatted;
}

// Modal helper
function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
}

function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
}

function escapeHtml(str) {
    if (!str) return '';
    return str.toString().replace(/[&<>"']/g, function (m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
}

// Universal status badge renderer for all 8 application statuses
function getStatusBadgeHtml(status) {
    const s = (status || 'Applied').trim();
    const map = {
        'Applied': { icon: '📝', cls: 'status-applied', label: 'Applied' },
        'Under Review': { icon: '🔍', cls: 'status-under-review', label: 'Under Review' },
        'Shortlisted': { icon: '🎯', cls: 'status-shortlisted', label: 'Shortlisted' },
        'Interview Scheduled': { icon: '📅', cls: 'status-interview-scheduled', label: 'Interview Scheduled' },
        'Selected': { icon: '🎉', cls: 'status-selected', label: 'Selected' },
        'Not Selected': { icon: '✕', cls: 'status-not-selected', label: 'Not Selected' },
        'Offer Accepted': { icon: '✅', cls: 'status-offer-accepted', label: 'Offer Accepted' },
        'Offer Declined': { icon: '⛔', cls: 'status-offer-declined', label: 'Offer Declined' },
        'Rejected': { icon: '✕', cls: 'status-not-selected', label: 'Not Selected' }
    };
    const item = map[s] || { icon: '•', cls: 'status-applied', label: s };
    return `<span class="status-badge ${item.cls}"><span class="status-icon">${item.icon}</span> ${escapeHtml(item.label)}</span>`;
}

function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadNavbarNotifications();
    initAiAssistant();
});
