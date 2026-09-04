// Registration page uses the shared auth.js API. Do not redeclare its globals here.

const registerForm = document.getElementById("registerForm");
const fullName = document.getElementById("fullName");
const email = document.getElementById("email");
const newUserId = document.getElementById("newUserId");
const newPassword = document.getElementById("newPassword");
const confirmPassword = document.getElementById("confirmPassword");

const maleButton = document.getElementById("maleButton");
const femaleButton = document.getElementById("femaleButton");
const residentButton = document.getElementById("residentButton");
const studentButton = document.getElementById("studentButton");

const registerMessage = document.getElementById("registerMessage");
const signInButton = document.getElementById("signInButton");

const strengthBar = document.getElementById("strengthBar");
const strengthText = document.getElementById("strengthText");

const ruleLength = document.getElementById("ruleLength");
const ruleUpper = document.getElementById("ruleUpper");
const ruleLower = document.getElementById("ruleLower");
const ruleNumber = document.getElementById("ruleNumber");
const ruleSpecial = document.getElementById("ruleSpecial");

const countryCodeEl = document.getElementById("countryCode");
const mobileEl = document.getElementById("mobile");
const mobileHintEl = document.getElementById("mobileHint");
const mobileErrorEl = document.getElementById("mobileError");

let selectedGender = "";
let selectedStatus = "";

// Choice buttons (implemented like radio buttons)
function selectGender(value) {
    selectedGender = value;
    maleButton.classList.toggle("selected", value === "male");
    femaleButton.classList.toggle("selected", value === "female");
    maleButton.setAttribute("aria-pressed", value === "male" ? "true" : "false");
    femaleButton.setAttribute("aria-pressed", value === "female" ? "true" : "false");
}

function selectStatus(value) {
    selectedStatus = value;
    residentButton.classList.toggle("selected", value === "resident");
    studentButton.classList.toggle("selected", value === "student");
    residentButton.setAttribute("aria-pressed", value === "resident" ? "true" : "false");
    studentButton.setAttribute("aria-pressed", value === "student" ? "true" : "false");
}

maleButton.addEventListener("click", () => selectGender("male"));
femaleButton.addEventListener("click", () => selectGender("female"));
residentButton.addEventListener("click", () => selectStatus("resident"));
studentButton.addEventListener("click", () => selectStatus("student"));

// Keyboard support
[maleButton, femaleButton, residentButton, studentButton].forEach(button => {
    button.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            button.click();
        }
    });
});

// Show / hide passwords
document.querySelectorAll(".togglePassword").forEach(function (button) {
    button.addEventListener("click", function () {
        const input = document.getElementById(button.dataset.target);
        const isPassword = input.type === "password";
        input.type = isPassword ? "text" : "password";
        button.textContent = isPassword ? "Hide" : "Show";
    });
});

// Password strength
function checkPasswordStrength(password) {
    const checks = {
        length: password.length >= 12,
        upper: /[A-Z]/.test(password),
        lower: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[^A-Za-z0-9]/.test(password)
    };

    ruleLength.classList.toggle("valid", checks.length);
    ruleUpper.classList.toggle("valid", checks.upper);
    ruleLower.classList.toggle("valid", checks.lower);
    ruleNumber.classList.toggle("valid", checks.number);
    ruleSpecial.classList.toggle("valid", checks.special);

    const score = Object.values(checks).filter(Boolean).length;
    const percentages = [0, 20, 40, 60, 80, 100];
    strengthBar.style.width = percentages[score] + "%";

    if (score <= 2) {
        strengthBar.style.background = "var(--bad)";
        strengthText.textContent = "Weak password";
    } else if (score <= 4) {
        strengthBar.style.background = "var(--flag)";
        strengthText.textContent = "Moderate password";
    } else {
        strengthBar.style.background = "var(--good)";
        strengthText.textContent = "Strong password";
    }

    return checks;
}

newPassword.addEventListener("input", function () {
    checkPasswordStrength(newPassword.value);
});

// Country-aware mobile validation
const mobileRules = {
    "+91":  { min: 10, max: 10, pattern: /^[6-9]\d{9}$/, hint: "India: 10 digits, starting with 6–9." },
    "+1":   { min: 10, max: 10, pattern: /^\d{10}$/, hint: "US/Canada: 10 digits." },
    "+44":  { min: 9, max: 10, pattern: /^\d{9,10}$/, hint: "UK: enter the mobile number without the country code." },
    "+61":  { min: 9, max: 9, pattern: /^\d{9}$/, hint: "Australia: 9 digits after +61." },
    "+971": { min: 8, max: 9, pattern: /^\d{8,9}$/, hint: "UAE: enter the mobile number without +971." },
    "+65":  { min: 8, max: 8, pattern: /^\d{8}$/, hint: "Singapore: 8 digits." },
    "+49":  { min: 7, max: 12, pattern: /^\d{7,12}$/, hint: "Germany: enter the mobile number without +49." },
    "+33":  { min: 9, max: 9, pattern: /^\d{9}$/, hint: "France: 9 digits after +33." },
    "+81":  { min: 9, max: 10, pattern: /^\d{9,10}$/, hint: "Japan: 9–10 digits after +81." },
    "+82":  { min: 9, max: 10, pattern: /^\d{9,10}$/, hint: "South Korea: 9–10 digits after +82." }
};

function updateMobileHint() {
    const rule = mobileRules[countryCodeEl.value];
    mobileHintEl.textContent = rule ? rule.hint : "Enter a valid mobile number for the selected country.";
    mobileErrorEl.textContent = "";
}

function validateMobile() {
    const digits = mobileEl.value.replace(/\D/g, "");
    const rule = mobileRules[countryCodeEl.value];

    let valid = digits.length > 0;
    if (rule) {
        valid = valid &&
            digits.length >= rule.min &&
            digits.length <= rule.max &&
            rule.pattern.test(digits);
    }

    if (!valid) {
        mobileErrorEl.textContent = rule
            ? `Please enter a valid mobile number (${rule.min}${rule.max !== rule.min ? "–" + rule.max : ""} digits).`
            : "Please enter a valid mobile number.";
    } else {
        mobileErrorEl.textContent = "";
    }

    return valid;
}

countryCodeEl.addEventListener("change", updateMobileHint);
mobileEl.addEventListener("input", validateMobile);
updateMobileHint();

// Warn up front if this device already has an account — registering a new
// one will replace it (this app stores one account per browser; see
// auth.js). This is informational only; the actual block/confirm happens
// on submit below.
if (typeof getAccount === "function") {
    const existingOnLoad = getAccount();
    if (existingOnLoad) {
        registerMessage.style.color = "var(--flag)";
        registerMessage.textContent = "This device already has an account (\"" + existingOnLoad.fullName + "\", User ID: " + existingOnLoad.userId + "). Creating a new account will replace it.";
    }
}

// Registration validation
registerForm.addEventListener("submit", function (event) {
    event.preventDefault();

    registerMessage.style.color = "var(--bad)";
    registerMessage.textContent = "";

    const name = fullName.value.trim();
    const emailValue = email.value.trim();
    const userId = newUserId.value.trim();
    const password = newPassword.value;
    const confirm = confirmPassword.value;
    const checks = checkPasswordStrength(password);

    if (!name) {
        registerMessage.textContent = "Please enter your full name.";
        fullName.focus();
        return;
    }

    if (!selectedGender) {
        registerMessage.textContent = "Please select Male or Female.";
        return;
    }

    if (!emailValue || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
        registerMessage.textContent = "Please enter a valid email address.";
        email.focus();
        return;
    }

    if (!validateMobile()) {
        mobileEl.focus();
        return;
    }

    if (!userId) {
        registerMessage.textContent = "Please create a User ID.";
        newUserId.focus();
        return;
    }

    if (!selectedStatus) {
        registerMessage.textContent = "Please select Resident or Student.";
        return;
    }

    if (!checks.length || !checks.upper || !checks.lower ||
        !checks.number || !checks.special) {
        registerMessage.textContent =
            "Please create a strong password meeting all five requirements.";
        newPassword.focus();
        return;
    }

    if (password !== confirm) {
        registerMessage.textContent = "Passwords do not match.";
        confirmPassword.focus();
        return;
    }

    if (typeof getAccount !== "function" || typeof passwordHash !== "function") {
        registerMessage.style.color = "var(--bad)";
        registerMessage.textContent = "Registration system could not be loaded. Please keep auth.js in the same folder.";
        return;
    }

    const existing = getAccount();
    if (existing && existing.userId.toLowerCase() === userId.toLowerCase()) {
        registerMessage.style.color = "var(--bad)";
        registerMessage.textContent = "That User ID is already registered.";
        newUserId.focus();
        return;
    }

    // This app stores one account per browser (see auth.js) — creating a
    // new account here would silently overwrite a different existing one.
    // Require explicit confirmation before doing that.
    if (existing) {
        const proceed = window.confirm(
            "This device already has an account for \"" + existing.fullName + "\" (User ID: " + existing.userId + ").\n\n" +
            "Creating a new account will permanently replace it — you won't be able to sign in as \"" + existing.fullName + "\" on this device afterwards.\n\n" +
            "Continue and replace it?"
        );
        if (!proceed) {
            registerMessage.style.color = "var(--bad)";
            registerMessage.textContent = "Registration cancelled. The existing account was not changed.";
            return;
        }
    }

    // passwordHash() throws for non-ASCII characters (the demo sha256 only
    // supports ASCII). Guard against that so a stray emoji/accented
    // character shows a message instead of silently breaking registration.
    let hashedPassword;
    try {
        hashedPassword = passwordHash(password);
    } catch (error) {
        registerMessage.style.color = "var(--bad)";
        registerMessage.textContent = "Your password contains a character that isn't supported. Please use standard English letters, numbers and symbols.";
        newPassword.focus();
        return;
    }

    const account = {
        userId: userId,
        fullName: name,
        gender: selectedGender,
        email: emailValue,
        countryCode: countryCodeEl.value,
        mobile: mobileEl.value.replace(/\D/g, ""),
        status: selectedStatus,
        passwordHash: hashedPassword,
        createdAt: new Date().toISOString()
    };

    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
    setSession(userId);

    registerMessage.style.color = "var(--accent)";
    registerMessage.textContent = "Registration successful! Your account has been created. Opening your dashboard…";

    // Keep the success message visible long enough for the user to see it.
    setTimeout(function () {
        window.location.href = "dashboard.html";
    }, 1800);
});

// Return to login page
signInButton.addEventListener("click", function () {
    window.location.href = "login.html";
});
