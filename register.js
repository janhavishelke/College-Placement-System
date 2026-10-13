const API_BASE = window.PLACEMENT_API_BASE || ((window.location.protocol === 'file:' || (window.location.port && window.location.port !== '5000')) ? 'http://localhost:5000/api' : '/api');

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
                <div>Browsers block local network registrations from disk files. Open via localhost server:</div>
                <div style="margin-top:8px;">
                    <a href="http://localhost:5000/register.html" class="btn btn-sm btn-primary" style="display:inline-block; font-size:12px;">🌐 Open http://localhost:5000/register.html</a>
                </div>
            `;
            const card = document.querySelector('.readiness-card');
            if (card) card.insertBefore(banner, card.firstChild);
        }
    }
});

document
    .getElementById("registerForm")
    .addEventListener("submit", async function (event) {
        event.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;
        const role = document.getElementById("role").value;
        const submitBtn = event.target.querySelector('button[type="submit"]');

        if (password !== confirmPassword) {
            showMessage("Passwords do not match.", "error");
            return;
        }

        if (password.length < 8) {
            showMessage("Password must contain at least 8 characters.", "error");
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerText = "Creating Account...";
        showMessage("Creating your account...", "info");

        const isFile = typeof window !== 'undefined' && window.location && window.location.protocol === 'file:';
        const port = typeof window !== 'undefined' && window.location ? window.location.port : '';
        const base = window.PLACEMENT_API_BASE || ((isFile || (port && port !== '5000')) ? 'http://localhost:5000/api' : '/api');
        
        const candidates = [];
        if (!isFile) candidates.push('/api/auth/register');
        candidates.push(`${base}/auth/register`);
        candidates.push('http://localhost:5000/api/auth/register');
        candidates.push('http://127.0.0.1:5000/api/auth/register');

        let lastError = null;
        let successfulReg = false;

        for (const url of [...new Set(candidates)]) {
            try {
                const response = await fetch(url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ name, email, password, role })
                });

                const contentType = response.headers.get("content-type") || "";
                if (!contentType.includes("application/json")) continue;

                const data = await response.json();

                if (!response.ok || !data.success) {
                    showMessage(data.message || "Registration failed.", "error");
                    submitBtn.disabled = false;
                    submitBtn.innerText = "Create Account";
                    return;
                }

                // Store registered details for automatic prefill on login
                try {
                    localStorage.setItem('registeredEmail', email);
                    localStorage.setItem('registeredRole', role);
                } catch (_) {}

                showMessage("Registration successful! Redirecting to login...", "success");
                successfulReg = true;

                setTimeout(function () {
                    window.location.href = "login.html";
                }, 1000);
                break;
            } catch (err) {
                lastError = err;
            }
        }

        if (!successfulReg) {
            console.error("Register error:", lastError);
            if (isFile) {
                showMessage("Browsers block requests from file://. Please open http://localhost:5000/register.html in your browser URL bar.", "error");
            } else {
                showMessage("Could not connect to server. Ensure backend is running at http://localhost:5000.", "error");
            }
            submitBtn.disabled = false;
            submitBtn.innerText = "Create Account";
        }
    });

function showMessage(message, type = "info") {
    const el = document.getElementById("registerMessage");
    if (!el) return;
    el.innerText = message;
    if (type === "error") {
        el.style.color = "#dc2626";
    } else if (type === "success") {
        el.style.color = "#16a34a";
    } else {
        el.style.color = "#2563eb";
    }
}