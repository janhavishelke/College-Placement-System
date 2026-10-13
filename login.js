function getLoginCandidates() {
    const isFile = typeof window !== 'undefined' && window.location && window.location.protocol === 'file:';
    const port = typeof window !== 'undefined' && window.location ? window.location.port : '';
    const base = window.PLACEMENT_API_BASE || ((isFile || (port && port !== '5000')) ? 'http://localhost:5000/api' : '/api');
    
    const candidates = [];
    if (!isFile) {
        candidates.push('/api/auth/login');
    }
    candidates.push(`${base}/auth/login`);
    candidates.push('http://localhost:5000/api/auth/login');
    candidates.push('http://127.0.0.1:5000/api/auth/login');
    return [...new Set(candidates)];
}

// Display file protocol warning banner if loaded directly from disk
document.addEventListener("DOMContentLoaded", () => {
    if (window.location.protocol === 'file:') {
        const main = document.querySelector('main');
        if (main && !document.getElementById('fileWarningBanner')) {
            const banner = document.createElement('div');
            banner.id = 'fileWarningBanner';
            banner.style.cssText = 'background:rgba(239, 68, 68, 0.1); border:1px solid rgba(239, 68, 68, 0.3); border-radius:12px; padding:12px 16px; margin-bottom:16px; font-size:13px; text-align:center; color:var(--text-primary);';
            banner.innerHTML = `
                <div style="font-weight:700; color:var(--danger); margin-bottom:4px;">⚠️ Opened via file:/// scheme</div>
                <div>Browsers block local network logins from disk files. Open via localhost server:</div>
                <div style="margin-top:8px;">
                    <a href="http://localhost:5000/login.html" class="btn btn-sm btn-primary" style="display:inline-block; font-size:12px;">🌐 Open http://localhost:5000/login.html</a>
                </div>
            `;
            const card = document.querySelector('.readiness-card');
            if (card) card.insertBefore(banner, card.firstChild);
    }

    // Prefill credentials if user was redirected from registration
    try {
        const prefillEmail = localStorage.getItem('registeredEmail');
        const prefillRole = localStorage.getItem('registeredRole');
        if (prefillEmail) {
            const emailEl = document.getElementById('email');
            if (emailEl) emailEl.value = prefillEmail;
            localStorage.removeItem('registeredEmail');
        }
        if (prefillRole) {
            const roleEl = document.getElementById('role');
            if (roleEl) roleEl.value = prefillRole;
            localStorage.removeItem('registeredRole');
        }
        if (prefillEmail) {
            showMessage("Account created! Please enter your password to sign in.", "info");
        }
    } catch (_) {}
});

document
    .getElementById("loginForm")
    .addEventListener("submit", async function (event) {
        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const role = document.getElementById("role").value;
        const submitBtn = event.target.querySelector('button[type="submit"]');

        if (email === "" || password === "" || role === "") {
            showMessage("Please fill all fields.", "error");
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerText = "Logging in...";
        showMessage("Verifying credentials...", "info");

        const candidates = getLoginCandidates();
        let lastError = null;
        let successfulLogin = false;

        for (const url of candidates) {
            try {
                const response = await fetch(url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ email, password, role })
                });

                const contentType = response.headers.get("content-type") || "";
                if (!contentType.includes("application/json")) {
                    continue;
                }

                const data = await response.json();

                if (!response.ok || !data.success) {
                    showMessage(data.message || "Login failed. Check your credentials.", "error");
                    submitBtn.disabled = false;
                    submitBtn.innerText = "Login";
                    return;
                }

                // Save auth details
                localStorage.setItem("token", data.token);
                localStorage.setItem("userEmail", data.user.email);
                localStorage.setItem("userName", data.user.name);
                localStorage.setItem("userRole", data.user.role);
                localStorage.setItem("userId", data.user.id);

                showMessage("Login successful! Redirecting...", "success");
                successfulLogin = true;

                setTimeout(() => {
                    if (data.user.role === "STUDENT") {
                        window.location.href = "student-dashboard.html";
                    } else if (data.user.role === "COMPANY") {
                        window.location.href = "company.html";
                    } else if (data.user.role === "COORDINATOR") {
                        window.location.href = "coordinator-dashboard.html";
                    } else if (data.user.role === "ADMIN" || data.user.role === "PLACEMENT_HEAD") {
                        window.location.href = "admin-dashboard.html";
                    } else {
                        window.location.href = "index.html";
                    }
                }, 800);
                break;

            } catch (err) {
                lastError = err;
            }
        }

        if (!successfulLogin) {
            console.error("Login fetch error:", lastError);
            const isFile = window.location.protocol === 'file:';
            if (isFile) {
                showMessage("Browsers block requests from file://. Please open http://localhost:5000/login.html in your browser URL bar.", "error");
            } else {
                showMessage("Cannot connect to server. Ensure the backend is running at http://localhost:5000.", "error");
            }
            submitBtn.disabled = false;
            submitBtn.innerText = "Login";
        }
    });

function showMessage(message, type = "info") {
    const el = document.getElementById("loginMessage");
    el.innerText = message;
    if (type === "error") {
        el.style.color = "#dc2626";
    } else if (type === "success") {
        el.style.color = "#16a34a";
    } else {
        el.style.color = "#2563eb";
    }
}