const API_BASE = window.PLACEMENT_API_BASE || ((window.location.protocol === 'file:' || (window.location.port && window.location.port !== '5000')) ? 'http://localhost:5000/api' : '/api');

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

        try {
            const response = await fetch(`${API_BASE}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password, role })
            });

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

        } catch (err) {
            console.error("Login fetch error:", err);
            showMessage("Cannot connect to server. Ensure the backend is running.", "error");
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