
const ACCOUNT_KEY = "neurologyMCQAccount";
const SESSION_KEY = "neurologyMCQSession";

function getAccount() {
    try { return JSON.parse(localStorage.getItem(ACCOUNT_KEY) || "null"); }
    catch { return null; }
}

function setSession(userId) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ userId, loggedIn: true }));
}

function getSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); }
    catch { return null; }
}

function logout() {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = "login.html";
}

function requireLogin() {
    const session = getSession();
    const account = getAccount();
    if (!session?.loggedIn || !account || session.userId !== account.userId) {
        window.location.href = "login.html";
        return null;
    }
    return account;
}

function setupBrandDashboardNavigation() {
    const brand = document.querySelector("header .brand, #siteHeader h1");
    const profileName = document.querySelector("#profileName");
    const currentPage = window.location.pathname.split("/").pop().toLowerCase();
    if (brand) brand.style.fontSize = "24px";
    if (profileName) {
        profileName.style.fontSize = "16px";
        profileName.style.lineHeight = "1.2";
    }
    const topLogout = document.querySelector("#logoutButton, .logout");
    if (topLogout) topLogout.style.display = "none";
    if (profileName && profileName.textContent && !/^Dr\.\s/i.test(profileName.textContent)) {
        profileName.textContent = "Dr. " + profileName.textContent.trim();
    }
    if (!brand || currentPage === "index.html") return;

    brand.setAttribute("role", "link");
    brand.setAttribute("tabindex", "0");
    brand.setAttribute("aria-label", "Go to dashboard");
    brand.style.cursor = "pointer";

    const goToDashboard = function(event) {
        if (document.body.classList.contains("reviewing-facts")) return;
        if (event.type === "keydown" && event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        window.location.href = "dashboard.html";
    };

    brand.addEventListener("click", goToDashboard);
    brand.addEventListener("keydown", goToDashboard);
}

function hideLegacyDashboardButtons() {
    ["dashboardButton", "dashboardAfter"].forEach(id => {
        let button = document.getElementById(id);
        if (!button) {
            button = document.createElement("button");
            button.id = id;
            document.body.appendChild(button);
        }
        button.hidden = true;
        button.style.display = "none";
    });
}

hideLegacyDashboardButtons();

function setupGlobalNavigation() {
    const currentPage = window.location.pathname.split("/").pop().toLowerCase();
    const session = getSession();
    if (!session?.loggedIn || currentPage === "login.html" || currentPage === "register.html") return;

    const anchor = document.querySelector("header .profile, #profileArea, #headerStats");
    if (!anchor || document.getElementById("menuButton")) return;

    const account = getAccount();
    const initials = String(account?.fullName || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(name => name.charAt(0).toUpperCase())
        .join("");

    const style = document.createElement("style");
    style.textContent = `
        #menuButton{border:1px solid var(--border,#DFDBCF);background:none;color:inherit;width:38px;height:36px;border-radius:4px;cursor:pointer;font:22px/1 Arial,sans-serif;padding:0}
        #menuButton:hover{border-color:var(--accent,#1F6F64);color:var(--accent,#1F6F64);background:var(--accent-soft,#DCEAE7)}
        #summaryHomeButton{border:1px solid var(--border,#DFDBCF);background:none;color:inherit;width:38px;height:36px;border-radius:4px;cursor:pointer;font:20px/1 Arial,sans-serif;padding:0;margin-right:6px}
        #summaryHomeButton:hover{border-color:var(--accent,#1F6F64);color:var(--accent,#1F6F64);background:var(--accent-soft,#DCEAE7)}
        #navigationBackdrop{display:none;position:fixed;inset:0;background:rgba(32,43,47,.25);z-index:1000}
        #navigationBackdrop.open{display:block}
        #navigationDrawer{position:fixed;top:0;right:0;width:min(340px,88vw);height:100dvh;background:#fff;color:#202B2F;box-shadow:-8px 0 28px rgba(32,43,47,.16);transform:translateX(105%);transition:transform .2s ease;z-index:1001;overflow:auto;padding:22px 18px 28px}
        #navigationDrawer.open{transform:translateX(0)}
        .navigationHeader{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #DFDBCF;padding-bottom:16px;margin-bottom:12px}
        .navigationHeader strong{font:600 23px var(--serif,Georgia,serif)}
        #navigationClose{border:0;background:none;color:#5B6B70;font-size:28px;line-height:1;cursor:pointer;padding:2px 6px}
        .navigationSection{margin:17px 0 0}.navigationSection h2{font:500 10px var(--mono,monospace);letter-spacing:.08em;color:#68777B;margin:0 10px 7px}
        .navigationItem{display:flex;align-items:center;gap:11px;width:100%;border:0;background:none;color:#202B2F;text-align:left;border-radius:4px;padding:11px 10px;font:14px var(--sans,Arial,sans-serif);cursor:pointer}
        .navigationItem:hover{background:#DCEAE7;color:#1F6F64}.navigationItem[aria-disabled="true"]{color:#9AA4A6;cursor:default}.navigationItem[aria-disabled="true"]:hover{background:none;color:#9AA4A6}
        .navigationIcon{width:22px;text-align:center;font-size:17px}.navigationLogout{margin-top:24px;border-top:1px solid #DFDBCF;padding-top:18px}.navigationLogout .navigationItem{color:#B14A3A}
        #profileInitials{display:none;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:#DCEAE7;color:#1F6F64;border:1px solid #AFCFC8;font:600 12px var(--sans,Arial,sans-serif);letter-spacing:.02em}
        #profileName,#profileInitials{cursor:pointer}
        #accountMenu{display:none;position:fixed;top:58px;right:18px;min-width:190px;background:#fff;border:1px solid #DFDBCF;border-radius:6px;box-shadow:0 8px 24px rgba(32,43,47,.14);padding:7px;z-index:1002}
        #accountMenu.open{display:block}
        #accountMenu .navigationItem{padding:10px 11px}
        body.active-session #profileName,body.active-session #profileInitials{display:none!important}
        body.active-session #accountMenu{display:none!important}
        @media(max-width:520px){#navigationDrawer{width:min(360px,92vw)}#menuButton{width:36px;height:34px}#profileName{display:none!important}#profileInitials{display:inline-flex}#headerRow,.headerRow,.head{flex-wrap:nowrap!important;align-items:center!important}#headerStats{width:auto!important;flex:0 0 auto!important}#siteHeader h1,.brand{white-space:nowrap}}
    `;
    document.head.appendChild(style);

    const initialsBadge = document.createElement("span");
    initialsBadge.id = "profileInitials";
    initialsBadge.textContent = initials || "?";
    initialsBadge.setAttribute("aria-label", "User initials");
    const profileName = anchor.querySelector("#profileName");
    if (profileName) {
        profileName.insertAdjacentElement("afterend", initialsBadge);
    } else {
        anchor.appendChild(initialsBadge);
    }

    const menuButton = document.createElement("button");
    menuButton.id = "menuButton";
    menuButton.type = "button";
    menuButton.setAttribute("aria-label", "Open navigation menu");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.textContent = "☰";
    const logoutButton = anchor.querySelector("#logoutButton, .logout");
    if (logoutButton) {
        anchor.insertBefore(menuButton, logoutButton);
    } else {
        anchor.appendChild(menuButton);
    }

    const backdrop = document.createElement("div");
    backdrop.id = "navigationBackdrop";
    backdrop.setAttribute("aria-hidden", "true");
    const drawer = document.createElement("aside");
    drawer.id = "navigationDrawer";
    drawer.setAttribute("aria-label", "Main navigation");
    drawer.innerHTML = `
        <div class="navigationHeader"><strong>Neurology MCQ</strong><button id="navigationClose" type="button" aria-label="Close navigation menu">&times;</button></div>
        <nav>
            <section class="navigationSection"><h2>LEARN</h2><button class="navigationItem" data-page="question-bank.html"><span class="navigationIcon">📚</span>Question Bank</button><button class="navigationItem" data-page="review-facts.html"><span class="navigationIcon">🧠</span>Review Facts</button><button class="navigationItem" data-disabled="true" aria-disabled="true"><span class="navigationIcon">🔖</span>Bookmarks</button><button class="navigationItem" data-page="review-mistakes.html"><span class="navigationIcon">❌</span>Incorrect Questions</button></section>
            <section class="navigationSection"><h2>TEST</h2><button class="navigationItem" data-page="start-test.html"><span class="navigationIcon">📝</span>Start Test</button><button class="navigationItem" data-page="test-history.html"><span class="navigationIcon">📊</span>Test History</button><button class="navigationItem" data-page="performance.html"><span class="navigationIcon">📈</span>My Performance</button></section>
            <section class="navigationLogout"><button class="navigationItem" id="navigationLogout" type="button"><span class="navigationIcon">🚪</span>Logout</button></section>
        </nav>`;
    document.body.append(backdrop, drawer);
    window._defaultNavigationMarkup = drawer.querySelector("nav").innerHTML;

    const accountMenu = document.createElement("div");
    accountMenu.id = "accountMenu";
    accountMenu.innerHTML = '<button class="navigationItem" type="button" aria-disabled="true"><span class="navigationIcon">👤</span>Account</button><button class="navigationItem" id="accountLogout" type="button"><span class="navigationIcon">🚪</span>Logout</button>';
    document.body.appendChild(accountMenu);

    function closeMenu() {
        drawer.classList.remove("open");
        backdrop.classList.remove("open");
        menuButton.setAttribute("aria-expanded", "false");
    }
    window._closeNavigationMenu = closeMenu;

    menuButton.addEventListener("click", () => {
        accountMenu.classList.remove("open");
        drawer.classList.add("open");
        backdrop.classList.add("open");
        menuButton.setAttribute("aria-expanded", "true");
    });
    document.getElementById("navigationClose").addEventListener("click", closeMenu);
    backdrop.addEventListener("click", closeMenu);
    function toggleAccountMenu() {
        accountMenu.classList.toggle("open");
        closeMenu();
    }
    if (profileName) profileName.addEventListener("click", toggleAccountMenu);
    initialsBadge.addEventListener("click", toggleAccountMenu);
    document.getElementById("accountLogout").addEventListener("click", logout);
    drawer.querySelectorAll("[data-page]").forEach(item => {
        item.addEventListener("click", () => { window.location.href = item.dataset.page; });
    });
    document.getElementById("navigationLogout").addEventListener("click", logout);

    updateActiveNavigation();
}

function getActiveSessionAction() {
    const currentPage = window.location.pathname.split("/").pop().toLowerCase();
    if (currentPage === "index.html" && document.body.classList.contains("session-summary")) {
        return { label: "Return to home", icon: "↩", action: () => { window.location.href = "dashboard.html"; } };
    }
    if (currentPage === "review-facts.html" && document.body.classList.contains("facts-summary")) {
        return { label: "Home", icon: "⌂", action: () => { window.location.href = "dashboard.html"; } };
    }
    if (currentPage === "review-facts.html" && document.body.classList.contains("reviewing-facts")) {
        return { label: "End session", icon: "■", action: () => {
            if (typeof window.endReviewFactsSession === "function") {
                window.endReviewFactsSession();
            } else {
                document.getElementById("endSession")?.click();
            }
        } };
    }
    if (currentPage !== "index.html") return null;

    if (localStorage.getItem("neurologyMCQSessionMode") === "questionBank") {
        return { label: "End of session", icon: "■", action: () => document.getElementById("finishButton")?.click() };
    }
    if (localStorage.getItem("neurologyMCQSessionMode") === "reviewMistakes") {
        return { label: "End of review", icon: "■", action: () => document.getElementById("finishButton")?.click() };
    }
    if (!localStorage.getItem("neurologyMCQSessionMode")) {
        return { label: "Finish test", icon: "■", action: () => document.getElementById("finishButton")?.click() };
    }
    return null;
}

function updateActiveNavigation() {
    const drawer = document.getElementById("navigationDrawer");
    const accountMenu = document.getElementById("accountMenu");
    if (!drawer) return;

    const action = getActiveSessionAction();
    const currentPage = window.location.pathname.split("/").pop().toLowerCase();
    const summary = currentPage === "index.html" && document.body.classList.contains("session-summary");
    const activeQuiz = currentPage === "index.html" && !summary;
    const activeFacts = currentPage === "review-facts.html" && document.body.classList.contains("reviewing-facts");
    const factsSummary = currentPage === "review-facts.html" && document.body.classList.contains("facts-summary");
    const restricted = activeQuiz || activeFacts || summary || factsSummary;
    document.body.classList.toggle("active-session", restricted);
    if (accountMenu && restricted) accountMenu.classList.remove("open");

    const menuButton = document.getElementById("menuButton");
    let summaryHomeButton = document.getElementById("summaryHomeButton");
    const isSummary = summary || factsSummary;
    if (isSummary && menuButton && !summaryHomeButton) {
        summaryHomeButton = document.createElement("button");
        summaryHomeButton.id = "summaryHomeButton";
        summaryHomeButton.type = "button";
        summaryHomeButton.textContent = "⌂";
        summaryHomeButton.setAttribute("aria-label", "Return to dashboard");
        summaryHomeButton.addEventListener("click", () => { window.location.href = "dashboard.html"; });
        menuButton.parentNode.insertBefore(summaryHomeButton, menuButton);
    } else if (!isSummary && summaryHomeButton) {
        summaryHomeButton.remove();
    }

    const nav = drawer.querySelector("nav");
    if (!nav) return;
    if (restricted) {
        if (action) {
            nav.innerHTML = '<section class="navigationSection"><button class="navigationItem" id="activeSessionAction" type="button"><span class="navigationIcon">' + action.icon + '</span>' + action.label + '</button></section>';
            document.getElementById("activeSessionAction").addEventListener("click", () => {
                if (typeof window._closeNavigationMenu === "function") window._closeNavigationMenu();
                action.action();
            });
        } else {
            nav.innerHTML = "";
        }
    } else if (nav.querySelector("#activeSessionAction") && window._defaultNavigationMarkup) {
        nav.innerHTML = window._defaultNavigationMarkup;
        nav.querySelectorAll("[data-page]").forEach(item => {
            item.addEventListener("click", () => { window.location.href = item.dataset.page; });
        });
        document.getElementById("navigationLogout").addEventListener("click", logout);
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        setupBrandDashboardNavigation();
        setupGlobalNavigation();
    });
} else {
    setupBrandDashboardNavigation();
    setupGlobalNavigation();
}

/* Small SHA-256 implementation for local-file development.
   Production authentication should move to a secure backend/auth provider. */
function sha256(ascii) {
    function rightRotate(value, amount) {
        return (value >>> amount) | (value << (32 - amount));
    }
    const mathPow = Math.pow;
    const maxWord = mathPow(2, 32);
    let result = "";
    const words = [];
    const asciiBitLength = ascii.length * 8;
    let hash = sha256.h || [];
    let k = sha256.k || [];
    let primeCounter = k.length;

    const isComposite = {};
    for (let candidate = 2; primeCounter < 64; candidate++) {
        if (!isComposite[candidate]) {
            for (let i = 0; i < 313; i += candidate) isComposite[i] = candidate;
            hash[primeCounter] = (mathPow(candidate, .5) * maxWord) | 0;
            k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
        }
    }
    sha256.h = hash;
    sha256.k = k;

    ascii += "\x80";
    while (ascii.length % 64 - 56) ascii += "\x00";

    for (let i = 0; i < ascii.length; i++) {
        const j = ascii.charCodeAt(i);
        if (j > 255) throw new Error("Non-ASCII password character is not supported in this local demo.");
        words[i >> 2] |= j << ((3 - i) % 4 * 8);
    }
    words[words.length] = ((asciiBitLength / maxWord) | 0);
    words[words.length] = asciiBitLength;

    for (let j = 0; j < words.length;) {
        const w = words.slice(j, j += 16);
        const oldHash = hash.slice(0);

        for (let i = 16; i < 64; i++) {
            const w15 = w[i - 15], w2 = w[i - 2];
            const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
            const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
            w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
        }

        let a = hash[0], b = hash[1], c = hash[2], d = hash[3],
            e = hash[4], f = hash[5], g = hash[6], h = hash[7];

        for (let i = 0; i < 64; i++) {
            const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
            const ch = (e & f) ^ (~e & g);
            const temp1 = (h + S1 + ch + k[i] + w[i]) | 0;
            const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
            const maj = (a & b) ^ (a & c) ^ (b & c);
            const temp2 = (S0 + maj) | 0;

            h = g; g = f; f = e; e = (d + temp1) | 0;
            d = c; c = b; b = a; a = (temp1 + temp2) | 0;
        }

        hash = [
            (hash[0] + a) | 0, (hash[1] + b) | 0, (hash[2] + c) | 0, (hash[3] + d) | 0,
            (hash[4] + e) | 0, (hash[5] + f) | 0, (hash[6] + g) | 0, (hash[7] + h) | 0
        ];
    }

    for (let i = 0; i < hash.length; i++) {
        for (let j = 7; j >= 0; j--) result += ((hash[i] >>> (j * 4)) & 0xF).toString(16);
    }
    return result;
}

/**
 * Hashes a password for local storage/comparison.
 * Throws if the password contains non-ASCII characters (the demo sha256
 * implementation only supports ASCII). Callers (login.js, register.js)
 * MUST wrap calls to this in try/catch and show a friendly message —
 * do not let this exception reach the user as a silent failure.
 */
function passwordHash(password) {
    return sha256(password);
}
