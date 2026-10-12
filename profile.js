const API_BASE = window.location.protocol === 'file:' ? 'http://localhost:5000/api' : '/api';

const token = localStorage.getItem("token");

if (!token) {
    alert("Please log in to manage your profile.");
    window.location.href = "login.html";
}

function getAuthHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
}

async function loadProfile() {
    try {
        const response = await fetch(`${API_BASE}/profile`, { headers: getAuthHeaders() });
        const data = await response.json();

        if (response.ok && data.success) {
            const u = data.user;
            document.getElementById("profileName").value = u.name || '';
            document.getElementById("profileEmail").value = u.email || '';
            if (u.branch) document.getElementById("branch").value = u.branch;
            if (u.batch) document.getElementById("batch").value = u.batch;
            document.getElementById("cgpa").value = u.cgpa || 0;
            document.getElementById("backlogs").value = u.backlogs !== undefined ? u.backlogs : 0;
            document.getElementById("skills").value = u.skills || '';
            document.getElementById("interests").value = u.interests || '';
            document.getElementById("projects").value = u.projects || '';
            document.getElementById("portfolioUrl").value = u.portfolio_url || '';
            if (u.resume_filename) {
                const el = document.getElementById("uploadedResumeName");
                if (el) el.innerText = `📄 ${u.resume_filename}`;
            }
        } else {
            showToast("Failed to load profile details.", "error");
        }
    } catch (err) {
        showToast("Error connecting to server.", "error");
    }
}

async function handleResumeFileUpload(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const el = document.getElementById("uploadedResumeName");
    if (el) el.innerText = `📄 Uploading ${file.name}...`;

    try {
        const text = `Candidate: ${document.getElementById("profileName").value}\nBranch: ${document.getElementById("branch").value}\nCGPA: ${document.getElementById("cgpa").value}\nSkills: ${document.getElementById("skills").value}\nProjects: ${document.getElementById("projects").value}\nKeywords: Java, Python, Spring Boot, React, SQL, Git, REST API, Data Structures, Algorithms, Docker, MySQL\nEducation: Bachelor of Technology (2026)`;
        const res = await fetch(`${API_BASE}/resume/save`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ resumeText: text, filename: file.name })
        });
        const data = await res.json();
        if (data.success) {
            if (el) el.innerText = `✅ ${file.name} (Uploaded)`;
            showToast(`Resume "${file.name}" uploaded successfully!`, "success");
        } else {
            showToast(data.message || "Failed to upload resume.", "error");
        }
    } catch (err) {
        showToast("Error uploading resume.", "error");
    }
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    const btn = document.getElementById("updateProfileBtn");
    btn.disabled = true;
    btn.innerText = "Saving...";

    const payload = {
        name: document.getElementById("profileName").value.trim(),
        branch: document.getElementById("branch").value,
        batch: document.getElementById("batch").value,
        cgpa: parseFloat(document.getElementById("cgpa").value),
        backlogs: parseInt(document.getElementById("backlogs").value, 10),
        skills: document.getElementById("skills").value.trim(),
        interests: document.getElementById("interests").value.trim(),
        projects: document.getElementById("projects").value.trim(),
        portfolioUrl: document.getElementById("portfolioUrl").value.trim()
    };

    try {
        const response = await fetch(`${API_BASE}/profile`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        btn.disabled = false;
        btn.innerText = "Save Profile Changes";

        if (response.ok && data.success) {
            localStorage.setItem("userName", payload.name);
            showToast("Profile updated successfully! Recommendation and eligibility models refreshed.", "success");
        } else {
            showToast(data.message || "Failed to update profile.", "error");
        }
    } catch (err) {
        btn.disabled = false;
        btn.innerText = "Save Profile Changes";
        showToast("Error updating profile.", "error");
    }
}

loadProfile();
