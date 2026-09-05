const factAccount = requireLogin();
if (!factAccount) throw new Error("Login required");

const profileName = document.getElementById("profileName");
if (profileName) profileName.textContent = factAccount.fullName;

const FACT_STATS_KEY = "neurologyMCQFactStats_" + String(factAccount.userId || "default");
let factStats = loadFactStats();

const homeView = document.getElementById("homeView");
const totalFactsEl = document.getElementById("totalFacts");
const doneFactsEl = document.getElementById("doneFacts");
const remainingFactsEl = document.getElementById("remainingFacts");
const sessionEl = document.getElementById("session");
const completionEl = document.getElementById("completion");
const factMeta = document.getElementById("factMeta");
const factStatus = document.getElementById("factStatus");
const factPrompt = document.getElementById("factPrompt");
const answerOptions = document.getElementById("answerOptions");
const feedback = document.getElementById("feedback");
const feedbackHeading = document.getElementById("feedbackHeading");
const factAnswer = document.getElementById("factAnswer");
const factExplanation = document.getElementById("factExplanation");
const factComparison = document.getElementById("factComparison");
const nextButton = document.getElementById("nextButton");
const sessionProgress = document.getElementById("sessionProgress");
const sessionReviewed = document.getElementById("sessionReviewed");
const sessionCorrect = document.getElementById("sessionCorrect");
const sessionDone = document.getElementById("sessionDone");
const dashboardButton = document.getElementById("dashboardButton");

let pool = [];
let currentIndex = 0;
let currentFact = null;
let selectedAnswer = "";
let checked = false;
let sessionId = "";
let sessionSeen = new Set();
let sessionCorrectIds = new Set();

function loadFactStats() {
    try {
        const parsed = JSON.parse(localStorage.getItem(FACT_STATS_KEY) || "{}");
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch (e) {
        return {};
    }
}

function saveFactStats() {
    localStorage.setItem(FACT_STATS_KEY, JSON.stringify(factStats));
}

function getStats(fact) {
    const raw = factStats[fact.id] || {};
    return {
        seen: Number(raw.seen) || 0,
        reviewed: Number(raw.reviewed) || 0,
        correctSessions: Array.isArray(raw.correctSessions) ? raw.correctSessions : [],
        lastReviewedAt: raw.lastReviewedAt || null,
        lastCorrectAt: raw.lastCorrectAt || null
    };
}

function isDone(fact) {
    return getStats(fact).correctSessions.length >= 3;
}

function doneCount() {
    return facts.filter(isDone).length;
}

function remainingFacts() {
    return facts.filter(f => !isDone(f));
}

function updateAllTimeSummary() {
    const total = facts.length;
    const done = doneCount();
    totalFactsEl.textContent = total;
    doneFactsEl.textContent = done;
    remainingFactsEl.textContent = Math.max(0, total - done);
    const start = document.getElementById("startButton");
    start.disabled = remainingFacts().length === 0;
    start.textContent = remainingFacts().length ? "Start Review" : "All facts Done & Dusted";
}

function shuffle(items) {
    const a = items.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function markSeen(fact) {
    if (sessionSeen.has(fact.id)) return;
    const stats = getStats(fact);
    stats.seen += 1;
    stats.reviewed += 1;
    stats.lastReviewedAt = new Date().toISOString();
    factStats[fact.id] = stats;
    sessionSeen.add(fact.id);
    saveFactStats();
}

function renderStatus(fact) {
    const stats = getStats(fact);
    const correct = stats.correctSessions.length;
    if (!stats.seen) {
        factStatus.textContent = "New fact";
    } else {
        factStatus.textContent = "Repeat — reviewed " + stats.reviewed + " times · correct " + correct + " times";
    }
}

function renderOptions(fact) {
    answerOptions.innerHTML = "";
    const options = Array.isArray(fact.options) ? fact.options : [];
    if (!options.length) {
        answerOptions.style.display = "none";
        return;
    }
    answerOptions.style.display = "grid";
    options.forEach((option, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "answerOption";
        button.textContent = String.fromCharCode(65 + index) + ". " + option;
        button.addEventListener("click", () => {
            if (checked) return;
            selectedAnswer = option;
            checkCurrentFact();
        });
        answerOptions.appendChild(button);
    });
}

function renderFact() {
    currentFact = pool[currentIndex];
    if (!currentFact) {
        finishSession(true);
        return;
    }

    checked = false;
    selectedAnswer = "";
    factMeta.textContent = currentFact.topic + " · " + (currentFact.difficulty || "General") + " · Fact " + (currentIndex + 1);
    factPrompt.textContent = currentFact.prompt || currentFact.fact || "";
    renderStatus(currentFact);
    renderOptions(currentFact);

    feedback.style.display = "none";
    feedback.className = "feedback";
    factAnswer.textContent = "";
    factExplanation.textContent = "";
    factComparison.hidden = true;
    factComparison.textContent = "";
    nextButton.style.display = "none";
    nextButton.textContent = currentIndex === pool.length - 1 ? "Finish session" : "Next fact";

    sessionProgress.textContent = (currentIndex + 1) + " of " + pool.length;
    sessionReviewed.textContent = sessionSeen.size;
    sessionCorrect.textContent = sessionCorrectIds.size;
    sessionDone.textContent = doneCount();

    markSeen(currentFact);
    sessionReviewed.textContent = sessionSeen.size;
    updateAllTimeSummary();
}

function recordCorrect(fact) {
    if (sessionCorrectIds.has(fact.id)) return;

    const stats = getStats(fact);
    if (!stats.correctSessions.includes(sessionId)) {
        stats.correctSessions.push(sessionId);
        stats.lastCorrectAt = new Date().toISOString();
    }
    factStats[fact.id] = stats;
    sessionCorrectIds.add(fact.id);
    saveFactStats();
}

function checkCurrentFact() {
    if (checked || !currentFact) return;

    const options = Array.isArray(currentFact.options) ? currentFact.options : [];
    if (!options.length) return;
    if (!selectedAnswer) return;

    checked = true;
    const correct = selectedAnswer === String(currentFact.answer || "");

    answerOptions.querySelectorAll(".answerOption").forEach(button => {
        const optionText = button.textContent.replace(/^[A-Z]\.\s*/, "");
        button.disabled = true;
        if (optionText === String(currentFact.answer || "")) button.classList.add("correct");
        if (optionText === selectedAnswer && !correct) button.classList.add("wrong");
    });

    if (correct) {
        recordCorrect(currentFact);
        sessionCorrect.textContent = sessionCorrectIds.size;
        sessionDone.textContent = doneCount();
        updateAllTimeSummary();

        // Correct answers advance immediately. No answer explanation or extra button is shown.
        advance();
        return;
    }

    // Incorrect answers are shown for learning, with the normal Next fact action.
    feedbackHeading.textContent = "Review this fact";
    feedback.className = "feedback incorrect";
    factAnswer.textContent = "Correct answer: " + currentFact.answer;
    factExplanation.textContent = currentFact.explanation || "";

    if (currentFact.comparison) {
        factComparison.hidden = false;
        factComparison.textContent = currentFact.comparison;
    }

    feedback.style.display = "block";
    nextButton.style.display = "inline-block";
    sessionCorrect.textContent = sessionCorrectIds.size;
    sessionDone.textContent = doneCount();
    updateAllTimeSummary();
}

function startSession() {
    const remaining = remainingFacts();
    if (!remaining.length) {
        updateAllTimeSummary();
        return;
    }

    sessionId = Date.now().toString() + "-" + Math.random().toString(36).slice(2);
    sessionSeen = new Set();
    sessionCorrectIds = new Set();
    pool = shuffle(remaining);
    currentIndex = 0;

    homeView.style.display = "none";
    completionEl.style.display = "none";
    sessionEl.style.display = "grid";
    document.getElementById("logoutButton").style.display = "none";
    if (dashboardButton) dashboardButton.style.display = "none";
    // Review Facts only: hide the header wave and reduce question text size while reviewing.
    document.body.classList.add("reviewing-facts");
    renderFact();
}

function advance() {
    currentIndex += 1;
    if (currentIndex >= pool.length) {
        finishSession(true);
    } else {
        renderFact();
        window.scrollTo({top: 0, behavior: "smooth"});
    }
}

function finishSession(completedAll) {
    sessionEl.style.display = "none";
    homeView.style.display = "none";
    completionEl.style.display = "block";
    document.getElementById("logoutButton").style.display = "inline-block";
    if (dashboardButton) dashboardButton.style.display = "inline-block";
    // Restore normal header/question styling after the review session ends.
    document.body.classList.remove("reviewing-facts");

    document.getElementById("completionReviewed").textContent = sessionSeen.size;
    document.getElementById("completionCorrect").textContent = sessionCorrectIds.size;
    document.getElementById("completionDone").textContent = doneCount();

    document.getElementById("completionMessage").textContent =
        completedAll
            ? "You completed this review journey. Facts answered correctly in three different sessions are now Done & Dusted."
            : "Your progress has been saved. You can return later and continue with the remaining facts.";

    updateAllTimeSummary();
    window.scrollTo({top: 0, behavior: "smooth"});
}

if (dashboardButton) {
    dashboardButton.addEventListener("click", () => {
        window.location.href = "dashboard.html";
    });
}

document.getElementById("startButton").addEventListener("click", startSession);
nextButton.addEventListener("click", advance);

document.getElementById("endSession").addEventListener("click", () => finishSession(false));

document.getElementById("dashboardAfter").addEventListener("click", () => {
    window.location.href = "dashboard.html";
});

document.getElementById("logoutButton").addEventListener("click", logout);

updateAllTimeSummary();
