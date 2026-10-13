const API_BASE = window.PLACEMENT_API_BASE || ((window.location.protocol === 'file:' || (window.location.port && window.location.port !== '5000')) ? 'http://localhost:5000/api' : '/api');

const container = document.getElementById("jobsContainer");
let allJobs = [];

function getAuthHeaders() {
    const token = localStorage.getItem("token");
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
}

function updateNavbar() {
    const role = localStorage.getItem("userRole");
    const nav = document.getElementById("topNav");
    const notifWrapper = document.getElementById("notifWrapperNav");
    if (!nav) return;

    if (role) {
        if (notifWrapper && role === 'STUDENT') notifWrapper.style.display = 'block';

        let dashboardLink = "student-dashboard.html";
        if (role === "COMPANY") dashboardLink = "company.html";
        else if (role === "ADMIN" || role === "PLACEMENT_HEAD") dashboardLink = "admin-dashboard.html";
        else if (role === "COORDINATOR") dashboardLink = "coordinator-dashboard.html";

        nav.innerHTML = `
            <a href="index.html">Home</a>
            <a href="jobs.html" class="active">Drives</a>
            <a href="${dashboardLink}">Dashboard</a>
            <button onclick="logout()" class="logout-button" style="margin-left:8px;">Logout</button>
        `;
    }
}

async function loadJobs() {
    container.innerHTML = `<div class="skeleton" style="height: 250px;"></div><div class="skeleton" style="height: 250px;"></div>`;
    try {
        let list = [];
        if (typeof fetchVisitingPlacementDrives === 'function') {
            const res = await fetchVisitingPlacementDrives();
            list = res.drives || [];
        } else {
            let res = await fetch(`${API_BASE}/companies/visiting`, { headers: getAuthHeaders() });
            let data = await res.json();
            if (!data.success) {
                res = await fetch(`${API_BASE}/jobs`, { headers: getAuthHeaders() });
                data = await res.json();
            }
            list = data.companies || data.visitingCompanies || data.jobs || [];
        }

        if (Array.isArray(list) && list.length > 0) {
            allJobs = list;
            displayJobs(allJobs);
        } else {
            container.innerHTML = "<div class='empty-state'><p>No active placement drives currently scheduled.</p></div>";
        }
    } catch (err) {
        console.error("Error loading drives:", err);
        container.innerHTML = `
            <div style="grid-column:1 / -1; text-align:center; padding:30px;">
                <p style="color: var(--danger); margin-bottom:12px;">Unable to connect to server to load placement drives.</p>
                <button onclick="loadJobs()" class="btn btn-sm btn-secondary">🔄 Retry Loading</button>
            </div>
        `;
    }
}

function displayJobs(list) {
    container.innerHTML = "";

    if (list.length === 0) {
        container.innerHTML = "<div class='empty-state'><div class='empty-state-icon'>💼</div><h3>No Matching Drives Found</h3><p>Try modifying your search keywords or branch filters.</p></div>";
        return;
    }

    list.forEach(function (job) {
        const card = document.createElement("div");
        card.className = "rec-card";

        let buttonHtml = "";
        if (job.appliedStatus) {
            buttonHtml = `
                <button class="btn btn-sm btn-secondary" disabled style="flex:1;">
                    ✓ Applied (${escapeHtml(job.appliedStatus)})
                </button>
            `;
        } else {
            buttonHtml = `
                <button class="btn btn-sm btn-primary" id="apply-btn-${job.id}" onclick="applyJob(${job.id})" style="flex:1;">
                    Apply Now
                </button>
            `;
        }

        const skillChips = (job.skills || '').split(/[,;|]/).map(s => s.trim()).filter(Boolean)
            .map(s => `<span class="skill-chip skill-matched">${escapeHtml(s)}</span>`).join('');

        card.innerHTML = `
            <div>
                <div class="rec-card-top">
                    <div>
                        <h3>${escapeHtml(job.title)}</h3>
                        <span class="company-name">🏢 ${escapeHtml(job.company)}</span>
                    </div>
                    <div style="display:flex; flex-direction:column; align-items:flex-end; gap:4px;">
                        <span class="badge badge-primary">${escapeHtml(job.workMode || 'On-Site')}</span>
                        ${job.visitDate ? `<span class="badge badge-success" style="font-size:11px;">🗓️ Visit: ${escapeHtml(job.visitDate)}</span>` : ''}
                    </div>
                </div>

                <div class="rec-card-meta">
                    <div class="meta-item">📍 <span>${escapeHtml(job.location)}</span></div>
                    <div class="meta-item">💰 <strong>${escapeHtml(job.salary)}</strong></div>
                    <div class="meta-item">🎓 <span>Min CGPA: <strong>${job.cgpa}</strong></span></div>
                    <div class="meta-item">📅 <span>Deadline: ${escapeHtml(job.deadline || 'Nov 2026')}</span></div>
                    ${job.visitDate ? `<div class="meta-item" style="grid-column: 1 / -1; color: var(--primary); font-weight:600;">🗓️ Campus Visit: <span>${escapeHtml(job.visitDate)}</span></div>` : ''}
                </div>

                <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 6px;">
                    <strong>Eligible Branches:</strong> ${escapeHtml(job.eligibleBranches)}
                </div>

                <div style="font-size: 12px; font-weight: 600; color: var(--text-muted); margin-top: 8px;">
                    Required Competencies:
                </div>
                <div class="skill-chips-row">
                    ${skillChips}
                </div>
            </div>

            <div class="rec-actions" style="margin-top: 18px; gap:8px;">
                <button class="btn btn-sm btn-outline" style="flex:1;" onclick="openCompanyDetailsModal(${job.id})">
                    🏢 View Details
                </button>
                <button class="btn btn-sm btn-outline" style="flex:1;" onclick="openJobEligibilityModal(${job.id})">
                    🔍 Eligibility Audit
                </button>
                ${buttonHtml}
            </div>
        `;

        container.appendChild(card);
    });
}

async function applyJob(jobId) {
    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("userRole");

    if (!token || userRole !== "STUDENT") {
        alert("Please log in as a student to apply for jobs.");
        window.location.href = "login.html";
        return;
    }

    const btn = document.getElementById(`apply-btn-${jobId}`);
    if (btn) {
        btn.disabled = true;
        btn.innerText = "Applying...";
    }

    try {
        const response = await fetch(`${API_BASE}/applications`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ jobId })
        });
        const data = await response.json();

        if (response.ok && data.success) {
            showToast("Application submitted successfully!", "success");
            loadJobs();
        } else {
            showToast(data.message || "Failed to submit application.", "error");
            if (btn) {
                btn.disabled = false;
                btn.innerText = "Apply Now";
            }
        }
    } catch (err) {
        showToast("Error connecting to server.", "error");
        if (btn) {
            btn.disabled = false;
            btn.innerText = "Apply Now";
        }
    }
}

// Transparent Eligibility Checker Modal
async function openJobEligibilityModal(jobId) {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("Please log in as a student to audit your eligibility.");
        window.location.href = "login.html";
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/eligibility/job/${jobId}`, { headers: getAuthHeaders() });
        const data = await res.json();
        if (data.success) {
            document.getElementById("eligModalJobTitle").innerText = `${data.job.title} - Eligibility Criteria`;
            document.getElementById("eligModalCompany").innerText = `🏢 ${data.job.company} | ${data.job.salary}`;

            const list = document.getElementById("eligModalRulesList");
            list.innerHTML = data.criteria.map(c => `
                <div class="eligibility-rule-card ${c.passed ? 'pass' : 'fail'}">
                    <span class="rule-icon">${c.passed ? '✅' : '❌'}</span>
                    <div class="rule-content">
                        <h4>${escapeHtml(c.rule)}</h4>
                        <p>${escapeHtml(c.message)}</p>
                        <small style="color:var(--text-muted);">Required: ${escapeHtml(c.required)} | Your Value: ${escapeHtml(c.studentValue)}</small>
                    </div>
                </div>
            `).join('');

            const alertBox = document.getElementById("eligModalSummaryAlert");
            alertBox.className = `eligibility-summary-alert ${data.isEligible ? 'eligible' : 'ineligible'}`;
            alertBox.innerHTML = `
                <span style="font-size:22px;">${data.isEligible ? '🎉' : '⚠️'}</span>
                <div>${escapeHtml(data.summaryExplanation)}</div>
            `;

            const applyBtn = document.getElementById("eligModalApplyBtn");
            if (data.isEligible && !data.job.appliedStatus) {
                applyBtn.style.display = 'inline-block';
                applyBtn.onclick = () => {
                    closeModal('eligibilityModal');
                    applyJob(jobId);
                };
            } else {
                applyBtn.style.display = 'none';
            }

            openModal('eligibilityModal');
        }
    } catch (e) {
        showToast("Error auditing eligibility", "error");
    }
}

function filterJobsList() {
    const search = document.getElementById("searchInput").value.toLowerCase().trim();
    const branch = document.getElementById("branchFilter").value.toLowerCase();
    const driveType = document.getElementById("driveTypeFilter") ? document.getElementById("driveTypeFilter").value : "all";

    const filtered = allJobs.filter(function (job) {
        const matchesSearch = 
            job.company.toLowerCase().includes(search) ||
            job.title.toLowerCase().includes(search) ||
            job.skills.toLowerCase().includes(search) ||
            job.location.toLowerCase().includes(search);

        const matchesBranch = !branch || 
            job.eligibleBranches.toLowerCase().includes('all branches') ||
            job.eligibleBranches.toLowerCase().includes(branch);

        const matchesType = (driveType === 'all') || (driveType === 'visiting' && !!job.visitDate);

        return matchesSearch && matchesBranch && matchesType;
    });

    displayJobs(filtered);
}

document.getElementById("searchInput").addEventListener("input", filterJobsList);

updateNavbar();
loadJobs();