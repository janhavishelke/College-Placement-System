// PlacementHub - Placement Coordinator Dashboard Logic
const API_BASE = window.PLACEMENT_API_BASE || getPlacementApiBase();

let allAssignedDrives = [];
let allCoordinatorApplicants = [];
let currentCoordinatorUser = null;

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
}

// Check role & initialize
document.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');

    if (!token || (role !== 'COORDINATOR' && role !== 'ADMIN' && role !== 'PLACEMENT_HEAD')) {
        alert('Access denied. Please log in with a Placement Coordinator or Placement Head account.');
        window.location.href = 'login.html';
        return;
    }

    const userName = localStorage.getItem('userName') || 'Placement Coordinator';
    document.getElementById('coordName').innerText = userName;

    try {
        const meRes = await fetch(`${API_BASE}/auth/me`, { headers: getAuthHeaders() });
        const meData = await meRes.json();
        if (meData.success && meData.user) {
            currentCoordinatorUser = meData.user;
            if (meData.user.department) {
                document.getElementById('coordDeptBadge').innerText = `${meData.user.department} Department`;
            }
        }
    } catch (e) {
        console.warn('Failed to load user profile in coordinator dashboard:', e);
    }

    // Default dates
    const today = new Date().toISOString().split('T')[0];
    const visitInput = document.getElementById('coordVisitDate');
    const deadlineInput = document.getElementById('coordDeadline');
    if (visitInput) visitInput.value = '2026-12-05';
    if (deadlineInput) deadlineInput.value = '2026-11-30';

    loadCoordinatorDashboard();
});

// Tab Switcher
function switchCoordTab(tabId, buttonEl) {
    document.querySelectorAll('.dashboard-tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    document.querySelectorAll('.tab-link').forEach(btn => {
        btn.classList.remove('active');
    });

    const target = document.getElementById(tabId);
    if (target) target.classList.add('active');

    if (buttonEl) {
        buttonEl.classList.add('active');
    } else {
        const matchingBtn = document.querySelector(`.tab-link[onclick*="${tabId}"]`);
        if (matchingBtn) matchingBtn.classList.add('active');
    }

    // Tab-specific loaders
    if (tabId === 'coordDrivesTab') loadCoordinatorDrives();
    else if (tabId === 'coordStudentsTab') loadCoordinatorApplicants();
    else if (tabId === 'coordAnnouncementsTab') loadCoordinatorAnnouncements();
    else if (tabId === 'coordAuditTab') loadCoordinatorHistory();
    else if (tabId === 'coordOverviewTab') loadCoordinatorDashboard();
}

// Master Dashboard Loader
async function loadCoordinatorDashboard() {
    try {
        // 1. Load KPI Stats
        const statsRes = await fetch(`${API_BASE}/coordinators/stats`, { headers: getAuthHeaders() });
        const statsData = await statsRes.json();
        if (statsData.success && statsData.stats) {
            const s = statsData.stats;
            document.getElementById('coordKpiDrives').innerText = s.assignedDrivesCount || 0;
            document.getElementById('coordKpiPending').innerText = s.pendingApprovalCount || 0;
            document.getElementById('coordKpiApplicants').innerText = s.totalApplicantsCount || 0;
            document.getElementById('coordKpiSelected').innerText = s.selectedCandidatesCount || 0;
        }

        // 2. Load Assigned Drives for Overview
        await loadCoordinatorDrives(true);
    } catch (err) {
        console.error('Coordinator dashboard loading error:', err);
    }
}

// Load Assigned Drives
async function loadCoordinatorDrives(overviewOnly = false) {
    const tableBody = document.getElementById('coordDrivesTableBody');
    const upcomingContainer = document.getElementById('coordUpcomingDrivesList');

    try {
        const res = await fetch(`${API_BASE}/jobs?assignedOnly=true`, { headers: getAuthHeaders() });
        const data = await res.json();

        if (data.success && Array.isArray(data.jobs)) {
            allAssignedDrives = data.jobs;

            // Render Overview Upcoming List
            if (upcomingContainer) {
                if (allAssignedDrives.length === 0) {
                    upcomingContainer.innerHTML = `
                        <div class="empty-state" style="grid-column:1 / -1; padding:20px;">
                            <p>No placement drives assigned yet. Create a new drive using the button above.</p>
                        </div>
                    `;
                } else {
                    const topUpcoming = allAssignedDrives.slice(0, 4);
                    upcomingContainer.innerHTML = topUpcoming.map(d => {
                        const appBadge = getApprovalBadge(d.approvalStatus || d.approval_status);
                        return `
                            <div style="background:var(--bg-subtle); border:1px solid var(--border-color); border-radius:var(--radius-sm); padding:14px;">
                                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
                                    <strong>${escapeHtml(d.company || d.company_name)}</strong>
                                    ${appBadge}
                                </div>
                                <div style="font-size:13px; color:var(--primary); font-weight:600;">${escapeHtml(d.title)}</div>
                                <div style="font-size:12px; color:var(--text-secondary); margin-top:4px;">💰 ${escapeHtml(d.salary || d.package)} • 📍 ${escapeHtml(d.location)}</div>
                                <div style="font-size:12px; color:var(--text-muted); margin-top:6px; display:flex; justify-content:space-between;">
                                    <span>🗓️ Visit: ${escapeHtml(d.visitDate || d.deadline)}</span>
                                    <span>👥 ${d.applicantCount || 0} Applied</span>
                                </div>
                                <button onclick="editDrive(${d.id})" class="btn btn-xs btn-outline" style="width:100%; margin-top:10px;">
                                    ✏️ Manage Details
                                </button>
                            </div>
                        `;
                    }).join('');
                }
            }

            if (!overviewOnly && tableBody) {
                renderCoordinatorDrivesTable(allAssignedDrives);
            }
        }
    } catch (err) {
        console.error('Error fetching coordinator drives:', err);
        if (tableBody) tableBody.innerHTML = `<tr><td colspan="7" style="color:var(--danger); text-align:center;">Failed to load assigned drives.</td></tr>`;
    }
}

function getApprovalBadge(status) {
    const s = (status || 'Approved').trim();
    if (s === 'Approved') return `<span class="badge badge-success" style="font-size:11px;">✓ Approved & Live</span>`;
    if (s === 'Pending Approval') return `<span class="badge badge-warning" style="font-size:11px;">⏳ Pending Approval</span>`;
    if (s === 'Draft') return `<span class="badge" style="background:#64748B; color:#fff; font-size:11px;">💾 Draft</span>`;
    if (s === 'Rejected') return `<span class="badge badge-danger" style="font-size:11px;">✕ Revisions Needed</span>`;
    return `<span class="badge badge-primary" style="font-size:11px;">${escapeHtml(s)}</span>`;
}

function renderCoordinatorDrivesTable(drives) {
    const tbody = document.getElementById('coordDrivesTableBody');
    if (!tbody) return;

    if (drives.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; padding:30px; color:var(--text-muted);">
                    No drives matched the selected filter.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = drives.map(d => {
        const comp = d.company || d.company_name;
        const appBadge = getApprovalBadge(d.approvalStatus || d.approval_status);
        const appNotes = d.approvalNotes ? `<div style="font-size:11px; color:var(--danger); margin-top:4px;">⚠️ Note: ${escapeHtml(d.approvalNotes)}</div>` : '';
        const recStatus = d.recruitmentStatus || 'Upcoming';

        return `
            <tr>
                <td>
                    <div style="font-weight:700; color:var(--text-primary); font-size:14px;">${escapeHtml(comp)}</div>
                    <div style="font-size:12px; color:var(--primary); font-weight:600;">💼 ${escapeHtml(d.title)}</div>
                    <div style="font-size:11px; color:var(--text-muted);">${escapeHtml(d.industry || 'IT & Software')} • ${escapeHtml(d.location)}</div>
                </td>
                <td>
                    <strong style="color:var(--success); font-size:14px;">${escapeHtml(d.salary || d.package)}</strong>
                    ${d.baseSalary ? `<div style="font-size:11px; color:var(--text-muted);">Base: ${escapeHtml(d.baseSalary)}</div>` : ''}
                    ${d.stipend ? `<div style="font-size:11px; color:var(--primary);">Stipend: ${escapeHtml(d.stipend)}</div>` : ''}
                </td>
                <td style="font-size:12px;">
                    <div>🗓️ <strong>Visit:</strong> ${escapeHtml(d.visitDate || 'TBD')}</div>
                    <div style="color:var(--warning);">⏳ <strong>Deadline:</strong> ${escapeHtml(d.deadline || 'Open')}</div>
                </td>
                <td style="font-size:12px;">
                    <div>🎓 Min CGPA: <strong>${d.cgpa || 0}</strong></div>
                    <div>⚠️ Backlogs: <strong>≤ ${d.maxBacklogs !== undefined ? d.maxBacklogs : 0}</strong></div>
                    <div style="max-width:180px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:var(--text-muted); font-size:11px;" title="${escapeHtml(d.eligibleBranches)}">
                        ${escapeHtml(d.eligibleBranches)}
                    </div>
                </td>
                <td>
                    ${appBadge}
                    ${appNotes}
                    <div style="font-size:11px; color:var(--text-muted); margin-top:4px;">Mode: <strong>${escapeHtml(recStatus)}</strong></div>
                </td>
                <td style="text-align:center;">
                    <button onclick="filterApplicantsForDrive(${d.id})" class="btn btn-xs btn-outline" style="font-weight:700;">
                        👥 ${d.applicantCount || 0} Candidates
                    </button>
                </td>
                <td>
                    <div style="display:flex; gap:6px; flex-wrap:wrap;">
                        <button onclick="editDrive(${d.id})" class="btn btn-xs btn-primary">
                            ✏️ Edit
                        </button>
                        ${(d.approvalStatus === 'Draft' || d.approvalStatus === 'Rejected') ? `
                            <button onclick="submitDriveForApproval(${d.id})" class="btn btn-xs btn-secondary" title="Submit to Placement Head">
                                🚀 Submit
                            </button>
                        ` : ''}
                        <button onclick="openCompanyDetailsModal(${d.id})" class="btn btn-xs btn-outline">
                            👁️ View
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function filterCoordinatorDrives() {
    const search = (document.getElementById('coordDriveSearch').value || '').toLowerCase().trim();
    const statusFilter = document.getElementById('coordDriveStatusFilter').value;
    const approvalFilter = document.getElementById('coordApprovalFilter').value;

    let filtered = allAssignedDrives.filter(d => {
        const comp = (d.company || d.company_name || '').toLowerCase();
        const role = (d.title || '').toLowerCase();
        const skills = (d.skills || '').toLowerCase();
        const loc = (d.location || '').toLowerCase();
        const ind = (d.industry || '').toLowerCase();

        const matchesSearch = !search || comp.includes(search) || role.includes(search) || skills.includes(search) || loc.includes(search) || ind.includes(search);
        const matchesStatus = statusFilter === 'ALL' || (d.recruitmentStatus && d.recruitmentStatus.toLowerCase() === statusFilter.toLowerCase());
        const matchesApproval = approvalFilter === 'ALL' || (d.approvalStatus && d.approvalStatus.toLowerCase() === approvalFilter.toLowerCase());

        return matchesSearch && matchesStatus && matchesApproval;
    });

    renderCoordinatorDrivesTable(filtered);
}

// Drive Form Management
function openNewDriveForm() {
    resetDriveForm();
    switchCoordTab('coordAddDriveTab');
}

function resetDriveForm() {
    document.getElementById('editDriveId').value = '';
    document.getElementById('driveFormTitle').innerText = 'Announce Campus Recruitment Drive';
    document.getElementById('coordSubmitDriveBtn').innerText = '🚀 Submit for Placement Head Approval';

    document.getElementById('coordCompanyName').value = '';
    document.getElementById('coordIndustry').value = 'Information Technology';
    document.getElementById('coordWebsite').value = '';
    document.getElementById('coordLogo').value = '';
    document.getElementById('coordJobTitle').value = '';
    document.getElementById('coordSalary').value = '';
    document.getElementById('coordBaseSalary').value = '';
    document.getElementById('coordBonus').value = '';
    document.getElementById('coordStipend').value = '';
    document.getElementById('coordInternshipDuration').value = '';
    document.getElementById('coordLocation').value = 'Pune / Mumbai';
    document.getElementById('coordMinCgpa').value = '6.5';
    document.getElementById('coordMaxBacklogs').value = '0';
    document.getElementById('coordGradYear').value = '2026';
    document.getElementById('coordAvailablePositions').value = '10';
    document.getElementById('coordEligibleBranches').value = 'Computer Engineering, Information Technology, AI & ML, Electronics';
    document.getElementById('coordSkills').value = 'Java, SQL, Spring Boot';
    document.getElementById('coordSelectionProcess').value = 'Online Assessment -> Technical Interview -> HR Round';
    document.getElementById('coordDescription').value = '';
}

function editDrive(driveId) {
    const drive = allAssignedDrives.find(d => d.id === driveId);
    if (!drive) return;

    resetDriveForm();
    document.getElementById('editDriveId').value = drive.id;
    document.getElementById('driveFormTitle').innerText = `Update Drive: ${drive.company || drive.company_name}`;
    document.getElementById('coordSubmitDriveBtn').innerText = '💾 Save & Update Drive';

    document.getElementById('coordCompanyName').value = drive.company || drive.company_name || '';
    document.getElementById('coordIndustry').value = drive.industry || 'Information Technology';
    document.getElementById('coordWebsite').value = drive.website || '';
    document.getElementById('coordLogo').value = drive.logo || '';
    document.getElementById('coordJobTitle').value = drive.title || '';
    document.getElementById('coordRoleCategory').value = drive.roleCategory || 'Software Engineering';
    document.getElementById('coordSalary').value = drive.salary || drive.package || '';
    document.getElementById('coordBaseSalary').value = drive.baseSalary || '';
    document.getElementById('coordBonus').value = drive.bonus || '';
    document.getElementById('coordStipend').value = drive.stipend || '';
    document.getElementById('coordInternshipDuration').value = drive.internshipDuration || '';
    document.getElementById('coordWorkMode').value = drive.workMode || 'On-Site';
    document.getElementById('coordLocation').value = drive.location || '';
    document.getElementById('coordBondMonths').value = drive.bondMonths || 0;
    document.getElementById('coordMinCgpa').value = drive.cgpa || 0;
    document.getElementById('coordMaxBacklogs').value = drive.maxBacklogs !== undefined ? drive.maxBacklogs : 0;
    document.getElementById('coordGradYear').value = drive.graduationYear || '2026';
    document.getElementById('coordAvailablePositions').value = drive.availablePositions || 10;
    document.getElementById('coordEligibleBranches').value = drive.eligibleBranches || '';
    document.getElementById('coordSkills').value = drive.skills || '';
    document.getElementById('coordVisitDate').value = drive.visitDate || '';
    document.getElementById('coordDeadline').value = drive.deadline || '';
    document.getElementById('coordTestDate').value = drive.testDate || '';
    document.getElementById('coordInterviewDate').value = drive.interviewDate || '';
    document.getElementById('coordRecruitmentStatus').value = drive.recruitmentStatus || 'Upcoming';
    document.getElementById('coordSelectionProcess').value = drive.selectionProcess || '';
    document.getElementById('coordDescription').value = drive.description || '';

    switchCoordTab('coordAddDriveTab');
}

// Save or Submit Drive to Backend
async function handleCoordinatorSaveDrive(event, forcedStatus = null) {
    if (event) event.preventDefault();

    const driveId = document.getElementById('editDriveId').value;
    const isEdit = Boolean(driveId);

    const payload = {
        companyName: document.getElementById('coordCompanyName').value.trim(),
        industry: document.getElementById('coordIndustry').value.trim(),
        website: document.getElementById('coordWebsite').value.trim(),
        logo: document.getElementById('coordLogo').value.trim(),
        jobTitle: document.getElementById('coordJobTitle').value.trim(),
        roleCategory: document.getElementById('coordRoleCategory').value,
        salary: document.getElementById('coordSalary').value.trim(),
        baseSalary: document.getElementById('coordBaseSalary').value.trim(),
        bonus: document.getElementById('coordBonus').value.trim(),
        stipend: document.getElementById('coordStipend').value.trim(),
        internshipDuration: document.getElementById('coordInternshipDuration').value.trim(),
        workMode: document.getElementById('coordWorkMode').value,
        location: document.getElementById('coordLocation').value.trim(),
        bondMonths: parseInt(document.getElementById('coordBondMonths').value, 10) || 0,
        minimumCgpa: parseFloat(document.getElementById('coordMinCgpa').value) || 0,
        maxBacklogs: parseInt(document.getElementById('coordMaxBacklogs').value, 10) || 0,
        graduationYear: document.getElementById('coordGradYear').value.trim(),
        availablePositions: parseInt(document.getElementById('coordAvailablePositions').value, 10) || 10,
        eligibleBranches: document.getElementById('coordEligibleBranches').value.trim(),
        skills: document.getElementById('coordSkills').value.trim(),
        visitDate: document.getElementById('coordVisitDate').value,
        deadline: document.getElementById('coordDeadline').value,
        testDate: document.getElementById('coordTestDate').value,
        interviewDate: document.getElementById('coordInterviewDate').value,
        recruitmentStatus: document.getElementById('coordRecruitmentStatus').value,
        selectionProcess: document.getElementById('coordSelectionProcess').value.trim(),
        description: document.getElementById('coordDescription').value.trim()
    };

    if (forcedStatus) {
        payload.approvalStatus = forcedStatus;
    } else if (!isEdit) {
        payload.approvalStatus = 'Pending Approval';
    }

    try {
        const url = isEdit ? `${API_BASE}/jobs/${driveId}` : `${API_BASE}/jobs`;
        const method = isEdit ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (data.success) {
            showToast(data.message || (isEdit ? 'Drive updated successfully!' : 'Drive submitted for review!'), 'success');
            resetDriveForm();
            await loadCoordinatorDashboard();
            switchCoordTab('coordDrivesTab');
        } else {
            showToast(data.message || 'Operation failed.', 'error');
        }
    } catch (err) {
        console.error('Error saving drive:', err);
        showToast('Connection error communicating with server.', 'error');
    }
}

function saveDriveDraft() {
    handleCoordinatorSaveDrive(null, 'Draft');
}

async function submitDriveForApproval(driveId) {
    if (!confirm('Submit this recruitment drive for Placement Head review and approval?')) return;
    try {
        const res = await fetch(`${API_BASE}/jobs/${driveId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ approvalStatus: 'Pending Approval' })
        });
        const data = await res.json();
        if (data.success) {
            showToast('Drive submitted for Placement Head approval!', 'success');
            loadCoordinatorDrives();
        } else {
            showToast(data.message || 'Failed to submit drive.', 'error');
        }
    } catch (e) {
        showToast('Server error.', 'error');
    }
}

// ============================================================
// APPLICANTS & ROUND MANAGEMENT
// ============================================================
async function loadCoordinatorApplicants() {
    const tbody = document.getElementById('coordApplicantsTableBody');
    const driveSelect = document.getElementById('coordApplicantDriveSelect');

    try {
        const res = await fetch(`${API_BASE}/applications/company?assignedOnly=true`, { headers: getAuthHeaders() });
        const data = await res.json();

        if (data.success && Array.isArray(data.applications)) {
            allCoordinatorApplicants = data.applications;

            // Populate drive select options
            if (driveSelect) {
                const uniqueDrives = [...new Map(allCoordinatorApplicants.map(a => [a.job_id, a.company_name])).entries()];
                driveSelect.innerHTML = `<option value="ALL">All Assigned Recruitment Drives (${allCoordinatorApplicants.length} Candidates)</option>` +
                    uniqueDrives.map(([jid, cname]) => `<option value="${jid}">${escapeHtml(cname)}</option>`).join('');
            }

            renderCoordinatorApplicantsTable(allCoordinatorApplicants);
        }
    } catch (e) {
        console.error('Failed to load applicants:', e);
        if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="color:var(--danger); text-align:center;">Failed to load candidate applications.</td></tr>`;
    }
}

function renderCoordinatorApplicantsTable(applications) {
    const tbody = document.getElementById('coordApplicantsTableBody');
    if (!tbody) return;

    if (applications.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center; padding:30px; color:var(--text-muted);">
                    No candidate applications match the selected criteria.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = applications.map(app => {
        const statusBadge = getStatusBadgeHtml(app.status);
        const appliedDate = app.applied_at ? new Date(app.applied_at).toLocaleDateString() : 'Recent';

        return `
            <tr>
                <td>
                    <div style="font-weight:700; color:var(--text-primary); font-size:14px;">${escapeHtml(app.student_name)}</div>
                    <div style="font-size:12px; color:var(--text-muted);">${escapeHtml(app.student_email)}</div>
                    ${app.phone ? `<div style="font-size:11px; color:var(--text-secondary);">📞 ${escapeHtml(app.phone)}</div>` : ''}
                </td>
                <td style="font-size:12px;">
                    <div>🏛️ <strong>${escapeHtml(app.branch || 'Engineering')}</strong></div>
                    <div>🎓 CGPA: <strong>${app.student_cgpa || app.cgpa || 0}</strong></div>
                    <div>⚠️ Backlogs: <strong>${app.backlogs || 0}</strong></div>
                </td>
                <td>
                    <div style="font-weight:600; font-size:13px; color:var(--primary);">${escapeHtml(app.company_name)}</div>
                    <div style="font-size:12px; color:var(--text-secondary);">${escapeHtml(app.job_title)}</div>
                </td>
                <td>
                    ${statusBadge}
                    ${app.stage_notes ? `<div style="font-size:11px; color:var(--text-muted); margin-top:4px;">${escapeHtml(app.stage_notes)}</div>` : ''}
                </td>
                <td style="font-size:12px; color:var(--text-muted);">${appliedDate}</td>
                <td>
                    <select onchange="updateCandidateStage(${app.id}, this.value)" style="padding:4px 8px; font-size:12px; border-radius:6px;">
                        <option value="">Move Stage...</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Shortlisted">🎯 Shortlist</option>
                        <option value="Interview Scheduled">📅 Schedule Interview</option>
                        <option value="Selected">🎉 Offer / Selected</option>
                        <option value="Not Selected">✕ Reject Candidate</option>
                    </select>
                </td>
            </tr>
        `;
    }).join('');
}

function filterCoordinatorApplicants() {
    const driveId = document.getElementById('coordApplicantDriveSelect').value;
    const status = document.getElementById('coordApplicantStatusSelect').value;
    const search = (document.getElementById('coordApplicantSearch').value || '').toLowerCase().trim();

    let filtered = allCoordinatorApplicants.filter(a => {
        const matchesDrive = driveId === 'ALL' || a.job_id.toString() === driveId;
        const matchesStatus = status === 'ALL' || a.status.toLowerCase() === status.toLowerCase();
        const matchesSearch = !search ||
            (a.student_name || '').toLowerCase().includes(search) ||
            (a.student_email || '').toLowerCase().includes(search) ||
            (a.branch || '').toLowerCase().includes(search) ||
            (a.company_name || '').toLowerCase().includes(search);

        return matchesDrive && matchesStatus && matchesSearch;
    });

    renderCoordinatorApplicantsTable(filtered);
}

function filterApplicantsForDrive(driveId) {
    switchCoordTab('coordStudentsTab');
    const driveSelect = document.getElementById('coordApplicantDriveSelect');
    if (driveSelect) {
        driveSelect.value = driveId.toString();
        filterCoordinatorApplicants();
    }
}

async function updateCandidateStage(appId, newStatus) {
    if (!newStatus) return;

    const notes = prompt(`Optional feedback/notes for candidate stage update to '${newStatus}':`, `Updated by Placement Coordinator.`);

    try {
        const res = await fetch(`${API_BASE}/applications/${appId}/status`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                status: newStatus,
                stage: newStatus,
                notes: notes || undefined
            })
        });

        const data = await res.json();
        if (data.success) {
            showToast(`Candidate stage updated to ${newStatus}!`, 'success');
            await loadCoordinatorApplicants();
            loadCoordinatorDashboard();
        } else {
            showToast(data.message || 'Failed to update candidate status.', 'error');
        }
    } catch (e) {
        showToast('Server communication error.', 'error');
    }
}

// ============================================================
// ANNOUNCEMENTS
// ============================================================
async function loadCoordinatorAnnouncements() {
    const feed = document.getElementById('coordAnnouncementsFeed');
    if (!feed) return;

    try {
        const res = await fetch(`${API_BASE}/announcements`, { headers: getAuthHeaders() });
        const data = await res.json();

        if (data.success && Array.isArray(data.announcements)) {
            if (data.announcements.length === 0) {
                feed.innerHTML = `<p style="color:var(--text-muted); font-size:13px;">No announcements published yet.</p>`;
                return;
            }

            feed.innerHTML = data.announcements.map(a => {
                const isUrgent = a.priority === 'URGENT';
                return `
                    <div style="background:var(--bg-subtle); border-left:4px solid ${isUrgent ? 'var(--danger)' : 'var(--primary)'}; border-radius:var(--radius-sm); padding:12px 14px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                            <strong style="color:var(--text-primary); font-size:14px;">${escapeHtml(a.title)}</strong>
                            <span class="badge ${isUrgent ? 'badge-danger' : 'badge-primary'}" style="font-size:10px;">${escapeHtml(a.priority)}</span>
                        </div>
                        <p style="font-size:13px; color:var(--text-secondary); margin:4px 0 6px 0; line-height:1.5;">${escapeHtml(a.content)}</p>
                        <div style="font-size:11px; color:var(--text-muted); display:flex; justify-content:space-between;">
                            <span>✍️ ${escapeHtml(a.author_name)} (${escapeHtml(a.author_role)})</span>
                            <span>${new Date(a.created_at).toLocaleString()}</span>
                        </div>
                    </div>
                `;
            }).join('');
        }
    } catch (e) {
        console.error('Error loading announcements:', e);
    }
}

async function handleCoordinatorPostAnnouncement(event) {
    event.preventDefault();
    const title = document.getElementById('coordNoticeTitle').value.trim();
    const targetRole = document.getElementById('coordNoticeTarget').value;
    const priority = document.getElementById('coordNoticePriority').value;
    const content = document.getElementById('coordNoticeContent').value.trim();

    try {
        const res = await fetch(`${API_BASE}/announcements`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ title, content, targetRole, priority })
        });

        const data = await res.json();
        if (data.success) {
            showToast('Announcement broadcasted to candidates successfully!', 'success');
            document.getElementById('coordNoticeTitle').value = '';
            document.getElementById('coordNoticeContent').value = '';
            loadCoordinatorAnnouncements();
        } else {
            showToast(data.message || 'Failed to post announcement.', 'error');
        }
    } catch (e) {
        showToast('Server communication error.', 'error');
    }
}

// ============================================================
// AUDIT LOGS
// ============================================================
async function loadCoordinatorHistory() {
    const tbody = document.getElementById('coordAuditTableBody');
    if (!tbody) return;

    try {
        const res = await fetch(`${API_BASE}/audit-logs?limit=50`, { headers: getAuthHeaders() });
        const data = await res.json();

        if (data.success && Array.isArray(data.logs)) {
            if (data.logs.length === 0) {
                tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px; color:var(--text-muted);">No activity logs found.</td></tr>`;
                return;
            }

            tbody.innerHTML = data.logs.map(log => `
                <tr>
                    <td style="font-size:12px; color:var(--text-muted);">${new Date(log.created_at).toLocaleString()}</td>
                    <td><span class="badge badge-primary" style="font-size:11px;">${escapeHtml(log.action)}</span></td>
                    <td style="font-weight:600; font-size:12px;">${escapeHtml(log.target_type)} #${log.target_id || ''}</td>
                    <td style="font-size:13px; color:var(--text-secondary);">${escapeHtml(log.details)}</td>
                </tr>
            `).join('');
        }
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--danger);">Failed to load activity logs.</td></tr>`;
    }
}
