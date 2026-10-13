const API_BASE = window.PLACEMENT_API_BASE || ((window.location.protocol === 'file:' || (window.location.port && window.location.port !== '5000')) ? 'http://localhost:5000/api' : '/api');

const token = localStorage.getItem("token");
const role = localStorage.getItem("userRole");

// Route protection
if (!token || (role !== "ADMIN" && role !== "PLACEMENT_HEAD")) {
    alert("Please log in as a Placement Head or Administrator to access this dashboard.");
    window.location.href = "login.html";
}

const adminName = localStorage.getItem("userName") || (role === "PLACEMENT_HEAD" ? "Dr. Rajesh Verma (TPO)" : "Administrator");
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
    else if (tabId === 'approvalsTab') loadApprovalQueue();
    else if (tabId === 'coordinatorsTab') loadCoordinatorsList();
    else if (tabId === 'drivesTab') { loadVisitingDrives(); loadCoordinatorsDropdown(); }
    else if (tabId === 'applicationsTab') loadApplicationsTable();
    else if (tabId === 'reportsTab') loadReportsData();
    else if (tabId === 'announcementsTab') loadAdminAnnouncements();
    else if (tabId === 'auditTab') loadAdminAuditLogs();
    else if (tabId === 'adminCalendarTab') loadAdminCalendar();
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
let allCoordinatorsList = [];

async function checkPendingApprovalsBadge() {
    try {
        const res = await fetch(`${API_BASE}/jobs?all=true`, { headers: getAuthHeaders() });
        const data = await res.json();
        const badge = document.getElementById("pendingApprovalBadge");
        if (data.success && data.jobs && badge) {
            const pending = data.jobs.filter(j => j.approval_status === 'Pending Approval').length;
            if (pending > 0) {
                badge.innerText = pending;
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
        }
    } catch (e) {
        console.error("Error checking approval badge:", e);
    }
}

async function loadCoordinatorsDropdown() {
    try {
        const res = await fetch(`${API_BASE}/coordinators`, { headers: getAuthHeaders() });
        const data = await res.json();
        if (data.success && data.coordinators) {
            allCoordinatorsList = data.coordinators;
            const select = document.getElementById("driveCoordinator");
            const modalSelect = document.getElementById("modalAssignCoordSelect");

            const opts = `<option value="">-- Direct TPO Oversight / None --</option>` +
                data.coordinators.map(c => `<option value="${c.id}" data-name="${escapeHtml(c.name)}">${escapeHtml(c.name)} (${escapeHtml(c.department || 'Coordinator')})</option>`).join('');

            if (select) select.innerHTML = opts;
            if (modalSelect) modalSelect.innerHTML = `<option value="">Select Coordinator...</option>` +
                data.coordinators.map(c => `<option value="${c.id}" data-name="${escapeHtml(c.name)}">${escapeHtml(c.name)} (${escapeHtml(c.department || 'Coordinator')})</option>`).join('');
        }
    } catch (e) {
        console.error("Error loading coordinators dropdown:", e);
    }
}

async function loadVisitingDrives() {
    const tbody = document.getElementById("visitingDrivesTable");
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;">Loading scheduled drives...</td></tr>`;

    try {
        const res = await fetch(`${API_BASE}/jobs?all=true`, { headers: getAuthHeaders() });
        const data = await res.json();
        const list = (data.success && data.jobs) ? data.jobs : [];

        allVisitingDrives = list;

        if (list.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:var(--text-muted); padding:30px;">No campus recruitment drives scheduled yet. Use the form above to announce a visiting company.</td></tr>`;
            return;
        }

        tbody.innerHTML = list.map(job => {
            const visitDisplay = job.visitDate ? `<strong>${escapeHtml(job.visitDate)}</strong>` : '<span style="color:var(--text-muted);">TBD</span>';
            const applicantCount = job.applicantCount || 0;
            const compName = job.company || job.company_name;
            const coordDisplay = job.coordinator_name ? `<span class="badge badge-purple" style="font-size:11px;">🤝 ${escapeHtml(job.coordinator_name)}</span>` : '<span style="color:var(--text-muted); font-size:11px;">TPO Direct</span>';
            const statusDisplay = job.is_archived ? `<span class="badge badge-danger">Archived</span>` :
                job.approval_status === 'Approved' ? `<span class="badge badge-success">✓ Published</span>` :
                job.approval_status === 'Pending Approval' ? `<span class="badge badge-warning">⏳ Pending</span>` :
                `<span class="badge badge-secondary">${escapeHtml(job.approval_status || 'Draft')}</span>`;

            return `
                <tr>
                    <td>
                        <strong>${escapeHtml(compName)}</strong><br>
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
                        <strong style="color:var(--success);">${escapeHtml(job.salary || job.package)}</strong>
                    </td>
                    <td>
                        ${coordDisplay}
                    </td>
                    <td>
                        ${statusDisplay}
                    </td>
                    <td>
                        <span class="badge badge-primary" style="font-size:13px; font-weight:700;">
                            👥 ${applicantCount} Applied
                        </span>
                    </td>
                    <td>
                        <div style="display:flex; flex-direction:column; gap:4px;">
                            <div style="display:flex; gap:4px;">
                                <button onclick="openCompanyDetailsModal(${job.id})" class="btn btn-sm btn-outline" style="font-size:11px; padding:3px 6px;">
                                    🏢 Details
                                </button>
                                <button onclick="viewCompanyApplicants('${escapeHtml(compName)}')" class="btn btn-sm btn-outline" style="font-size:11px; padding:3px 6px;">
                                    👥 Applicants
                                </button>
                            </div>
                            <div style="display:flex; gap:4px;">
                                <button onclick="openAssignCoordModal(${job.id}, '${escapeHtml(compName)}')" class="btn btn-sm btn-secondary" style="font-size:10px; padding:3px 6px;">
                                    🤝 Assign Coord
                                </button>
                                <button onclick="archiveDrive(${job.id}, ${job.is_archived ? 0 : 1})" class="btn btn-sm btn-secondary" style="font-size:10px; padding:3px 6px; color:${job.is_archived ? 'var(--success)' : 'var(--warning)'};">
                                    ${job.is_archived ? 'Restore' : 'Archive'}
                                </button>
                                <button onclick="deleteDrive(${job.id}, '${escapeHtml(compName)}')" class="btn btn-sm btn-secondary" style="color:var(--danger); font-size:10px; padding:3px 6px;">
                                    🗑️
                                </button>
                            </div>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        console.error("Error loading visiting drives:", err);
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:var(--danger); padding:20px;">
            Error loading visiting drives from server.<br>
            <button onclick="loadVisitingDrives()" class="btn btn-sm btn-secondary" style="margin-top:8px;">🔄 Retry</button>
        </td></tr>`;
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
    const baseSalary = document.getElementById("driveBaseSalary") ? document.getElementById("driveBaseSalary").value.trim() : "";
    const minimumCgpa = parseFloat(document.getElementById("driveCgpa").value) || 0;
    const maxBacklogs = parseInt(document.getElementById("driveBacklogs").value, 10) || 0;
    const workMode = document.getElementById("driveWorkMode").value;
    const location = document.getElementById("driveLocation").value.trim();
    const eligibleBranches = document.getElementById("driveBranches").value.trim();
    const skills = document.getElementById("driveSkills").value.trim();
    const description = document.getElementById("driveDescription").value.trim();

    const coordSelect = document.getElementById("driveCoordinator");
    const coordinator_id = (coordSelect && coordSelect.value) ? parseInt(coordSelect.value, 10) : null;
    let coordinator_name = null;
    if (coordSelect && coordSelect.selectedIndex >= 0) {
        const opt = coordSelect.options[coordSelect.selectedIndex];
        coordinator_name = opt.getAttribute("data-name") || null;
    }

    const industry = document.getElementById("driveIndustry") ? document.getElementById("driveIndustry").value.trim() : "Information Technology";
    const available_positions = document.getElementById("drivePositions") ? parseInt(document.getElementById("drivePositions").value, 10) : 25;
    const graduation_year = document.getElementById("driveGradYear") ? parseInt(document.getElementById("driveGradYear").value, 10) : 2026;

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
            description,
            approvalStatus: 'Approved',
            coordinator_id,
            coordinator_name,
            industry,
            available_positions,
            graduation_year
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
            loadVisitingDrives();
            loadAnalyticsDashboard();
            checkPendingApprovalsBadge();
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

// Modal for Coordinator Assignment
function openAssignCoordModal(jobId, compName) {
    document.getElementById("modalAssignDriveId").value = jobId;
    document.getElementById("modalAssignDriveTitle").innerText = compName;
    const modal = document.getElementById("assignCoordModal");
    if (modal) {
        modal.style.display = 'flex';
        loadCoordinatorsDropdown();
    }
}

function closeAssignCoordModal() {
    const modal = document.getElementById("assignCoordModal");
    if (modal) modal.style.display = 'none';
}

async function submitCoordinatorAssignment() {
    const jobId = document.getElementById("modalAssignDriveId").value;
    const select = document.getElementById("modalAssignCoordSelect");
    const coordId = select.value ? parseInt(select.value, 10) : null;
    let coordName = null;
    if (select.selectedIndex >= 0) {
        const opt = select.options[select.selectedIndex];
        coordName = opt.getAttribute("data-name") || null;
    }

    try {
        const res = await fetch(`${API_BASE}/jobs/${jobId}/assign-coordinator`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ coordinator_id: coordId, coordinator_name: coordName })
        });
        const data = await res.json();
        if (data.success) {
            showToast("Coordinator assigned successfully!", "success");
            closeAssignCoordModal();
            loadVisitingDrives();
        } else {
            showToast(data.message || "Failed to assign coordinator", "error");
        }
    } catch (e) {
        showToast("Server error during coordinator assignment", "error");
    }
}

async function archiveDrive(jobId, willArchive) {
    try {
        const res = await fetch(`${API_BASE}/jobs/${jobId}/archive`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ is_archived: willArchive })
        });
        const data = await res.json();
        if (data.success) {
            showToast(data.message, "success");
            loadVisitingDrives();
        } else {
            showToast(data.message || "Failed to update drive archive status", "error");
        }
    } catch (e) {
        showToast("Server connection error", "error");
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
            checkPendingApprovalsBadge();
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

// ============================================================
// TAB: APPROVAL WORKFLOW QUEUE
// ============================================================

async function loadApprovalQueue() {
    const tbody = document.getElementById("approvalsTable");
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Checking approval queue...</td></tr>`;

    try {
        const res = await fetch(`${API_BASE}/jobs?all=true`, { headers: getAuthHeaders() });
        const data = await res.json();

        if (data.success && data.jobs) {
            const pendingJobs = data.jobs.filter(j => j.approval_status === 'Pending Approval' || j.approval_status === 'Changes Requested');

            if (pendingJobs.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:32px; color:var(--text-muted);">
                    🎉 Great news! The approval queue is clear. No pending drive proposals awaiting review.
                </td></tr>`;
                checkPendingApprovalsBadge();
                return;
            }

            tbody.innerHTML = pendingJobs.map(j => `
                <tr>
                    <td>
                        <strong>${escapeHtml(j.company)}</strong><br>
                        <small style="color:var(--text-secondary);">${escapeHtml(j.title)}</small>
                    </td>
                    <td>
                        ${j.coordinator_name ? `<strong>${escapeHtml(j.coordinator_name)}</strong>` : '<span style="color:var(--text-muted);">Recruiter / Direct</span>'}
                    </td>
                    <td>
                        <strong style="color:var(--success);">${escapeHtml(j.salary || j.package)}</strong>
                    </td>
                    <td>
                        <span>${escapeHtml(j.visitDate || 'TBD')}</span>
                    </td>
                    <td>
                        <div style="font-size:12px;">
                            <span>Min CGPA: <strong>${j.cgpa}</strong></span> | 
                            <span>Backlogs: <strong>≤ ${j.maxBacklogs || 0}</strong></span><br>
                            <small style="color:var(--text-muted);">${escapeHtml(j.skills ? j.skills.substring(0, 45) + '...' : '')}</small>
                        </div>
                    </td>
                    <td>
                        <span class="badge ${j.approval_status === 'Pending Approval' ? 'badge-warning' : 'badge-danger'}">
                            ${escapeHtml(j.approval_status)}
                        </span>
                        ${j.approval_notes ? `<br><small style="color:var(--danger); font-size:11px;">Notes: ${escapeHtml(j.approval_notes)}</small>` : ''}
                    </td>
                    <td>
                        <div style="display:flex; gap:6px;">
                            <button onclick="approveDrive(${j.id})" class="btn btn-sm btn-primary" style="font-size:11px; padding:4px 8px;">
                                ✓ Approve
                            </button>
                            <button onclick="rejectDrive(${j.id})" class="btn btn-sm btn-secondary" style="font-size:11px; padding:4px 8px; color:var(--danger);">
                                ✕ Revise
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');

            checkPendingApprovalsBadge();
        }
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--danger);">Error loading approval queue.</td></tr>`;
    }
}

async function approveDrive(jobId) {
    try {
        const res = await fetch(`${API_BASE}/jobs/${jobId}/approve`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        const data = await res.json();
        if (data.success) {
            showToast("✓ Recruitment Drive approved and published to students!", "success");
            loadApprovalQueue();
            checkPendingApprovalsBadge();
        } else {
            showToast(data.message || "Failed to approve drive", "error");
        }
    } catch (e) {
        showToast("Server error during drive approval", "error");
    }
}

async function rejectDrive(jobId) {
    const notes = prompt("Enter revision instructions or rejection notes for the coordinator/submitter:");
    if (notes === null) return;

    try {
        const res = await fetch(`${API_BASE}/jobs/${jobId}/reject`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ notes })
        });
        const data = await res.json();
        if (data.success) {
            showToast("Revision requested and submitter notified.", "info");
            loadApprovalQueue();
            checkPendingApprovalsBadge();
        } else {
            showToast(data.message || "Failed to reject drive", "error");
        }
    } catch (e) {
        showToast("Server error during rejection", "error");
    }
}

// ============================================================
// TAB: COORDINATOR MANAGEMENT
// ============================================================

function toggleAddCoordinatorForm(show) {
    const card = document.getElementById("addCoordinatorCard");
    if (card) card.style.display = show ? 'block' : 'none';
}

async function loadCoordinatorsList() {
    const tbody = document.getElementById("coordinatorsTable");
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Loading coordinators...</td></tr>`;

    try {
        const res = await fetch(`${API_BASE}/coordinators`, { headers: getAuthHeaders() });
        const data = await res.json();

        if (data.success && data.coordinators) {
            allCoordinatorsList = data.coordinators;

            if (data.coordinators.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:24px;">No coordinators registered yet. Click "+ Add Coordinator" to register departmental faculty coordinators.</td></tr>`;
                return;
            }

            tbody.innerHTML = data.coordinators.map(c => `
                <tr>
                    <td>
                        <strong>${escapeHtml(c.name)}</strong>
                    </td>
                    <td>
                        <code>${escapeHtml(c.email)}</code>
                    </td>
                    <td>
                        <span class="badge badge-primary">${escapeHtml(c.department || 'All Departments')}</span>
                    </td>
                    <td>
                        ${escapeHtml(c.phone || 'N/A')}
                    </td>
                    <td>
                        <strong>${c.assigned_drives_count || 0} Drives</strong>
                    </td>
                    <td>
                        <span class="badge ${c.status === 'INACTIVE' ? 'badge-danger' : 'badge-success'}">
                            ${c.status === 'INACTIVE' ? 'Inactive' : 'Active'}
                        </span>
                    </td>
                    <td>
                        <button onclick="deleteCoordinator(${c.id}, '${escapeHtml(c.name)}')" class="btn btn-sm btn-secondary" style="color:var(--danger); font-size:11px; padding:3px 8px;">
                            🗑️ Remove
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--danger);">Error loading coordinators.</td></tr>`;
    }
}

async function handleCreateCoordinator(e) {
    e.preventDefault();
    const name = document.getElementById("coordName").value.trim();
    const email = document.getElementById("coordEmail").value.trim();
    const password = document.getElementById("coordPass").value;
    const department = document.getElementById("coordDept").value;
    const phone = document.getElementById("coordPhone").value.trim();

    try {
        const res = await fetch(`${API_BASE}/coordinators`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ name, email, password, department, phone })
        });
        const data = await res.json();
        if (data.success) {
            showToast(`✓ Placement Coordinator ${name} created successfully!`, "success");
            document.getElementById("createCoordinatorForm").reset();
            toggleAddCoordinatorForm(false);
            loadCoordinatorsList();
            loadCoordinatorsDropdown();
        } else {
            showToast(data.message || "Failed to create coordinator", "error");
        }
    } catch (e) {
        showToast("Server error during coordinator registration", "error");
    }
}

async function deleteCoordinator(id, name) {
    if (!confirm(`Are you sure you want to remove Coordinator "${name}"?`)) return;

    try {
        const res = await fetch(`${API_BASE}/coordinators/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        const data = await res.json();
        if (data.success) {
            showToast(`Coordinator ${name} removed.`, "success");
            loadCoordinatorsList();
            loadCoordinatorsDropdown();
        } else {
            showToast(data.message || "Failed to remove coordinator", "error");
        }
    } catch (e) {
        showToast("Server error deleting coordinator", "error");
    }
}

// ============================================================
// TAB: REPORTS & CSV DATA EXPORT
// ============================================================

async function loadReportsData() {
    const deptTbody = document.getElementById("reportDeptTable");
    const compTbody = document.getElementById("reportCompanyTable");

    try {
        const res = await fetch(`${API_BASE}/reports/summary`, { headers: getAuthHeaders() });
        const data = await res.json();

        if (data.success) {
            const { departmentBreakdown, companyBreakdown } = data;

            if (deptTbody && departmentBreakdown) {
                deptTbody.innerHTML = departmentBreakdown.map(d => `
                    <tr>
                        <td><strong>${escapeHtml(d.department)}</strong></td>
                        <td>${d.total_enrolled}</td>
                        <td><strong style="color:var(--success);">${d.placed_candidates}</strong></td>
                        <td>${d.offers_count}</td>
                        <td>${escapeHtml(d.average_ctc)}</td>
                    </tr>
                `).join('') || `<tr><td colspan="5" style="text-align:center;">No departmental records.</td></tr>`;
            }

            if (compTbody && companyBreakdown) {
                compTbody.innerHTML = companyBreakdown.map(c => `
                    <tr>
                        <td><strong>${escapeHtml(c.company_name)}</strong></td>
                        <td>${c.total_applicants}</td>
                        <td><strong style="color:var(--success);">${c.offers_extended}</strong></td>
                        <td>${escapeHtml(c.highest_package)}</td>
                    </tr>
                `).join('') || `<tr><td colspan="4" style="text-align:center;">No recruiter records.</td></tr>`;
            }
        }
    } catch (e) {
        console.error("Error loading report metrics:", e);
    }
}

async function triggerCsvExport(type) {
    showToast(`Generating ${type} CSV export...`, "info");
    try {
        const res = await fetch(`${API_BASE}/reports/export/${type}`, {
            headers: getAuthHeaders()
        });
        if (!res.ok) {
            showToast("Failed to generate CSV export", "error");
            return;
        }

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `placement_${type}_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showToast(`✓ ${type.toUpperCase()} CSV exported successfully!`, "success");
    } catch (e) {
        showToast("Error downloading CSV report", "error");
    }
}

// ============================================================
// TAB: CAMPUS ANNOUNCEMENTS
// ============================================================

async function loadAdminAnnouncements() {
    const tbody = document.getElementById("announcementsTable");
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Loading announcements...</td></tr>`;

    try {
        const res = await fetch(`${API_BASE}/announcements`, { headers: getAuthHeaders() });
        const data = await res.json();

        if (data.success && data.announcements) {
            if (data.announcements.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:24px;">No announcements published yet. Use the form above to broadcast notices.</td></tr>`;
                return;
            }

            tbody.innerHTML = data.announcements.map(a => {
                const d = new Date(a.created_at);
                const dateStr = !isNaN(d.getTime()) ? d.toLocaleDateString() : a.created_at;

                return `
                    <tr>
                        <td><small style="color:var(--text-muted);">${dateStr}</small></td>
                        <td><span class="badge badge-purple">${escapeHtml(a.target_role)}</span></td>
                        <td><span class="badge badge-primary">${escapeHtml(a.category)}</span></td>
                        <td>
                            <strong>${escapeHtml(a.title)}</strong>
                            <p style="font-size:12px; color:var(--text-secondary); margin:4px 0 0 0;">${escapeHtml(a.message)}</p>
                        </td>
                        <td>
                            <span class="badge ${a.priority === 'CRITICAL' ? 'badge-danger' : a.priority === 'HIGH' ? 'badge-warning' : 'badge-secondary'}">
                                ${escapeHtml(a.priority)}
                            </span>
                        </td>
                        <td>
                            <button onclick="deleteAnnouncement(${a.id})" class="btn btn-sm btn-secondary" style="color:var(--danger); font-size:11px; padding:3px 8px;">
                                🗑️ Remove
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        }
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--danger);">Error loading announcements.</td></tr>`;
    }
}

async function handleCreateAnnouncement(e) {
    e.preventDefault();
    const title = document.getElementById("annTitle").value.trim();
    const target_role = document.getElementById("annTarget").value;
    const category = document.getElementById("annCategory").value;
    const priority = document.getElementById("annPriority").value;
    const message = document.getElementById("annMessage").value.trim();

    try {
        const res = await fetch(`${API_BASE}/announcements`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ title, target_role, category, priority, message })
        });
        const data = await res.json();
        if (data.success) {
            showToast("🚀 Announcement broadcast successfully to campus!", "success");
            document.getElementById("createAnnouncementForm").reset();
            loadAdminAnnouncements();
        } else {
            showToast(data.message || "Failed to post announcement", "error");
        }
    } catch (e) {
        showToast("Server error broadcasting announcement", "error");
    }
}

async function deleteAnnouncement(id) {
    if (!confirm("Are you sure you want to remove this announcement?")) return;

    try {
        const res = await fetch(`${API_BASE}/announcements/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        const data = await res.json();
        if (data.success) {
            showToast("Announcement removed.", "success");
            loadAdminAnnouncements();
        } else {
            showToast(data.message || "Failed to remove announcement", "error");
        }
    } catch (e) {
        showToast("Server error removing announcement", "error");
    }
}

// ============================================================
// TAB: SYSTEM AUDIT TRAIL
// ============================================================

async function loadAdminAuditLogs() {
    const tbody = document.getElementById("auditLogsTable");
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Loading audit logs...</td></tr>`;

    try {
        const res = await fetch(`${API_BASE}/audit-logs`, { headers: getAuthHeaders() });
        const data = await res.json();

        if (data.success && data.logs) {
            if (data.logs.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:24px;">No audit logs recorded yet.</td></tr>`;
                return;
            }

            tbody.innerHTML = data.logs.map(log => {
                const d = new Date(log.created_at);
                const timeStr = !isNaN(d.getTime()) ? d.toLocaleString() : log.created_at;

                return `
                    <tr>
                        <td><small style="color:var(--text-muted);">${timeStr}</small></td>
                        <td><strong>${escapeHtml(log.user_name || 'System')}</strong></td>
                        <td><span class="badge badge-purple">${escapeHtml(log.role || 'ADMIN')}</span></td>
                        <td><span class="badge badge-primary">${escapeHtml(log.action)}</span></td>
                        <td><code>${escapeHtml(log.entity_type || '-')} #${log.entity_id || ''}</code></td>
                        <td style="max-width:320px; font-size:12.5px;">${escapeHtml(log.details || '')}</td>
                    </tr>
                `;
            }).join('');
        }
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--danger);">Error loading audit trail.</td></tr>`;
    }
}

// Initial load
loadAnalyticsDashboard();
checkPendingApprovalsBadge();
loadCoordinatorsDropdown();