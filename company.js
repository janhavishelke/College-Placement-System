const API_BASE = window.PLACEMENT_API_BASE || ((window.location.protocol === 'file:' || (window.location.port && window.location.port !== '5000')) ? 'http://localhost:5000/api' : '/api');

const token = localStorage.getItem("token");
const role = localStorage.getItem("userRole");

// Role verification
if (!token || role !== "COMPANY") {
    alert("Please log in as a company to access this dashboard.");
    window.location.href = "login.html";
}

const companyNameStored = localStorage.getItem("userName") || "Company";
const companyNavEl = document.getElementById("companyNavName");
if (companyNavEl) companyNavEl.innerText = companyNameStored;

const companyInput = document.getElementById("companyName");
if (companyInput) companyInput.value = companyNameStored;

function getAuthHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
}

function switchCompanyTab(tabId, btn) {
    document.querySelectorAll('.dashboard-tab-panel').forEach(panel => {
        panel.style.display = 'none';
        panel.classList.remove('active');
    });
    document.querySelectorAll('.sidebar .tab-link').forEach(link => {
        link.classList.remove('active');
    });

    const target = document.getElementById(tabId);
    if (target) {
        target.style.display = 'block';
        target.classList.add('active');
    }
    if (btn) btn.classList.add('active');

    if (tabId === 'overviewTab') loadCompanyDashboard();
    else if (tabId === 'applicantsTab') loadFullApplicantsTable();
}

async function loadCompanyDashboard() {
    try {
        const res = await fetch(`${API_BASE}/stats/company`, { headers: getAuthHeaders() });
        const data = await res.json();
        if (data.success) {
            document.getElementById("companyJobsCount").innerText = data.stats.jobsPosted;
            document.getElementById("companyApplicantsCount").innerText = data.stats.totalApplicants;
            document.getElementById("companyShortlistedCount").innerText = data.stats.shortlisted;

            renderApplicantsTable(data.recentApplicants || []);
        }
    } catch (err) {
        console.error("Error loading company dashboard:", err);
    }
}

let allCompanyApplicants = [];

function renderStatusSelectOptions(currentStatus) {
    const statuses = [
        'Applied',
        'Under Review',
        'Shortlisted',
        'Interview Scheduled',
        'Selected',
        'Not Selected',
        'Offer Accepted',
        'Offer Declined'
    ];
    return statuses.map(s => {
        const isSelected = (s === currentStatus) || (s === 'Not Selected' && currentStatus === 'Rejected');
        return `<option value="${s}" ${isSelected ? 'selected' : ''}>${s}</option>`;
    }).join('');
}

function renderApplicantsTable(applicants) {
    const tbody = document.getElementById("companyApplicationsTable");
    if (!tbody) return;

    if (applicants.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding:30px;">No applicants received yet for your postings.</td></tr>`;
        return;
    }

    tbody.innerHTML = applicants.map(app => {
        const badgeHtml = typeof getStatusBadgeHtml === 'function' 
            ? getStatusBadgeHtml(app.status) 
            : `<span class="badge badge-primary">${escapeHtml(app.status)}</span>`;

        return `
            <tr>
                <td><strong>${escapeHtml(app.student_name)}</strong></td>
                <td>${escapeHtml(app.branch || 'N/A')}</td>
                <td><strong>${app.cgpa || 'N/A'}</strong></td>
                <td>${escapeHtml(app.job_title)}</td>
                <td id="company-status-cell-${app.id}">${badgeHtml}</td>
                <td>
                    <select onchange="updateApplicantStatus(${app.id}, this.value, this)" style="padding:6px 10px; font-size:12px; font-weight:600; border-radius:var(--radius-sm); margin-bottom:0; width:auto; cursor:pointer;">
                        ${renderStatusSelectOptions(app.status)}
                    </select>
                </td>
            </tr>
        `;
    }).join('');
}

async function loadFullApplicantsTable() {
    const tbody = document.getElementById("companyFullApplicantsTable");
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:var(--text-muted);">🔄 Loading applicant records from database...</td></tr>`;

    try {
        const res = await fetch(`${API_BASE}/applications/company`, { headers: getAuthHeaders() });
        const data = await res.json();

        if (data.success && Array.isArray(data.applications)) {
            allCompanyApplicants = data.applications;
            filterRecruiterApplicants();
        } else {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:30px;">No candidates have applied yet.</td></tr>`;
        }
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--danger); padding:30px;">Server error loading applicants.</td></tr>`;
    }
}

function filterRecruiterApplicants() {
    const tbody = document.getElementById("companyFullApplicantsTable");
    if (!tbody) return;

    const search = (document.getElementById("recruiterSearchInput")?.value || "").toLowerCase().trim();
    const statusFilter = document.getElementById("recruiterStatusFilterSelect")?.value || "all";

    const filtered = allCompanyApplicants.filter(app => {
        if (statusFilter !== 'all') {
            if (statusFilter === 'Not Selected') {
                if (app.status !== 'Not Selected' && app.status !== 'Rejected') return false;
            } else if (app.status !== statusFilter) {
                return false;
            }
        }

        if (search) {
            const nameMatch = (app.student_name || '').toLowerCase().includes(search);
            const emailMatch = (app.student_email || '').toLowerCase().includes(search);
            const roleMatch = (app.job_title || '').toLowerCase().includes(search);
            const branchMatch = (app.branch || '').toLowerCase().includes(search);
            const skillsMatch = (app.student_skills || '').toLowerCase().includes(search);
            if (!nameMatch && !emailMatch && !roleMatch && !branchMatch && !skillsMatch) return false;
        }

        return true;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; color:var(--text-muted); padding:36px 20px;">
                    <div style="font-size:28px; margin-bottom:8px;">🔍</div>
                    <strong style="color:var(--text-primary); font-size:14px; display:block;">No Candidates Match Criteria</strong>
                    <span style="font-size:13px;">Try clearing search keywords or choosing "All Application Stages".</span>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map(app => {
        const badgeHtml = typeof getStatusBadgeHtml === 'function' 
            ? getStatusBadgeHtml(app.status) 
            : `<span class="badge badge-primary">${escapeHtml(app.status)}</span>`;

        return `
            <tr>
                <td>
                    <strong style="font-size:14px; color:var(--text-primary); display:block;">${escapeHtml(app.student_name)}</strong>
                    <small style="color:var(--text-muted); font-size:11.5px;">✉️ ${escapeHtml(app.student_email)}</small>
                </td>
                <td>
                    <span style="font-size:13px; color:var(--text-primary);">${escapeHtml(app.branch || 'Engineering')}</span>
                    ${app.backlogs !== undefined ? `<small style="display:block; color:var(--text-muted); font-size:11px;">Backlogs: ${app.backlogs}</small>` : ''}
                </td>
                <td>
                    <strong style="font-size:14px; color:var(--primary);">${app.student_cgpa || app.cgpa || '0.0'}</strong>
                </td>
                <td>
                    <strong style="font-size:13.5px; color:var(--text-primary);">${escapeHtml(app.job_title)}</strong>
                </td>
                <td>
                    <div style="font-size:11.5px; color:var(--text-secondary); max-width:200px; line-height:1.4;">
                        ${escapeHtml(app.student_skills || 'General Engineering')}
                    </div>
                </td>
                <td id="company-full-status-cell-${app.id}">
                    ${badgeHtml}
                </td>
                <td>
                    <select onchange="updateApplicantStatus(${app.id}, this.value, this)" style="padding:6px 10px; font-size:12.5px; font-weight:600; border-radius:var(--radius-sm); border:1px solid var(--border-color); background:var(--bg-card); color:var(--text-primary); margin-bottom:0; width:auto; cursor:pointer;">
                        ${renderStatusSelectOptions(app.status)}
                    </select>
                </td>
            </tr>
        `;
    }).join('');
}

async function updateApplicantStatus(appId, newStatus, selectEl) {
    if (selectEl) selectEl.disabled = true;

    try {
        const res = await fetch(`${API_BASE}/applications/${appId}/status`, {
            method: "PATCH",
            headers: getAuthHeaders(),
            body: JSON.stringify({ status: newStatus })
        });

        const data = await res.json();
        if (selectEl) selectEl.disabled = false;

        if (res.ok && data.success) {
            showToast(`Candidate selection status updated to "${newStatus}". Student notified immediately.`, "success");
            
            // Update local memory and cells
            const targetApp = allCompanyApplicants.find(a => a.id === appId);
            if (targetApp) targetApp.status = newStatus;

            const overviewCell = document.getElementById(`company-status-cell-${appId}`);
            if (overviewCell) overviewCell.innerHTML = getStatusBadgeHtml(newStatus);

            const fullCell = document.getElementById(`company-full-status-cell-${appId}`);
            if (fullCell) fullCell.innerHTML = getStatusBadgeHtml(newStatus);

            loadCompanyDashboard();
        } else {
            showToast(data.message || "Failed to update status", "error");
            loadCompanyDashboard();
            loadFullApplicantsTable();
        }
    } catch (err) {
        if (selectEl) selectEl.disabled = false;
        showToast("Error updating candidate status. Please check server connection.", "error");
    }
}

async function handlePostJob(e) {
    e.preventDefault();
    const btn = document.getElementById("postJobSubmitBtn");
    btn.disabled = true;

    const payload = {
        companyName: document.getElementById("companyName").value,
        jobTitle: document.getElementById("jobTitle").value,
        minimumCgpa: document.getElementById("minimumCgpa").value,
        maxBacklogs: document.getElementById("maxBacklogs").value,
        eligibleBranches: document.getElementById("eligibleBranches").value,
        skills: document.getElementById("skills").value,
        salary: document.getElementById("salary").value,
        baseSalary: document.getElementById("baseSalary").value,
        bonus: document.getElementById("bonusSalary").value,
        location: document.getElementById("location").value,
        workMode: document.getElementById("workMode").value,
        bondMonths: document.getElementById("bondMonths").value,
        deadline: document.getElementById("deadline").value,
        description: document.getElementById("description").value
    };

    try {
        const response = await fetch(`${API_BASE}/jobs`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        btn.disabled = false;

        if (response.ok && data.success) {
            showToast("Placement drive published successfully! Candidates can now review criteria and apply.", "success");
            document.getElementById("jobForm").reset();
            document.getElementById("companyName").value = companyNameStored;
            loadCompanyDashboard();
        } else {
            showToast(data.message || "Failed to post drive", "error");
        }
    } catch (err) {
        btn.disabled = false;
        showToast("Error communicating with server", "error");
    }
}

// Initial load
loadCompanyDashboard();