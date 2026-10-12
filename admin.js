const API_BASE = window.location.protocol === 'file:' ? 'http://localhost:5000/api' : '/api';

const token = localStorage.getItem("token");
const role = localStorage.getItem("userRole");

// Route protection
if (!token || role !== "ADMIN") {
    alert("Please log in as an administrator to access this dashboard.");
    window.location.href = "login.html";
}

const adminName = localStorage.getItem("userName") || "Administrator";
const nameEl = document.getElementById("adminName");
if (nameEl) nameEl.innerText = adminName;

function getAuthHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
}

function switchAdminTab(tabId, btn) {
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

    if (tabId === 'analyticsTab') loadAnalyticsDashboard();
    else if (tabId === 'adminCalendarTab') loadAdminCalendar();
    else if (tabId === 'drivesTab') loadVisitingDrives();
    else if (tabId === 'applicationsTab') loadApplicationsTable();
    else if (tabId === 'moderationTab') loadModerationQueue();
}

// ============================================================
// TAB 1: REAL DATABASE ANALYTICS (FEATURE 10)
// ============================================================

async function loadAnalyticsDashboard() {
    try {
        const res = await fetch(`${API_BASE}/analytics/overview`, { headers: getAuthHeaders() });
        const data = await res.json();

        if (data.success) {
            const { kpis, branchStats, companyStats, funnel, conversionRates } = data;

            // 1. KPI Cards
            document.getElementById("analyticsStudentCount").innerText = kpis.totalRegisteredStudents;
            document.getElementById("analyticsPlacementRate").innerText = `${kpis.overallPlacementPercentage}%`;
            document.getElementById("placedSubtext").innerText = `${kpis.totalStudentsPlaced} candidates placed`;
            document.getElementById("analyticsHighestCTC").innerText = kpis.salaryStats.highestLPA;
            document.getElementById("analyticsAverageCTC").innerText = kpis.salaryStats.averageLPA;
            document.getElementById("analyticsMedianCTC").innerText = `Median: ${kpis.salaryStats.medianLPA} | Min: ${kpis.salaryStats.lowestLPA}`;

            // 2. Conversion Funnel
            const funnelContainer = document.getElementById("funnelVisualContainer");
            if (funnelContainer) {
                funnelContainer.innerHTML = funnel.map((step, idx) => `
                    <div style="background:var(--bg-subtle); padding:14px; border-radius:var(--radius-sm);">
                        <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:13px;">
                            <strong>${escapeHtml(step.stage)}</strong>
                            <span><strong>${step.count} candidates</strong> (${step.percentage}%)</span>
                        </div>
                        <div class="progress-track" style="height:10px;">
                            <div class="progress-fill" style="width:${Math.max(10, step.percentage)}%; background:${idx === 2 ? 'var(--success)' : 'var(--primary)'};"></div>
                        </div>
                        ${step.dropoff > 0 ? `<small style="font-size:11px; color:var(--text-muted); display:block; margin-top:4px;">Drop-off: ${step.dropoff} candidates</small>` : ''}
                    </div>
                `).join('');
            }

            // 3. Branch-Wise Placement Rates Table
            const branchTbody = document.getElementById("branchStatsTable");
            if (branchTbody) {
                if (branchStats.length === 0) {
                    branchTbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No student branch data found.</td></tr>`;
                } else {
                    branchTbody.innerHTML = branchStats.map(b => `
                        <tr>
                            <td><strong>${escapeHtml(b.branch)}</strong></td>
                            <td>${b.total_students}</td>
                            <td>${b.placed_students}</td>
                            <td>
                                <div style="display:flex; align-items:center; gap:8px;">
                                    <div class="progress-track" style="width:100px; height:6px;">
                                        <div class="progress-fill" style="width:${b.placement_rate}%; background:var(--success);"></div>
                                    </div>
                                    <strong style="color:var(--success); font-size:12px;">${b.placement_rate}%</strong>
                                </div>
                            </td>
                        </tr>
                    `).join('');
                }
            }

            // 4. Company-Wise Selections Table
            const companyTbody = document.getElementById("companyStatsTable");
            if (companyTbody) {
                if (companyStats.length === 0) {
                    companyTbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No company hiring records yet.</td></tr>`;
                } else {
                    companyTbody.innerHTML = companyStats.map(c => `
                        <tr>
                            <td><strong>${escapeHtml(c.company_name)}</strong></td>
                            <td>${c.total_applications}</td>
                            <td>${c.shortlisted_count}</td>
                            <td><span class="badge badge-success">${c.selected_count} Placed</span></td>
                            <td>${escapeHtml(c.highest_package || 'N/A')}</td>
                        </tr>
                    `).join('');
                }
            }

            // 5. Render Interactive Charts
            renderAnalyticsCharts(kpis, branchStats);
        }
    } catch (err) {
        console.error("Error loading analytics:", err);
    }
}

// Chart Instances
let deptChartInstance = null;
let salaryChartInstance = null;
let donutChartInstance = null;

function renderAnalyticsCharts(kpis, branchStats) {
    if (typeof Chart === 'undefined') return;

    // 1. Department-Wise Placement Chart (Bar)
    const deptCanvas = document.getElementById("deptPlacementChart");
    if (deptCanvas && branchStats && branchStats.length > 0) {
        if (deptChartInstance) deptChartInstance.destroy();

        const labels = branchStats.map(b => b.branch);
        const totalData = branchStats.map(b => b.total_students);
        const placedData = branchStats.map(b => b.placed_students);

        deptChartInstance = new Chart(deptCanvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Total Students',
                        data: totalData,
                        backgroundColor: '#6C4CF1',
                        borderRadius: 6
                    },
                    {
                        label: 'Placed Students',
                        data: placedData,
                        backgroundColor: '#10B981',
                        borderRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' },
                    tooltip: { mode: 'index', intersect: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                }
            }
        });
    }

    // 2. Package Statistics Comparative Chart (Bar)
    const salCanvas = document.getElementById("salaryStatsChart");
    if (salCanvas && kpis && kpis.salaryStats) {
        if (salaryChartInstance) salaryChartInstance.destroy();

        const maxS = parseFloat(kpis.salaryStats.highestLPA) || 0;
        const avgS = parseFloat(kpis.salaryStats.averageLPA) || 0;
        const medS = parseFloat(kpis.salaryStats.medianLPA) || 0;
        const minS = parseFloat(kpis.salaryStats.lowestLPA) || 0;

        salaryChartInstance = new Chart(salCanvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Highest CTC', 'Average CTC', 'Median CTC', 'Minimum CTC'],
                datasets: [{
                    label: 'Package (LPA)',
                    data: [maxS, avgS, medS, minS],
                    backgroundColor: ['#6C4CF1', '#38BDF8', '#A78BFA', '#CBD5E1'],
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => `${ctx.parsed.y} LPA`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (v) => `${v} LPA`
                        }
                    }
                }
            }
        });
    }

    // 3. Overall Placement Percentage Donut Chart
    const donutCanvas = document.getElementById("placementDonutChart");
    if (donutCanvas && kpis) {
        if (donutChartInstance) donutChartInstance.destroy();

        const placedCount = kpis.totalStudentsPlaced || 0;
        const remainingCount = Math.max(0, (kpis.totalRegisteredStudents || 0) - placedCount);

        donutChartInstance = new Chart(donutCanvas.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Placed Candidates', 'Seeking Placement'],
                datasets: [{
                    data: [placedCount, remainingCount],
                    backgroundColor: ['#10B981', '#E9E5FF'],
                    hoverOffset: 6,
                    borderWidth: 2,
                    borderColor: '#FFFFFF'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                const total = placedCount + remainingCount;
                                const pct = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : 0;
                                return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`;
                            }
                        }
                    }
                },
                cutout: '68%'
            }
        });
    }
}

// ============================================================
// ADMIN CALENDAR TAB: DRIVE CALENDAR & VISITS
// ============================================================

let allAdminCalendarEvents = [];
async function loadAdminCalendar() {
    const list = document.getElementById("adminCalendarEventsList");
    if (!list) return;

    try {
        const res = await fetch(`${API_BASE}/timeline/calendar`, { headers: getAuthHeaders() });
        const data = await res.json();
        if (data.success && data.events) {
            allAdminCalendarEvents = data.events;
            renderAdminCalendarList(allAdminCalendarEvents);
        }
    } catch (e) {
        list.innerHTML = `<p style="color:var(--danger);">Error loading calendar events.</p>`;
    }
}

function filterAdminCalendar(category, btn) {
    document.querySelectorAll('#adminCalendarTab .calendar-pill').forEach(p => p.classList.remove('active'));
    if (btn) btn.classList.add('active');

    if (category === 'all') {
        renderAdminCalendarList(allAdminCalendarEvents);
    } else {
        const filtered = allAdminCalendarEvents.filter(ev => ev.category === category);
        renderAdminCalendarList(filtered);
    }
}

function renderAdminCalendarList(events) {
    const list = document.getElementById("adminCalendarEventsList");
    if (!list) return;

    if (events.length === 0) {
        list.innerHTML = `<div style="padding:24px; text-align:center; color:var(--text-muted);">No events found in this category.</div>`;
        return;
    }

    list.innerHTML = events.map(ev => {
        const d = new Date(ev.date);
        const dateStr = !isNaN(d.getTime()) ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ev.date;

        return `
            <div class="calendar-event-card" style="border-left-color: ${ev.category === 'deadline' ? 'var(--danger)' : ev.category === 'visit' ? 'var(--primary)' : ev.category === 'test' ? 'var(--warning)' : 'var(--success)'};">
                <div style="display:flex; align-items:center; gap:16px;">
                    <div class="calendar-date-badge">
                        <strong>${dateStr}</strong>
                        <small>${escapeHtml(ev.category).toUpperCase()}</small>
                    </div>
                    <div>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <h4 style="margin:0; font-size:15px; color:var(--text-primary);">${escapeHtml(ev.title)}</h4>
                            <span class="badge ${ev.category === 'deadline' ? 'badge-danger' : ev.category === 'visit' ? 'badge-primary' : 'badge-warning'}">${escapeHtml(ev.type)}</span>
                        </div>
                        <p style="font-size:13px; color:var(--text-secondary); margin:4px 0 0 0;">
                            ${escapeHtml(ev.description || '')} 
                            <span style="color:var(--text-muted); margin-left:8px;">📍 Venue: <strong>${escapeHtml(ev.venue || 'On-Campus')}</strong></span>
                        </p>
                    </div>
                </div>
                <div>
                    <span class="badge ${ev.isUrgent ? 'badge-danger' : 'badge-primary'}">
                        ${ev.isExpired ? 'Completed' : ev.daysRemaining <= 0 ? 'Today!' : `${ev.daysRemaining} days left`}
                    </span>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================================
// TAB 2: MANAGE APPLICATIONS & STAGES
// ============================================================

async function loadApplicationsTable(filterCompany = null) {
    const tbody = document.getElementById("applicationTable");
    if (!tbody) return;

    try {
        const res = await fetch(`${API_BASE}/stats/admin`, { headers: getAuthHeaders() });
        const data = await res.json();

        if (data.success && data.applications) {
            let apps = data.applications;
            if (filterCompany) {
                apps = apps.filter(a => a.company && a.company.toLowerCase().includes(filterCompany.toLowerCase()));
            }

            if (apps.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:30px;">
                    ${filterCompany ? `No applications found for <strong>${escapeHtml(filterCompany)}</strong>. <button onclick="loadApplicationsTable()" class="btn btn-sm btn-outline" style="margin-left:8px;">Show All Applications</button>` : 'No applications submitted yet.'}
                </td></tr>`;
                return;
            }

            let filterHeader = "";
            if (filterCompany) {
                filterHeader = `
                    <tr style="background:var(--primary-subtle);">
                        <td colspan="6" style="padding:10px 16px; font-weight:600; font-size:13px; color:var(--primary);">
                            Showing applicants for visiting company: <strong>${escapeHtml(filterCompany)}</strong> (${apps.length} candidate${apps.length === 1 ? '' : 's'})
                            <button onclick="loadApplicationsTable()" class="btn btn-sm btn-secondary" style="margin-left:14px; font-size:11px; padding:3px 8px;">✕ Clear Filter</button>
                        </td>
                    </tr>
                `;
            }

            tbody.innerHTML = filterHeader + apps.map(app => {
                const badgeHtml = typeof getStatusBadgeHtml === 'function'
                    ? getStatusBadgeHtml(app.status)
                    : `<span class="badge badge-primary">${escapeHtml(app.status)}</span>`;

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
                const options = statuses.map(s => {
                    const isSelected = (s === app.status) || (s === 'Not Selected' && app.status === 'Rejected');
                    return `<option value="${s}" ${isSelected ? 'selected' : ''}>${s}</option>`;
                }).join('');

                return `
                    <tr>
                        <td>
                            <strong>${escapeHtml(app.student)}</strong><br>
                            <small style="color:var(--text-muted);">${escapeHtml(app.student_email || '')}</small>
                        </td>
                        <td>
                            <span>${escapeHtml(app.branch || 'N/A')}</span><br>
                            <small style="color:var(--text-muted);">CGPA: ${app.cgpa || 'N/A'}</small>
                        </td>
                        <td><strong>${escapeHtml(app.company)}</strong></td>
                        <td>${escapeHtml(app.job)}</td>
                        <td id="admin-badge-${app.id}">
                            ${badgeHtml}
                        </td>
                        <td>
                            <select onchange="updateApplicationStage(${app.id}, this.value)" style="padding:6px 10px; font-size:12px; font-weight:600; border-radius:var(--radius-sm); margin-bottom:0; width:auto; cursor:pointer;">
                                ${options}
                            </select>
                        </td>
                    </tr>
                `;
            }).join('');
        }
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--danger);">Error loading applications.</td></tr>`;
    }
}

async function updateApplicationStage(appId, newStatus) {
    try {
        const res = await fetch(`${API_BASE}/applications/${appId}/status`, {
            method: "PATCH",
            headers: getAuthHeaders(),
            body: JSON.stringify({ status: newStatus })
        });
        const data = await res.json();
        if (data.success) {
            showToast(`Application transitioned to ${newStatus}. Milestone logged & candidate notified.`, "success");
            loadApplicationsTable();
            loadAnalyticsDashboard();
        } else {
            showToast(data.message || "Failed to update status", "error");
        }
    } catch (e) {
        showToast("Error updating application status", "error");
    }
}

// ============================================================
// TAB 3: ALUMNI MODERATION QUEUE (FEATURE 8)
// ============================================================

async function loadModerationQueue() {
    const tbody = document.getElementById("moderationTable");
    if (!tbody) return;

    try {
        const res = await fetch(`${API_BASE}/alumni/experiences`, { headers: getAuthHeaders() });
        const data = await res.json();

        if (data.success && data.experiences) {
            if (data.experiences.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:30px;">No interview experiences recorded.</td></tr>`;
                return;
            }

            tbody.innerHTML = data.experiences.map(exp => `
                <tr>
                    <td>
                        <strong>${escapeHtml(exp.authorName)}</strong>
                        ${exp.isAnonymous ? '<br><small style="color:var(--text-muted);">(Requested Anonymous)</small>' : ''}
                    </td>
                    <td>
                        <strong>${escapeHtml(exp.companyName)}</strong><br>
                        <small style="color:var(--text-secondary);">${escapeHtml(exp.jobRole)}</small>
                    </td>
                    <td>${escapeHtml(exp.salaryOffered || 'N/A')}</td>
                    <td style="max-width:320px;">
                        <div style="font-size:12px; line-height:1.4; color:var(--text-secondary);">
                            ${escapeHtml(exp.roundsDetail)}
                        </div>
                        ${exp.tips ? `<small style="color:var(--primary); display:block; margin-top:4px;">Tip: ${escapeHtml(exp.tips)}</small>` : ''}
                    </td>
                    <td>
                        <span class="badge ${exp.isApproved ? 'badge-success' : 'badge-warning'}">
                            ${exp.isApproved ? '✓ Published' : '⏳ Pending Review'}
                        </span>
                    </td>
                    <td>
                        ${!exp.isApproved ? `
                            <div style="display:flex; gap:6px;">
                                <button onclick="moderateSubmission(${exp.id}, 'approve')" class="btn btn-sm btn-primary">Approve</button>
                                <button onclick="moderateSubmission(${exp.id}, 'reject')" class="btn btn-sm btn-secondary" style="color:var(--danger);">Reject</button>
                            </div>
                        ` : `
                            <button onclick="moderateSubmission(${exp.id}, 'reject')" class="btn btn-sm btn-outline" style="color:var(--danger); font-size:11px;">Remove</button>
                        `}
                    </td>
                </tr>
            `).join('');
        }
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--danger);">Error loading moderation queue.</td></tr>`;
    }
}

async function moderateSubmission(expId, action) {
    try {
        const res = await fetch(`${API_BASE}/alumni/experiences/${expId}/moderate`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ action })
        });
        const data = await res.json();
        if (data.success) {
            showToast(data.message, "success");
            loadModerationQueue();
        } else {
            showToast(data.message || "Failed to moderate", "error");
        }
    } catch (e) {
        showToast("Error communicating with server", "error");
    }
}

// ============================================================
// TAB: ANNOUNCE VISITING COMPANIES & SCHEDULE DRIVES
// ============================================================

let allVisitingDrives = [];

async function loadVisitingDrives() {
    const tbody = document.getElementById("visitingDrivesTable");
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;">Loading scheduled drives...</td></tr>`;

    try {
        const res = await fetch(`${API_BASE}/jobs`, { headers: getAuthHeaders() });
        const data = await res.json();

        if (data.success && Array.isArray(data.jobs)) {
            allVisitingDrives = data.jobs;

            if (data.jobs.length === 0) {
                tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:var(--text-muted); padding:30px;">No campus recruitment drives announced yet. Use the form above to announce a visiting company.</td></tr>`;
                return;
            }

            tbody.innerHTML = data.jobs.map(job => {
                const visitDisplay = job.visitDate ? `<strong>${escapeHtml(job.visitDate)}</strong>` : '<span style="color:var(--text-muted);">TBD</span>';
                const deadlineDisplay = job.deadline ? `<span>${escapeHtml(job.deadline)}</span>` : '<span style="color:var(--text-muted);">Open</span>';
                const applicantCount = job.applicantCount || 0;

                return `
                    <tr>
                        <td>
                            <strong>${escapeHtml(job.company)}</strong><br>
                            <span class="badge badge-primary" style="font-size:10px; margin-top:2px;">${escapeHtml(job.workMode || 'On-Campus')}</span>
                        </td>
                        <td>
                            <strong>${escapeHtml(job.title)}</strong><br>
                            <small style="color:var(--text-muted);">${escapeHtml(job.location || 'College Campus')}</small>
                        </td>
                        <td>
                            <span class="badge badge-primary" style="font-size:12px;">🗓️ ${visitDisplay}</span>
                        </td>
                        <td>
                            <span class="badge badge-warning" style="font-size:12px;">⏳ ${deadlineDisplay}</span>
                        </td>
                        <td>
                            <strong style="color:var(--success);">${escapeHtml(job.salary)}</strong>
                            ${job.baseSalary ? `<br><small style="color:var(--text-muted);">Base: ${escapeHtml(job.baseSalary)}</small>` : ''}
                        </td>
                        <td>
                            <div style="font-size:12px;">
                                <span>Min CGPA: <strong>${job.cgpa}</strong></span> | 
                                <span>Backlogs: <strong>≤ ${job.maxBacklogs}</strong></span><br>
                                <small style="color:var(--text-muted);">${escapeHtml(job.eligibleBranches)}</small>
                            </div>
                        </td>
                        <td>
                            <span class="badge badge-primary" style="font-size:13px; font-weight:700;">
                                👥 ${applicantCount} Applied
                            </span>
                        </td>
                        <td>
                            <div style="display:flex; flex-direction:column; gap:6px;">
                                <button onclick="viewCompanyApplicants('${escapeHtml(job.company)}')" class="btn btn-sm btn-outline" style="font-size:11px; padding:4px 8px;">
                                    👥 Applicants (${applicantCount})
                                </button>
                                <button onclick="deleteDrive(${job.id}, '${escapeHtml(job.company)}')" class="btn btn-sm btn-secondary" style="color:var(--danger); font-size:11px; padding:4px 8px;">
                                    🗑️ Remove
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        } else {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:var(--text-muted);">No drives found.</td></tr>`;
        }
    } catch (err) {
        console.error("Error loading visiting drives:", err);
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:var(--danger);">Error loading visiting drives.</td></tr>`;
    }
}

async function handleCreateDrive(e) {
    e.preventDefault();
    const btn = document.getElementById("btnPublishDrive");
    const alertBox = document.getElementById("driveAlertBox");

    const companyName = document.getElementById("driveCompanyName").value.trim();
    const jobTitle = document.getElementById("driveJobTitle").value.trim();
    const visitDate = document.getElementById("driveVisitDate").value.trim();
    const deadline = document.getElementById("driveDeadline").value.trim();
    const salary = document.getElementById("driveSalary").value.trim();
    const baseSalary = document.getElementById("driveBaseSalary").value.trim();
    const minimumCgpa = parseFloat(document.getElementById("driveCgpa").value) || 0;
    const maxBacklogs = parseInt(document.getElementById("driveBacklogs").value, 10) || 0;
    const workMode = document.getElementById("driveWorkMode").value;
    const location = document.getElementById("driveLocation").value.trim();
    const eligibleBranches = document.getElementById("driveBranches").value.trim();
    const skills = document.getElementById("driveSkills").value.trim();
    const description = document.getElementById("driveDescription").value.trim();

    if (!companyName || !jobTitle || !visitDate || !deadline || !salary || !skills) {
        showToast("Please fill in all required fields.", "error");
        return;
    }

    if (btn) {
        btn.disabled = true;
        btn.innerText = "📢 Publishing & Notifying Students...";
    }

    try {
        const payload = {
            companyName,
            jobTitle,
            visitDate,
            deadline,
            salary,
            baseSalary,
            minimumCgpa,
            maxBacklogs,
            workMode,
            location: location || "On-Campus",
            eligibleBranches: eligibleBranches || "All Branches",
            skills,
            description
        };

        const res = await fetch(`${API_BASE}/jobs`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (data.success) {
            showToast(`📢 ${companyName} Campus Drive announced! All students notified.`, "success");
            if (alertBox) {
                alertBox.style.display = "block";
                alertBox.innerHTML = `
                    <div style="background:var(--success-subtle); color:var(--success); border:1px solid rgba(22,163,74,0.3); padding:14px; border-radius:var(--radius-sm); font-size:13px; font-weight:600;">
                        ✅ Success: Campus recruitment drive for <strong>${escapeHtml(companyName)}</strong> scheduled for <strong>${escapeHtml(visitDate)}</strong>. Notification alert broadcast to all enrolled candidates!
                    </div>
                `;
                setTimeout(() => { alertBox.style.display = 'none'; }, 6000);
            }
            document.getElementById("announceCompanyForm").reset();
            // Reload drives table and live analytics
            loadVisitingDrives();
            loadAnalyticsDashboard();
        } else {
            showToast(data.message || "Failed to schedule drive.", "error");
        }
    } catch (err) {
        console.error("Create drive error:", err);
        showToast("Server connection error while announcing drive.", "error");
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerText = "📢 Announce Visiting Drive & Broadcast to Students";
        }
    }
}

async function deleteDrive(jobId, companyName) {
    if (!confirm(`Are you sure you want to remove the recruitment drive for "${companyName}"? This will cancel the campus visit and related applications.`)) {
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/jobs/${jobId}`, {
            method: "DELETE",
            headers: getAuthHeaders()
        });
        const data = await res.json();

        if (data.success) {
            showToast(`Recruitment drive for ${companyName} removed.`, "success");
            loadVisitingDrives();
            loadAnalyticsDashboard();
        } else {
            showToast(data.message || "Failed to delete drive.", "error");
        }
    } catch (e) {
        showToast("Error communicating with server.", "error");
    }
}

function viewCompanyApplicants(companyName) {
    const appTabBtn = document.querySelector('.sidebar .tab-link[onclick*="applicationsTab"]');
    switchAdminTab('applicationsTab', appTabBtn);
    loadApplicationsTable(companyName);
}

// Initial load
loadAnalyticsDashboard();