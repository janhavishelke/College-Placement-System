const API_BASE = window.PLACEMENT_API_BASE || ((window.location.protocol === 'file:' || (window.location.port && window.location.port !== '5000')) ? 'http://localhost:5000/api' : '/api');

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
        submitBtn.innerText = "Registering...";
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
                    submitBtn.innerText = "Register";
                    return;
                }

                showMessage("Registration successful! Redirecting to login...", "success");
                successfulReg = true;

                setTimeout(function () {
                    window.location.href = "login.html";
                }, 1200);
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
            submitBtn.innerText = "Register";
        }
    });

function showMessage(message, type = "info") {
    const el = document.getElementById("registerMessage");
    el.innerText = message;
    if (type === "error") {
        el.style.color = "#dc2626";
    } else if (type === "success") {
        el.style.color = "#16a34a";
    } else {
        el.style.color = "#2563eb";
    }
}