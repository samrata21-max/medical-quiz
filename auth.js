
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

// Normalizes the page name, handling Cloudflare's clean URLs (e.g. "/dashboard" with no .html extension) and the root path.
function getCurrentPage() {
    const path = window.location.pathname.split("/").pop().toLowerCase();
    if (!path) return "index.html";
    return path.includes(".") ? path : path + ".html";
}

function normalizeSiteHeader() {
    const header = document.querySelector("header");
    if (!header) return;

    const existingRow = header.querySelector(".site-header__inner, .head, .headerRow, #headerRow");
    if (!existingRow) {
        const wrapper = document.createElement("div");
        wrapper.className = "site-header__inner";
        while (header.firstElementChild) wrapper.appendChild(header.firstElementChild);
        header.appendChild(wrapper);
        return;
    }

    existingRow.classList.add("site-header__inner");

    const brand = existingRow.querySelector(".site-brand, .siteBrand");
    if (brand) {
        brand.classList.add("site-brand");
        const logo = brand.querySelector(".site-brand__logo, .siteBrandLogo, .brandLogo");
        if (!logo && brand.textContent.trim() === "StepUpNeuro") {
            brand.innerHTML = '<img class="site-brand__logo" src="stepupneuro_logo.svg" alt="StepUpNeuro">';
        } else if (logo) {
            logo.classList.add("site-brand__logo");
        }
    }

    const actions = existingRow.querySelector(".profile, #headerStats, #profileArea, .site-header__actions");
    if (actions) {
        actions.classList.add("site-header__actions");
    }

    const profileName = existingRow.querySelector("#profileName, .profileName");
    if (profileName) {
        profileName.classList.add("site-header__profile-name");
    }
}

function setupBrandDashboardNavigation() {
    const brand = document.querySelector("header .site-brand, #siteHeader h1");
    const profileName = document.querySelector("#profileName");
    const currentPage = getCurrentPage();
    if (brand && !brand.querySelector(".brandLogo, .siteBrandLogo, .site-brand__logo") && brand.textContent.trim() === "StepUpNeuro") {
        brand.classList.add("site-brand");
        brand.innerHTML = '<img class="site-brand__logo" src="stepupneuro_logo.svg" alt="StepUpNeuro">';
    }
    if (brand) {
        brand.classList.add("site-brand");
    }
    if (profileName) {
        profileName.style.fontSize = "16px";
        profileName.style.lineHeight = "1.2";
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

const BOOKMARKS_KEY = "neurologyMCQBookmarks";
function getBookmarks() {
    const account = getAccount();
    if (!account?.userId) return {};
    try { const parsed = JSON.parse(localStorage.getItem(BOOKMARKS_KEY + "_" + account.userId) || "{}"); return parsed && typeof parsed === "object" ? parsed : {}; }
    catch (error) { return {}; }
}
function isBookmarked(itemId) { return !!getBookmarks()[String(itemId)]; }
function setBookmarked(itemId, value) {
    const account = getAccount();
    if (!account?.userId || !itemId) return false;
    const bookmarks = getBookmarks();
    if (value) bookmarks[String(itemId)] = Date.now(); else delete bookmarks[String(itemId)];
    try { localStorage.setItem(BOOKMARKS_KEY + "_" + account.userId, JSON.stringify(bookmarks)); return true; } catch (error) { return false; }
}
function toggleBookmark(itemId) { const next = !isBookmarked(itemId); setBookmarked(itemId, next); return next; }

function setupGlobalNavigation() {
    normalizeSiteHeader();
    const isCompactMobile = window.matchMedia("(max-width: 700px)").matches;
    document.body.classList.toggle("android-mobile", isCompactMobile);
    const currentPage = getCurrentPage();
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
        .siteBrand,.brand{display:flex;align-items:center;justify-content:center;height:52px;min-height:52px;flex:0 0 auto}
        header .profile,#profileArea{display:flex;align-items:center;justify-self:end;gap:12px;color:var(--ink-soft);font-size:13px;flex-wrap:nowrap;height:52px;min-height:52px}
        #profileName{color:var(--ink);font-weight:600;line-height:1;white-space:nowrap;display:inline-flex;align-items:center}
        #menuButton,#summaryHomeButton,.homeButton{width:52px;height:52px;min-width:52px;min-height:52px;box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0}
        #menuButton{border:1px solid var(--border);background:var(--bg);color:var(--ink);border-radius:11px;cursor:pointer;font:19px/1 Arial,sans-serif;padding:0;transition:.15s ease;line-height:1}
        #menuButton:hover{border-color:var(--accent);color:var(--accent);background:var(--accent-soft)}
        #summaryHomeButton,.homeButton{border:1px solid var(--border);background:var(--bg);color:var(--ink);border-radius:11px;cursor:pointer;font:18px/1 Arial,sans-serif;padding:0;margin-right:8px;transition:.15s ease;line-height:1}
        #summaryHomeButton:hover,.homeButton:hover{border-color:var(--accent);color:var(--accent);background:var(--accent-soft)}
        #navigationBackdrop{display:none;position:fixed;inset:0;background:var(--overlay);z-index:1000;backdrop-filter:blur(1px)}
        #navigationBackdrop.open{display:block}
        #navigationDrawer{position:fixed;top:0;right:0;width:min(340px,88vw);height:100dvh;background:var(--panel);color:var(--ink);box-shadow:-12px 0 34px rgba(16,25,51,.16);transform:translateX(105%);transition:transform .22s ease;z-index:1001;overflow:auto;padding:22px 16px 28px}
        #navigationDrawer.open{transform:translateX(0)}
        .navigationHeader{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border);padding:2px 6px 18px}
        .navigationHeader strong{font:700 21px var(--sans,Arial,sans-serif);color:var(--ink)}
        #navigationClose{border:0;background:var(--disabled);color:var(--ink-soft);width:32px;height:32px;border-radius:9px;font-size:19px;line-height:1;cursor:pointer}
        #navigationClose:hover{background:var(--rose-bg);color:var(--rose-fg)}
        .navigationSection{margin:18px 0 0}.navigationSection h2{font:700 10.5px var(--sans,Arial,sans-serif);letter-spacing:.09em;color:var(--placeholder);margin:0 12px 8px}
        .navigationItem{display:flex;align-items:center;gap:12px;width:100%;border:0;background:none;color:var(--ink);text-align:left;border-radius:11px;padding:11px 12px;font:500 14px var(--sans,Arial,sans-serif);cursor:pointer;transition:.12s ease}
        .navigationItem:hover{background:var(--disabled);color:var(--accent)}.navigationItem[aria-disabled="true"]{color:var(--muted);cursor:default}.navigationItem[aria-disabled="true"]:hover{background:none;color:var(--muted)}
        .navigationItem.active{background:var(--accent-soft);color:var(--accent-dark);font-weight:600}.navigationItem.active:hover{background:var(--accent-soft);color:var(--accent-dark)}
        .navigationIcon{width:26px;height:26px;flex:0 0 26px;display:flex;align-items:center;justify-content:center;font-size:15px;border-radius:8px}
        .navigationLogout{margin-top:22px;border-top:1px solid var(--border);padding-top:16px}.navigationLogout .navigationItem{color:var(--rose-fg)}.navigationLogout .navigationItem:hover{background:var(--rose-bg);color:var(--rose-fg)}
        #profileName{cursor:pointer}
        #headerStats{display:flex;align-items:center;gap:12px;flex-wrap:nowrap;margin-left:auto;height:52px;min-height:52px}
        #accountMenu{display:none;position:fixed;top:60px;right:18px;min-width:200px;background:var(--panel);border:1px solid var(--border);border-radius:14px;box-shadow:0 14px 32px rgba(16,25,51,.16);padding:8px;z-index:1002}
        #accountMenu.open{display:block}
        #accountMenu .navigationItem{padding:11px 12px}
        body.active-session #profileName{display:none!important}
        body.active-session #accountMenu{display:none!important}
        @media(max-width:520px){#navigationDrawer{width:min(360px,92vw)}#profileName{display:none!important}#headerRow,.headerRow,.head{flex-wrap:nowrap!important;align-items:center!important;min-height:52px}#headerStats{width:auto!important;flex:0 0 auto!important;height:52px;min-height:52px}#siteHeader h1,.brand{white-space:nowrap}} 
    `;
    document.head.appendChild(style);

    const profileName = anchor.querySelector("#profileName");

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
        <div class="navigationHeader"><strong>StepUpNeuro</strong><button id="navigationClose" type="button" aria-label="Close navigation menu">&times;</button></div>
        <nav>
            <section class="navigationSection"><h2>MAIN</h2><button class="navigationItem" data-page="dashboard.html"><span class="navigationIcon">🏠</span>Dashboard</button></section>
            <section class="navigationSection"><h2>LEARN</h2><button class="navigationItem" data-page="question-bank.html"><span class="navigationIcon">📚</span>Question Bank</button><button class="navigationItem" data-page="review-facts.html"><span class="navigationIcon">🧠</span>Review Facts</button><button class="navigationItem" data-page="bookmarks.html"><span class="navigationIcon">🔖</span>Bookmarks</button><button class="navigationItem" data-page="review-mistakes.html"><span class="navigationIcon">❌</span>Incorrect Questions</button></section>
            <section class="navigationSection"><h2>TEST</h2><button class="navigationItem" data-page="start-test.html"><span class="navigationIcon">📝</span>Start Test</button><button class="navigationItem" data-page="test-history.html"><span class="navigationIcon">📊</span>Test History</button><button class="navigationItem" data-page="performance.html"><span class="navigationIcon">📈</span>My Performance</button></section>
            <section class="navigationLogout"><button class="navigationItem" id="navigationLogout" type="button"><span class="navigationIcon">🚪</span>Logout</button></section>
        </nav>`;
    document.body.append(backdrop, drawer);
    window._defaultNavigationMarkup = drawer.querySelector("nav").innerHTML;

    const accountMenu = document.createElement("div");
    accountMenu.id = "accountMenu";
    accountMenu.innerHTML = '<button class="navigationItem" id="accountInformation" type="button"><span class="navigationIcon">👤</span>Account information</button><button class="navigationItem" id="accountLogout" type="button"><span class="navigationIcon">🚪</span>Logout</button>';
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
    document.getElementById("accountInformation").addEventListener("click", () => { window.location.href = "account.html"; });
    document.getElementById("accountLogout").addEventListener("click", logout);
    drawer.querySelectorAll("[data-page]").forEach(item => {
        item.addEventListener("click", () => { window.location.href = item.dataset.page; });
    });
    document.getElementById("navigationLogout").addEventListener("click", logout);

    updateActiveNavigation();
}

function getActiveSessionAction() {
    const currentPage = getCurrentPage();
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
    if (currentPage === "textbook-review.html" && document.body.classList.contains("reviewing-textbook")) {
        return { label: "End revision", icon: "■", action: () => document.getElementById("changeButton")?.click() };
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
    const currentPage = getCurrentPage();
    const summary = currentPage === "index.html" && document.body.classList.contains("session-summary");
    const activeQuiz = currentPage === "index.html" && !summary;
    const activeFacts = currentPage === "review-facts.html" && document.body.classList.contains("reviewing-facts");
    const factsSummary = currentPage === "review-facts.html" && document.body.classList.contains("facts-summary");
    const activeTextbook = currentPage === "textbook-review.html" && document.body.classList.contains("reviewing-textbook");
    const restricted = activeQuiz || activeFacts || activeTextbook || summary || factsSummary;
    document.body.classList.toggle("active-session", restricted);
    if (accountMenu && restricted) accountMenu.classList.remove("open");

    const menuButton = document.getElementById("menuButton");
    const dashboardNavItem = drawer.querySelector('[data-page="dashboard.html"]');
    if (dashboardNavItem) {
        dashboardNavItem.style.display = currentPage === "dashboard.html" ? "none" : "";
    }
    const mainNavigationSection = Array.from(drawer.querySelectorAll('.navigationSection')).find(section => {
        const heading = section.querySelector('h2');
        return heading && heading.textContent.trim().toUpperCase() === "MAIN";
    });
    if (mainNavigationSection) {
        mainNavigationSection.style.display = currentPage === "dashboard.html" ? "none" : "";
    }
    drawer.querySelectorAll("[data-page]").forEach(item => {
        item.classList.toggle("active", item.dataset.page === currentPage);
    });
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
        nav.innerHTML = action ? '<section class="navigationSection"><button class="navigationItem" id="activeSessionAction" type="button"><span class="navigationIcon">' + action.icon + '</span>' + action.label + '</button></section>' : '';
        nav.querySelectorAll("[data-page]").forEach(item => {
            item.addEventListener("click", () => { window.location.href = item.dataset.page; });
        });
        if (action) {
            document.getElementById("activeSessionAction").addEventListener("click", () => {
                if (typeof window._closeNavigationMenu === "function") window._closeNavigationMenu();
                action.action();
            });
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
