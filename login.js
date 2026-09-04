
const loginForm = document.getElementById("loginForm");
const userIdInput = document.getElementById("userId");
const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");
const loginMessage = document.getElementById("loginMessage");
const registerButton = document.getElementById("registerButton");

togglePassword.addEventListener("click", function () {
    const isPassword = passwordInput.type === "password";
    passwordInput.type = isPassword ? "text" : "password";
    togglePassword.textContent = isPassword ? "Hide" : "Show";
});

loginForm.addEventListener("submit", function (event) {
    event.preventDefault();

    loginMessage.style.color = "var(--bad)";
    loginMessage.textContent = "";

    const userId = userIdInput.value.trim();
    const password = passwordInput.value;

    if (!userId) {
        loginMessage.textContent = "Please enter your User ID.";
        userIdInput.focus();
        return;
    }

    if (!password) {
        loginMessage.textContent = "Please enter your password.";
        passwordInput.focus();
        return;
    }

    if (typeof getAccount !== "function" || typeof passwordHash !== "function") {
        loginMessage.textContent = "Login system could not be loaded. Please keep auth.js in the same folder.";
        return;
    }

    const account = getAccount();

    if (!account) {
        loginMessage.textContent = "No account found. Please register first.";
        return;
    }

    // passwordHash() throws for non-ASCII characters (the demo sha256 only
    // supports ASCII). Guard against that so a stray emoji/accented
    // character shows a message instead of silently breaking sign-in.
    let hashedPassword;
    try {
        hashedPassword = passwordHash(password);
    } catch (error) {
        loginMessage.textContent = "Your password contains a character that isn't supported. Please use standard English letters, numbers and symbols.";
        passwordInput.focus();
        return;
    }

    if (account.userId.toLowerCase() !== userId.toLowerCase() ||
        account.passwordHash !== hashedPassword) {
        loginMessage.textContent = "Incorrect User ID or password.";
        passwordInput.focus();
        return;
    }

    setSession(account.userId);
    loginMessage.style.color = "var(--accent)";
    loginMessage.textContent = "Sign in successful. Opening your dashboard…";

    setTimeout(function () {
        window.location.href = "dashboard.html";
    }, 400);
});

registerButton.addEventListener("click", function () {
    window.location.href = "register.html";
});
