const factAccount = requireLogin();
if (!factAccount) throw new Error("Login required");

document.getElementById("profileName").textContent = factAccount.fullName;
const FACT_STATS_KEY = "neurologyMCQFactStats_" + String(factAccount.userId || "default");
const factAvailableText = document.getElementById("availableText");
const factSummaryCompleted = document.getElementById("summaryCompleted");
const factErrorMessage = document.getElementById("errorMessage");
const factSelectionIntro = document.getElementById("selectionIntro");
const factSelectionPanel = document.getElementById("selectionPanel");
const factSession = document.getElementById("session");
const factMeta = document.getElementById("factMeta");
const factPrompt = document.getElementById("factPrompt");
const factAnswer = document.getElementById("factAnswer");
const factExplanation = document.getElementById("factExplanation");
const factComparison = document.getElementById("factComparison");
const factAnswerHeading = document.getElementById("answerHeading");
const factOptions = document.getElementById("answerOptions");
const factRevealButton = document.getElementById("revealButton");
const factBookmarkButton = document.getElementById("factBookmarkButton");
const factFlagButton = document.getElementById("factFlagButton");
const factFeedback = document.getElementById("feedback");
const factNextButton = document.getElementById("nextButton");
const factKnewButton = document.getElementById("knewButton");
const factReviewAgainButton = document.getElementById("reviewAgainButton");
const factRestartJourneyButton = document.getElementById("restartJourneyButton");
const factStatus = document.getElementById("factStatus");
const factSessionProgress = document.getElementById("sessionProgress");
const factSessionCompleted = document.getElementById("sessionCompleted");
const factSessionReviewed = document.getElementById("sessionReviewed");
const factSessionMessage = document.getElementById("sessionMessage");
let factStats = loadFactStats();
let selectedFactPool = [];
let currentFactIndex = 0;
let currentFact = null;
let flaggedFacts = {};
let selectedFactAnswer = "";
let factRevealed = false;
let factSessionCorrect = new Set();
let factSessionSeen = new Set();
let factSessionId = null;

function playPop(el) {
    if (!el) return;
    el.classList.remove("iconPop");
    void el.offsetWidth;
    el.classList.add("iconPop");
}

/* Inline SVG icons instead of the ★ / ⚑ Unicode characters: on some Android
   browsers those glyphs fall back to a fixed-color emoji font that ignores
   CSS color entirely. SVG with fill/stroke="currentColor" always obeys it. */
const STAR_ICON_SVG = '<svg class="btnIcon" viewBox="0 0 20 20" width="13" height="13" aria-hidden="true"><path d="M10 1.6l2.47 5.24 5.78.6-4.32 3.94 1.19 5.72L10 14.9l-5.12 3.2 1.19-5.72L1.75 7.44l5.78-.6z" fill="currentColor"/></svg>';
const FLAG_ICON_SVG = '<svg class="btnIcon" viewBox="0 0 20 20" width="13" height="13" aria-hidden="true"><path d="M4 1.6v16.8M4 2.6h10.6l-1.9 3.4 1.9 3.4H4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round"/></svg>';

function setFactBookmarkButtonState(bookmarked) {
    if (!factBookmarkButton) return;
    const mobile = isAndroidMobileFactView();
    factBookmarkButton.innerHTML = STAR_ICON_SVG + (mobile ? "" : (bookmarked ? "  Bookmarked" : "  Bookmark"));
    factBookmarkButton.classList.toggle("bookmarked", !!bookmarked);
    factBookmarkButton.setAttribute("aria-pressed", bookmarked ? "true" : "false");
}

function setFactFlagButtonState(flagged) {
    if (!factFlagButton) return;
    const mobile = isAndroidMobileFactView();
    factFlagButton.innerHTML = FLAG_ICON_SVG + (mobile ? "" : (flagged ? "  Flagged" : "  Flag"));
    factFlagButton.classList.toggle("flagged", !!flagged);
}

function isAndroidMobileFactView() {
    return document.body.classList.contains("android-mobile") ||
        window.matchMedia("(max-width: 700px)").matches;
}

function updateFactActionLabels() {
    if (factBookmarkButton) setFactBookmarkButtonState(factBookmarkButton.classList.contains("bookmarked"));
    if (factFlagButton) setFactFlagButtonState(!!flaggedFacts[currentFact?.id]);
}

function loadFactStats() {
    try {
        const parsed = JSON.parse(localStorage.getItem(FACT_STATS_KEY) || "{}");
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch (error) {
        return {};
    }
}

function saveFactStats() {
    localStorage.setItem(FACT_STATS_KEY, JSON.stringify(factStats));
}

function getFactStats(fact) {
    return factStats[fact.id] || { seen: 0, reviewed: 0, correct: 0, completed: false };
}

function isFactCompleted(fact) {
    return Number(getFactStats(fact).correct) >= 3;
}

function availableFacts() {
    return facts.filter(function(fact) {
        return !isFactCompleted(fact);
    });
}

function completedFactCount() {
    return facts.filter(isFactCompleted).length;
}

function updateSelectionSummary() {
    const available = availableFacts();
    factAvailableText.textContent = available.length + " fact" + (available.length === 1 ? "" : "s") + " available for this selection";
    factSummaryCompleted.textContent = completedFactCount() + " / " + facts.length;
    factErrorMessage.textContent = "";
    const allCompleted = completedFactCount() === facts.length;
    document.getElementById("startButton").disabled = available.length === 0;
    factRestartJourneyButton.hidden = !allCompleted;
    if (allCompleted) factAvailableText.textContent = "All facts completed - you can begin the full journey again";
}

function markFactSeen(fact) {
    if (factSessionSeen.has(fact.id)) return;
    const stats = getFactStats(fact);
    stats.seen = (Number(stats.seen) || 0) + 1;
    stats.reviewed = (Number(stats.reviewed) || 0) + 1;
    stats.lastReviewedAt = new Date().toISOString();
    factStats[fact.id] = stats;
    factSessionSeen.add(fact.id);
    saveFactStats();
}

function renderFactStatus(fact) {
    const stats = getFactStats(fact);
    if (!stats.seen) {
        factStatus.textContent = "New fact";
        return;
    }
    factStatus.textContent = "Repeated - reviewed " + stats.reviewed + " times, correct " + stats.correct + " times";
}

function renderOptions(fact) {
    factOptions.innerHTML = "";
    const options = Array.isArray(fact.options) ? fact.options : [];
    options.forEach(function(option) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "answerOption";
        button.textContent = option;
        button.addEventListener("click", function() {
            if (factRevealed) return;
            selectedFactAnswer = option;
            factOptions.querySelectorAll(".answerOption").forEach(function(item) { item.classList.remove("selected", "answerPop", "answerShake"); });
            button.classList.add("selected");
            void button.offsetWidth;
            button.classList.add(String(option) === String(currentFact.answer || "") ? "answerPop" : "answerShake");
            revealFact();
        });
        factOptions.appendChild(button);
    });
    factOptions.style.display = options.length ? "grid" : "none";
}

function renderCurrentFact() {
    currentFact = selectedFactPool[currentFactIndex];
    if (!currentFact) {
        endFactSession(true);
        return;
    }
    factRevealed = false;
    selectedFactAnswer = "";
    factMeta.textContent = currentFact.topic + " - " + (currentFact.difficulty || "General") + " - Fact " + (currentFactIndex + 1);
    factPrompt.textContent = currentFact.prompt;
    factAnswer.textContent = "";
    factExplanation.textContent = "";
    factComparison.hidden = true;
    factComparison.textContent = "";
    factFeedback.style.display = "none";
    factRevealButton.style.display = "inline-block";
    factNextButton.style.display = "none";
    factKnewButton.hidden = true;
    factReviewAgainButton.hidden = true;
    factNextButton.textContent = currentFactIndex === selectedFactPool.length - 1 ? "Finish session" : "Next fact";
    factSessionProgress.textContent = (currentFactIndex + 1) + " of " + selectedFactPool.length;
    factSessionCompleted.textContent = completedFactCount() + " / " + facts.length;
    factSessionReviewed.textContent = factSessionSeen.size;
    renderFactStatus(currentFact);
    if (factBookmarkButton) {
        const bookmarked = typeof isBookmarked === "function" && isBookmarked(currentFact.id);
        setFactBookmarkButtonState(!!bookmarked);
    }
    if (factFlagButton) {
        setFactFlagButtonState(!!flaggedFacts[currentFact.id]);
    }
    renderOptions(currentFact);
    markFactSeen(currentFact);
    factSessionReviewed.textContent = factSessionSeen.size;
}

function revealFact() {
    if (factRevealed) return;
    factRevealed = true;
    const answer = String(currentFact.answer || "");
    const correct = Array.isArray(currentFact.options) ? selectedFactAnswer === answer : null;
    if (correct === true) {
        recordFactCorrect(currentFact);
        factSessionMessage.textContent = "Correct - moving to the next fact.";
        factFeedback.style.display = "none";
        factRevealButton.style.display = "none";
        window.setTimeout(advanceFact, 350);
        return;
    }
    factAnswerHeading.textContent = correct === false ? "Review this answer" : "Answer";
    factAnswer.textContent = answer;
    factExplanation.textContent = currentFact.explanation || "";
    if (currentFact.comparison) {
        factComparison.hidden = false;
        factComparison.textContent = currentFact.comparison;
    }
    factFeedback.style.display = "block";
    factRevealButton.style.display = "none";
    factOptions.querySelectorAll(".answerOption").forEach(function(button) { button.disabled = true; });
    if (correct === null) {
        factKnewButton.hidden = false;
        factReviewAgainButton.hidden = false;
        factNextButton.style.display = "none";
        factSessionMessage.textContent = "Mark whether you recalled the fact before revealing it.";
        return;
    }
    factSessionMessage.textContent = "Take another look, then continue when ready.";
    factNextButton.style.display = "inline-block";
}

function recordFactCorrect(fact) {
    if (factSessionCorrect.has(fact.id)) return;
    const stats = getFactStats(fact);
    stats.correct = (Number(stats.correct) || 0) + 1;
    stats.completed = stats.correct >= 3;
    stats.lastCorrectAt = new Date().toISOString();
    factStats[fact.id] = stats;
    factSessionCorrect.add(fact.id);
    saveFactStats();
    factSessionCompleted.textContent = completedFactCount() + " / " + facts.length;
}

function advanceFact() {
    currentFactIndex += 1;
    if (currentFactIndex >= selectedFactPool.length) {
        endFactSession(true);
        return;
    }
    renderCurrentFact();
}

function endFactSession(completed) {
    if (completed) {
        factSessionMessage.textContent = "Session complete. Returning to Dashboard.";
    }
    window.setTimeout(function() { window.location.href = "dashboard.html"; }, completed ? 650 : 0);
}

window.endReviewFactsSession = function() { endFactSession(false); };

function startFactSession() {
    selectedFactPool = availableFacts();
    if (!selectedFactPool.length) {
        factErrorMessage.textContent = "No unfinished facts match this selection.";
        return;
    }
    factSessionId = Date.now().toString();
    factSessionCorrect = new Set();
    factSessionSeen = new Set();
    currentFactIndex = 0;
    factSelectionIntro.style.display = "none";
    factSelectionPanel.style.display = "none";
    factSession.style.display = "grid";
    document.body.classList.add("reviewing-facts");
    if (typeof updateActiveNavigation === "function") {
    updateActiveNavigation();
}
    
    renderCurrentFact();
    if (typeof updateActiveNavigation === "function") updateActiveNavigation();
    if (window.location.hash !== "#review") {
        history.replaceState(null, "", window.location.pathname + "#review");
    }
}

function startFullFactJourney() {
    selectedFactPool = facts.slice();
    factSessionId = Date.now().toString();
    factSessionCorrect = new Set();
    factSessionSeen = new Set();
    currentFactIndex = 0;
    factSelectionIntro.style.display = "none";
    factSelectionPanel.style.display = "none";
    factSession.style.display = "grid";
    document.body.classList.add("reviewing-facts");
    
    renderCurrentFact();
    if (typeof updateActiveNavigation === "function") updateActiveNavigation();
    if (window.location.hash !== "#review") {
        history.replaceState(null, "", window.location.pathname + "#review");
    }
}

document.getElementById("startButton").addEventListener("click", startFactSession);
factRevealButton.addEventListener("click", revealFact);
factNextButton.addEventListener("click", advanceFact);
factKnewButton.addEventListener("click", function() {
    factKnewButton.hidden = true;
    factReviewAgainButton.hidden = true;
    recordFactCorrect(currentFact);
    factSessionMessage.textContent = "Correct - moving to the next fact.";
    window.setTimeout(advanceFact, 450);
});
factReviewAgainButton.addEventListener("click", function() {
    factKnewButton.hidden = true;
    factReviewAgainButton.hidden = true;
    factNextButton.style.display = "inline-block";
    factSessionMessage.textContent = "Take another look, then continue when ready.";
});
factRestartJourneyButton.addEventListener("click", startFullFactJourney);
document.getElementById("endSession").addEventListener("click", function() { endFactSession(false); });
document.getElementById("logoutButton").addEventListener("click", logout);

updateSelectionSummary();if (factBookmarkButton) factBookmarkButton.addEventListener("click", function() {
    if (!currentFact) return;
    const bookmarked = toggleBookmark(currentFact.id);
    setFactBookmarkButtonState(bookmarked);
    playPop(factBookmarkButton);
});
if (factFlagButton) factFlagButton.addEventListener("click", function() {
    if (!currentFact) return;
    flaggedFacts[currentFact.id] = !flaggedFacts[currentFact.id];
    setFactFlagButtonState(!!flaggedFacts[currentFact.id]);
    playPop(factFlagButton);
});



window.addEventListener("resize", updateFactActionLabels);
if (window.location.hash === "#review") {
    window.setTimeout(function() {
        if (document.getElementById("session")?.style.display !== "grid") startFactSession();
    }, 0);
}
