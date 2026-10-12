// Common Utility for PlacementHub
// Manages Dark Mode, In-App Notifications, Toasts, and AI Assistant

function getPlacementApiBase() {
    if (typeof window !== 'undefined' && window.location) {
        if (window.location.protocol === 'file:') return 'http://localhost:5000/api';
        if (window.location.port && window.location.port !== '5000') return 'http://localhost:5000/api';
    }
    return '/api';
}
window.PLACEMENT_API_BASE = getPlacementApiBase();
const API_ROOT = window.PLACEMENT_API_BASE;

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

// ============================================================
// UNIVERSAL COMPANY DETAILS MODAL (CAMPUS VISITS & DRIVES)
// ============================================================
function ensureCompanyDetailsModal() {
    let modal = document.getElementById('companyDetailsModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'companyDetailsModal';
        modal.className = 'modal-backdrop';
        modal.onclick = (e) => {
            if (e.target === modal) closeModal('companyDetailsModal');
        };
        modal.innerHTML = `
            <div class="modal-box" style="max-width: 680px;" onclick="event.stopPropagation();">
                <button class="modal-close-btn" onclick="closeModal('companyDetailsModal')">✕</button>
                <div id="companyModalContent">
                    <div style="text-align:center; padding:40px 20px;">
                        <div class="skeleton" style="height:32px; width:60%; margin:0 auto 12px auto;"></div>
                        <div class="skeleton" style="height:20px; width:40%; margin:0 auto 20px auto;"></div>
                        <div class="skeleton" style="height:120px; width:100%;"></div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    return modal;
}

async function openCompanyDetailsModal(companyIdOrJobId) {
    ensureCompanyDetailsModal();
    const content = document.getElementById('companyModalContent');
    content.innerHTML = `
        <div style="text-align:center; padding:30px 10px;">
            <div style="font-size:32px; margin-bottom:10px;">🏢</div>
            <p style="color:var(--text-muted); font-size:14px;">Loading company details from database...</p>
        </div>
    `;
    openModal('companyDetailsModal');

    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
        const base = window.PLACEMENT_API_BASE || getPlacementApiBase();
        // Try /api/companies/:id first, fallback to /api/jobs/:id
        let res = await fetch(`${base}/companies/${companyIdOrJobId}`, { headers });
        let data = await res.json();
        if (!data.success) {
            res = await fetch(`${base}/jobs/${companyIdOrJobId}`, { headers });
            data = await res.json();
        }

        if (!data.success || (!data.company && !data.job)) {
            content.innerHTML = `
                <div style="text-align:center; padding:30px 10px;">
                    <div style="font-size:36px; margin-bottom:10px;">⚠️</div>
                    <h3>Company Details Unavailable</h3>
                    <p style="color:var(--text-muted); font-size:13px;">${escapeHtml(data.message || 'Unable to retrieve company information.')}</p>
                    <button class="btn btn-sm btn-secondary" onclick="closeModal('companyDetailsModal')" style="margin-top:14px;">Close</button>
                </div>
            `;
            return;
        }

        const comp = data.company || data.job;
        const skillChips = (comp.skills || '').split(/[,;|]/).map(s => s.trim()).filter(Boolean)
            .map(s => `<span class="skill-chip skill-matched">${escapeHtml(s)}</span>`).join('');

        let actionAreaHtml = '';
        if (userRole === 'STUDENT') {
            if (comp.appliedStatus) {
                actionAreaHtml = `
                    <div style="background:var(--success-subtle, rgba(16,185,129,0.1)); border:1px solid rgba(16,185,129,0.3); border-radius:var(--radius-sm); padding:12px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
                        <div>
                            <strong style="color:var(--success, #10b981);">✓ Registered for Drive</strong>
                            <div style="font-size:12px; color:var(--text-muted);">Current Stage: <strong>${escapeHtml(comp.appliedStatus)}</strong></div>
                        </div>
                        <a href="student-dashboard.html" class="btn btn-sm btn-primary">Track in Dashboard</a>
                    </div>
                `;
            } else {
                actionAreaHtml = `
                    <div style="display:flex; gap:10px; flex-wrap:wrap;">
                        <button class="btn btn-primary" id="companyModalApplyBtn" onclick="applyFromCompanyModal(${comp.id}, '${escapeHtml(comp.company_name || comp.company)}')" style="flex:2;">
                            🚀 Register & Apply Now
                        </button>
                        <button class="btn btn-secondary" onclick="closeModal('companyDetailsModal')" style="flex:1;">Close</button>
                    </div>
                `;
            }
        } else if (!token) {
            actionAreaHtml = `
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; background:var(--primary-subtle); padding:12px 16px; border-radius:var(--radius-sm);">
                    <span style="font-size:13px; color:var(--text-secondary);">Student registration is open for this drive.</span>
                    <a href="login.html" class="btn btn-sm btn-primary">🔑 Student Login to Apply</a>
                </div>
            `;
        } else {
            actionAreaHtml = `
                <button class="btn btn-secondary" onclick="closeModal('companyDetailsModal')" style="width:100%;">Close</button>
            `;
        }

        const visitDateStr = comp.visitDate || comp.visit_date || 'Schedule Announced Soon';
        const deadlineStr = comp.deadline || 'Open Rolling';
        const websiteBtn = comp.website ? `<a href="${escapeHtml(comp.website)}" target="_blank" rel="noopener noreferrer" class="btn btn-xs btn-outline" style="font-size:11px; padding:3px 8px;">🌐 Visit Website</a>` : '';
        const recStatus = comp.recruitmentStatus || comp.recruitment_status || 'Upcoming';

        content.innerHTML = `
            <div style="margin-bottom:18px;">
                <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:14px; flex-wrap:wrap;">
                    <div style="display:flex; align-items:center; gap:14px;">
                        <div style="width:52px; height:52px; border-radius:12px; background:var(--primary-subtle); border:1px solid rgba(108,76,241,0.2); display:flex; align-items:center; justify-content:center; font-size:24px; font-weight:800; color:var(--primary); overflow:hidden; flex-shrink:0;">
                            ${comp.logo ? `<img src="${escapeHtml(comp.logo)}" alt="${escapeHtml(comp.company)}" style="width:100%; height:100%; object-fit:cover;" onerror="this.parentElement.innerHTML='🏢'">` : '🏢'}
                        </div>
                        <div>
                            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                                <h2 style="margin:0; font-size:20px; color:var(--text-primary);">${escapeHtml(comp.company_name || comp.company)}</h2>
                                <span class="badge ${recStatus.toLowerCase() === 'active' ? 'badge-success' : 'badge-primary'}" style="font-size:11px;">
                                    ● ${escapeHtml(recStatus)}
                                </span>
                            </div>
                            <span style="font-size:15px; font-weight:600; color:var(--primary); display:block; margin-top:2px;">
                                💼 ${escapeHtml(comp.title || comp.jobTitle || 'Recruitment Drive')}
                            </span>
                        </div>
                    </div>
                    <div>
                        ${websiteBtn}
                    </div>
                </div>
            </div>

            <!-- Highlights Banner -->
            <div style="background:var(--primary-subtle); border:1px solid rgba(108,76,241,0.2); border-radius:var(--radius-sm); padding:12px 16px; margin-bottom:18px; display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:12px;">
                <div>
                    <span style="font-size:11px; color:var(--text-muted); display:block; text-transform:uppercase;">Package / CTC</span>
                    <strong style="color:var(--success); font-size:16px;">${escapeHtml(comp.salary || comp.package)}</strong>
                    ${comp.baseSalary ? `<div style="font-size:11px; color:var(--text-muted);">Base: ${escapeHtml(comp.baseSalary)}</div>` : ''}
                </div>
                <div>
                    <span style="font-size:11px; color:var(--text-muted); display:block; text-transform:uppercase;">Campus Visit</span>
                    <strong style="color:var(--primary); font-size:14px;">🗓️ ${escapeHtml(visitDateStr)}</strong>
                </div>
                <div>
                    <span style="font-size:11px; color:var(--text-muted); display:block; text-transform:uppercase;">Apply Deadline</span>
                    <strong style="color:var(--warning); font-size:14px;">⏳ ${escapeHtml(deadlineStr)}</strong>
                </div>
                <div>
                    <span style="font-size:11px; color:var(--text-muted); display:block; text-transform:uppercase;">Work Mode / Venue</span>
                    <span style="font-size:13px; font-weight:600;">${escapeHtml(comp.workMode || 'On-Site')} • ${escapeHtml(comp.location || 'On-Campus')}</span>
                </div>
            </div>

            <!-- Eligibility & Criteria Section -->
            <div style="border:1px solid var(--border-color); border-radius:var(--radius-sm); padding:14px 16px; margin-bottom:18px; background:var(--bg-page);">
                <h4 style="margin:0 0 10px 0; font-size:13px; text-transform:uppercase; color:var(--text-secondary); letter-spacing:0.5px;">📋 Eligibility & Hiring Criteria</h4>
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:10px; font-size:13px;">
                    <div>🎓 <strong>Min CGPA Cutoff:</strong> ${comp.cgpa !== undefined ? comp.cgpa : 'N/A'}</div>
                    <div>⚠️ <strong>Max Backlogs:</strong> ≤ ${comp.maxBacklogs !== undefined ? comp.maxBacklogs : 0}</div>
                    <div>📜 <strong>Bond / Service Agreement:</strong> ${comp.bondMonths ? `${comp.bondMonths} Months` : 'No Bond'}</div>
                    <div style="grid-column:1 / -1;">🏛️ <strong>Eligible Branches:</strong> <span style="color:var(--text-primary); font-weight:500;">${escapeHtml(comp.eligibleBranches || 'All Branches')}</span></div>
                </div>
            </div>

            <!-- Required Skills -->
            <div style="margin-bottom:18px;">
                <h4 style="margin:0 0 8px 0; font-size:13px; text-transform:uppercase; color:var(--text-secondary); letter-spacing:0.5px;">⚡ Required Skills & Competencies</h4>
                <div class="skill-chips-row">
                    ${skillChips || '<span style="font-size:12px; color:var(--text-muted);">Standard aptitude and engineering fundamentals</span>'}
                </div>
            </div>

            <!-- Description -->
            ${comp.description ? `
                <div style="margin-bottom:20px;">
                    <h4 style="margin:0 0 6px 0; font-size:13px; text-transform:uppercase; color:var(--text-secondary); letter-spacing:0.5px;">📝 Drive & Role Description</h4>
                    <p style="font-size:13px; line-height:1.5; color:var(--text-secondary); margin:0; white-space:pre-line;">
                        ${escapeHtml(comp.description)}
                    </p>
                </div>
            ` : ''}

            <!-- Action Area -->
            <div style="margin-top:22px; padding-top:16px; border-top:1px solid var(--border-color);">
                ${actionAreaHtml}
            </div>
        `;
    } catch (e) {
        console.error("Error opening company details modal:", e);
        content.innerHTML = `
            <div style="text-align:center; padding:30px 10px;">
                <div style="font-size:36px; margin-bottom:10px;">❌</div>
                <h3>Failed to Load Company Details</h3>
                <p style="color:var(--danger); font-size:13px;">Error connecting to the server. Please verify the backend is running.</p>
                <button class="btn btn-sm btn-secondary" onclick="closeModal('companyDetailsModal')" style="margin-top:14px;">Close</button>
            </div>
        `;
    }
}

// Student Apply helper from inside Company Modal
async function applyFromCompanyModal(jobId, companyName) {
    const btn = document.getElementById('companyModalApplyBtn');
    if (btn) {
        btn.disabled = true;
        btn.innerText = 'Submitting Application...';
    }

    const token = localStorage.getItem('token');
    const base = window.PLACEMENT_API_BASE || getPlacementApiBase();

    try {
        const res = await fetch(`${base}/applications`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ jobId })
        });
        const data = await res.json();

        if (res.ok && data.success) {
            showToast(`Registered successfully for ${companyName}!`, 'success');
            // Refresh modal to show registered status
            openCompanyDetailsModal(jobId);
            // Refresh visiting lists if present on page
            if (typeof loadVisitingCompanies === 'function') loadVisitingCompanies();
            if (typeof loadJobs === 'function') loadJobs();
        } else {
            showToast(data.message || 'Application failed', 'error');
            if (btn) {
                btn.disabled = false;
                btn.innerText = '🚀 Register & Apply Now';
            }
        }
    } catch (e) {
        showToast('Error communicating with server', 'error');
        if (btn) {
            btn.disabled = false;
            btn.innerText = '🚀 Register & Apply Now';
        }
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadNavbarNotifications();
    initAiAssistant();
});
