const _account = requireLogin();
if (!_account) { throw new Error("Login required"); }

const profileNameEl = document.getElementById("profileName");
if (profileNameEl) profileNameEl.textContent = _account.fullName;

const TEST_PROGRESS_KEY = "neurologyMCQProgress";
const BANK_PROGRESS_KEY = "neurologyMCQQuestionBankProgress";
const TEST_HISTORY_KEY = "neurologyMCQTestHistory";
const QUESTION_STATS_KEY = "neurologyMCQQuestionStats";
const modeRaw = localStorage.getItem("neurologyMCQSessionMode");
const isQuestionBankMode = modeRaw === "questionBank";
const STORAGE_KEY = isQuestionBankMode ? BANK_PROGRESS_KEY : TEST_PROGRESS_KEY;
const QUESTION_BANK_VERSION = "v3";
const questionsPerPage = 20;

let quizQuestions = [];
let currentQuestion = 0;
let currentQuestionPage = 0;
let score = 0;
let answered = false;
let userAnswers = [];
let flaggedQuestions = [];
let question = null;
let selectedDifficulty = "all";
let currentTestCategory = "all";
let testStartedAt = null;
let elapsedSeconds = 0;
let timerInterval = null;
let questionTimerInterval = null;
const QUESTION_TIME_LIMIT = 80;
let questionDeadlines = [];
let timedOutQuestions = [];
let completedTest = false;
let reviewCurrentQuestion = 0;
let reviewVisible = false;
let imageItems = [];
let currentImageIndex = 0;

const nextButton = document.getElementById("nextButton");
const previousButton = document.getElementById("previousButton");
const finishButton = document.getElementById("finishButton");
const quizContainer = document.getElementById("quizContainer");
const flagButton = document.getElementById("flagButton");
const submitButton = document.getElementById("submitButton");
const result = document.getElementById("result");
const explanation = document.getElementById("explanation");
const scoreDisplay = document.getElementById("score");
const dashboardButton = document.getElementById("dashboardButton");
const reviewButton = document.getElementById("reviewButton");
const reviewContainer = document.getElementById("reviewContainer");
const quizLayout = document.getElementById("quizLayout");
const resultsSummary = document.getElementById("resultsSummary");
const timerDisplay = document.getElementById("timerDisplay");
const imagesButton = document.getElementById("imagesButton");
const imageModal = document.getElementById("imageModal");
const imageStage = document.getElementById("imageStage");
const imageCounter = document.getElementById("imageCounter");
const imageModalTitle = document.getElementById("imageModalTitle");

function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>'"]/g, function(char) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char];
    });
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function normalizeDifficulty(q) {
    const value = String(q.difficulty || "").trim().toLowerCase();
    if (value === "easy" || value === "basic") return "Easy";
    if (value === "moderate" || value === "medium" || value === "intermediate") return "Moderate";
    if (value === "advanced" || value === "sce") return "Advanced";
    return "";
}

function getFilteredQuestions(category, difficulty) {
    const pool = category === "all"
        ? [...questions]
        : questions.filter(function(q) { return (q.category || "General") === category; });

    if (!difficulty || difficulty === "all") return pool;
    return pool.filter(function(q) { return normalizeDifficulty(q) === difficulty; });
}

function getQuestionImages(q) {
    if (!q) return [];
    if (Array.isArray(q.images)) return q.images.filter(Boolean);
    if (q.image) return [q.image];
    return [];
}

function formatTime(totalSeconds) {
    const seconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
    return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}

function updateTimer() {
    if (!testStartedAt || completedTest) return;
    elapsedSeconds = Math.max(0, Math.floor((Date.now() - testStartedAt) / 1000));
}

function startTimer(startAt) {
    stopTimer();
    testStartedAt = Number(startAt) || Date.now();
    updateTimer();
    timerInterval = setInterval(updateTimer, 1000);
}

function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
}

function stopQuestionTimer() {
    if (questionTimerInterval) clearInterval(questionTimerInterval);
    questionTimerInterval = null;
}

function ensureQuestionDeadline(index) {
    if (questionDeadlines[index]) return;
    questionDeadlines[index] = Date.now() + (QUESTION_TIME_LIMIT * 1000);
}

function getQuestionRemainingSeconds(index) {
    if (userAnswers[index] !== undefined || timedOutQuestions[index]) return 0;
    ensureQuestionDeadline(index);
    return Math.max(0, Math.ceil((questionDeadlines[index] - Date.now()) / 1000));
}

function updateQuestionTimer() {
    if (completedTest || !quizQuestions.length) return;
    if (userAnswers[currentQuestion] !== undefined || timedOutQuestions[currentQuestion]) {
        if (timerDisplay) timerDisplay.textContent = "Time —";
        stopQuestionTimer();
        return;
    }

    ensureQuestionDeadline(currentQuestion);
    const remaining = getQuestionRemainingSeconds(currentQuestion);
    if (timerDisplay) timerDisplay.textContent = "Time left " + formatTime(remaining);

    if (remaining <= 0) {
        handleQuestionTimeout();
    }
}

function startQuestionTimer() {
    stopQuestionTimer();
    if (completedTest || !quizQuestions.length || userAnswers[currentQuestion] !== undefined || timedOutQuestions[currentQuestion]) {
        updateQuestionTimer();
        return;
    }
    ensureQuestionDeadline(currentQuestion);
    updateQuestionTimer();
    questionTimerInterval = setInterval(updateQuestionTimer, 250);
}

function handleQuestionTimeout() {
    if (completedTest || !quizQuestions.length || userAnswers[currentQuestion] !== undefined || timedOutQuestions[currentQuestion]) return;
    stopQuestionTimer();
    timedOutQuestions[currentQuestion] = true;
    answered = false;
    result.textContent = "Time expired. This question is unanswered.";
    explanation.textContent = "";
    document.querySelectorAll('input[name="answer"]').forEach(function(radio) {
        radio.checked = false;
        radio.disabled = true;
    });
    updateQuestionNavigator();
    saveProgress();

    const nextIndex = currentQuestion + 1;
    if (nextIndex < quizQuestions.length) {
        setTimeout(function() {
            if (!completedTest && currentQuestion === nextIndex - 1 && timedOutQuestions[currentQuestion]) {
                navigateToQuestion(nextIndex);
            }
        }, 350);
    } else {
        setTimeout(function() {
            if (!completedTest && timedOutQuestions[currentQuestion]) finishTestNow();
        }, 350);
    }
}

function saveProgress() {
    if (!quizQuestions.length || completedTest) return;
    const progress = {
        version: QUESTION_BANK_VERSION,
        category: currentTestCategory,
        difficulty: selectedDifficulty,
        questionCount: quizQuestions.length,
        order: quizQuestions.map(function(q) { return q.id; }),
        currentQuestion: currentQuestion,
        userAnswers: userAnswers,
        flaggedQuestions: flaggedQuestions,
        timedOutQuestions: timedOutQuestions,
        questionDeadlines: questionDeadlines,
        score: score,
        startedAt: testStartedAt
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function clearSavedProgress() {
    localStorage.removeItem(STORAGE_KEY);
}

// Shows the live-quiz layout and hides the start/results/review sections.
// Shared by startNewQuiz() (fresh test) and restoreProgress() (resumed test)
// so both paths stay visually identical.
function showQuizUI() {
    quizLayout.style.display = "grid";
    resultsSummary.style.display = "none";
    reviewContainer.style.display = "none";
    reviewContainer.innerHTML = "";

    quizContainer.style.display = "block";
    document.getElementById("questionNavigator").style.display = "flex";
    document.getElementById("navigatorLegend").style.display = "flex";
    document.getElementById("navigatorHeader").style.display = "flex";
    document.getElementById("subject").style.display = "block";
    document.getElementById("progress").style.display = "block";
    document.getElementById("progressContainer").style.display = "block";
    document.getElementById("questionNumber").style.display = "block";
    document.getElementById("question").style.display = "block";
    document.getElementById("questionActions").style.display = "flex";
    scoreDisplay.style.display = "block";
    finishButton.style.display = "inline-flex";
    result.style.display = isQuestionBankMode ? "block" : "none";
    explanation.style.display = isQuestionBankMode ? "block" : "none";
    if (dashboardButton) dashboardButton.style.display = "none";
    if (timerDisplay) timerDisplay.style.display = isQuestionBankMode ? "none" : "inline-flex";
    const bankStats = document.getElementById("bankStats");
    const exposureInfo = document.getElementById("questionExposureInfo");
    if (bankStats) bankStats.style.display = isQuestionBankMode ? "flex" : "none";
    if (exposureInfo) exposureInfo.style.display = isQuestionBankMode ? "block" : "none";
    if (isQuestionBankMode) {
        finishButton.textContent = "End of session";
        const confirmButton = document.getElementById("confirmFinishButton");
        const modalTitle = document.querySelector("#finishModalBox h2");
        if (modalTitle) modalTitle.textContent = "End session?";
        if (confirmButton) confirmButton.textContent = "End of session";
    } else {
        finishButton.textContent = "Finish test";
        const confirmButton = document.getElementById("confirmFinishButton");
        const modalTitle = document.querySelector("#finishModalBox h2");
        if (modalTitle) modalTitle.textContent = "Finish test?";
        if (confirmButton) confirmButton.textContent = "Finish test";
    }

    result.textContent = "";
    explanation.textContent = "";
}

function startNewQuiz(category, requestedCount, difficulty, startedAt) {
    const availableQuestions = getFilteredQuestions(category, difficulty || "all");
    const count = Math.min(Number(requestedCount) || availableQuestions.length, availableQuestions.length);
    if (!availableQuestions.length || count <= 0) return;

    showQuizUI();

    quizQuestions = shuffleArray(availableQuestions).slice(0, count);
    currentQuestion = 0;
    currentQuestionPage = 0;
    score = 0;
    answered = false;
    userAnswers = [];
    flaggedQuestions = [];
    timedOutQuestions = [];
    questionDeadlines = [];
    question = quizQuestions[0];
    selectedDifficulty = difficulty || "all";
    currentTestCategory = category || "all";
    completedTest = false;
    elapsedSeconds = 0;
    if (isQuestionBankMode) window._questionBankSeenThisSession = new Set();

    scoreDisplay.textContent = "Score: 0";
    if (timerDisplay) timerDisplay.textContent = "Time left 01:20";

    if (isQuestionBankMode) {
        testStartedAt = startedAt || Date.now();
        elapsedSeconds = 0;
        stopTimer();
    } else {
        startTimer(startedAt || Date.now());
    }
    resetAnswerControls();
    createQuestionNavigator();
    displayQuestion();
    updateImagesButton();
    saveProgress();
}

// Rebuilds an in-progress test from localStorage (STORAGE_KEY) after a
// refresh, accidental back-navigation, or a closed tab. Returns true if a
// valid saved test was found and restored, false otherwise (caller should
// fall back to the normal Start Test flow).
function restoreProgress() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;

    let progress;
    try {
        progress = JSON.parse(raw);
    } catch (error) {
        clearSavedProgress();
        return false;
    }

    if (!progress || progress.version !== QUESTION_BANK_VERSION ||
        !Array.isArray(progress.order) || !progress.order.length) {
        clearSavedProgress();
        return false;
    }

    // Rebuild the exact saved question set/order. If the question bank has
    // changed since this test started (a question was removed or the file
    // was edited), some ids won't resolve — in that case discard the saved
    // test rather than showing gaps or crashing.
    const questionMap = new Map(questions.map(function(q) { return [q.id, q]; }));
    const restoredQuestions = progress.order.map(function(id) { return questionMap.get(id); });
    if (restoredQuestions.some(function(q) { return !q; })) {
        clearSavedProgress();
        return false;
    }

    showQuizUI();

    quizQuestions = restoredQuestions;
    score = Number(progress.score) || 0;
    userAnswers = Array.isArray(progress.userAnswers) ? progress.userAnswers : [];
    flaggedQuestions = Array.isArray(progress.flaggedQuestions) ? progress.flaggedQuestions : [];
    timedOutQuestions = Array.isArray(progress.timedOutQuestions) ? progress.timedOutQuestions : [];
    questionDeadlines = Array.isArray(progress.questionDeadlines) ? progress.questionDeadlines : [];
    selectedDifficulty = progress.difficulty || "all";
    currentTestCategory = progress.category || "all";
    completedTest = false;

    const restoredIndex = Math.min(
        Math.max(Number(progress.currentQuestion) || 0, 0),
        quizQuestions.length - 1
    );

    scoreDisplay.textContent = "Score: " + score;
    if (isQuestionBankMode) {
        testStartedAt = Number(progress.startedAt) || Date.now();
        elapsedSeconds = 0;
        stopTimer();
    } else {
        startTimer(progress.startedAt || Date.now());
    }
    createQuestionNavigator();
    navigateToQuestion(restoredIndex);

    return true;
}

function resetAnswerControls() {
    document.querySelectorAll('input[name="answer"]').forEach(function(radio) {
        radio.checked = false;
        radio.disabled = !!timedOutQuestions[currentQuestion];
        const label = document.querySelector('label[for="' + radio.id + '"]');
        if (label) {
            label.classList.remove("correctAnswer", "wrongAnswer");
        }
    });
    flagButton.textContent = flaggedQuestions[currentQuestion] ? "⚑  Flagged" : "⚑  Flag for review";
    flagButton.classList.toggle("flagged", !!flaggedQuestions[currentQuestion]);
}

function createQuestionNavigator() {
    const navigator = document.getElementById("questionNavigator");
    navigator.innerHTML = "";

    const previousPageButton = document.createElement("button");
    previousPageButton.type = "button";
    previousPageButton.textContent = "‹";
    previousPageButton.className = "navigatorArrow";
    previousPageButton.id = "navigatorPrevious";
    previousPageButton.setAttribute("aria-label", "Previous questions");

    const questionNumbers = document.createElement("div");
    questionNumbers.id = "questionNumbers";

    const nextPageButton = document.createElement("button");
    nextPageButton.type = "button";
    nextPageButton.textContent = "›";
    nextPageButton.className = "navigatorArrow";
    nextPageButton.id = "navigatorNext";
    nextPageButton.setAttribute("aria-label", "Next questions");

    navigator.append(previousPageButton, questionNumbers, nextPageButton);

    previousPageButton.addEventListener("click", function() {
        if (currentQuestionPage > 0) {
            currentQuestionPage--;
            updateQuestionNavigator();
        }
    });
    nextPageButton.addEventListener("click", function() {
        const totalPages = Math.ceil(quizQuestions.length / questionsPerPage);
        if (currentQuestionPage < totalPages - 1) {
            currentQuestionPage++;
            updateQuestionNavigator();
        }
    });
    updateQuestionNavigator();
}

function navigateToQuestion(index) {
    if (index < 0 || index >= quizQuestions.length) return;
    currentQuestion = index;
    question = quizQuestions[currentQuestion];
    answered = userAnswers[currentQuestion] !== undefined;
    resetAnswerControls();
    result.textContent = "";
    explanation.textContent = "";

    const savedAnswer = userAnswers[currentQuestion];
    if (savedAnswer !== undefined) {
        const radio = document.querySelector('input[name="answer"][value="' + savedAnswer + '"]');
        if (radio) radio.checked = true;
        if (isQuestionBankMode) showPreviousResult();
    } else if (timedOutQuestions[currentQuestion] && !isQuestionBankMode) {
        answered = false;
        result.textContent = "Time expired. This question is unanswered.";
        explanation.textContent = "";
    }
    displayQuestion();
    updateImagesButton();
    saveProgress();
}

function updateQuestionNavigator() {
    const questionNumbers = document.getElementById("questionNumbers");
    if (!questionNumbers) return;
    questionNumbers.innerHTML = "";

    const startIndex = currentQuestionPage * questionsPerPage;
    const endIndex = Math.min(startIndex + questionsPerPage, quizQuestions.length);

    for (let i = startIndex; i < endIndex; i++) {
        const navButton = document.createElement("button");
        navButton.type = "button";
        navButton.textContent = i + 1;
        navButton.className = "questionNumberButton";
        navButton.setAttribute("aria-label", "Go to question " + (i + 1));

        if (i === currentQuestion) navButton.classList.add("currentQuestion");
        else if (userAnswers[i] !== undefined) {
            navButton.classList.add(userAnswers[i] === quizQuestions[i].correctAnswer ? "correctQuestion" : "wrongQuestion");
        }
        if (flaggedQuestions[i]) navButton.classList.add("flaggedQuestion");
        if (getQuestionImages(quizQuestions[i]).length) navButton.classList.add("hasImages");

        navButton.addEventListener("click", function() { navigateToQuestion(i); });
        questionNumbers.appendChild(navButton);
    }

    const totalPages = Math.ceil(quizQuestions.length / questionsPerPage);
    const previousPageButton = document.getElementById("navigatorPrevious");
    const nextPageButton = document.getElementById("navigatorNext");
    if (previousPageButton) previousPageButton.disabled = currentQuestionPage === 0;
    if (nextPageButton) nextPageButton.disabled = currentQuestionPage >= totalPages - 1;

    const range = document.getElementById("navigatorRange");
    if (range && quizQuestions.length) range.textContent = (startIndex + 1) + "–" + endIndex + " of " + quizQuestions.length;
}

function displayQuestion() {
    currentQuestionPage = Math.floor(currentQuestion / questionsPerPage);
    document.getElementById("progress").textContent = "Question " + (currentQuestion + 1) + " of " + quizQuestions.length;
    document.getElementById("progressBar").style.width = (((currentQuestion + 1) / quizQuestions.length) * 100) + "%";
    document.getElementById("questionNumber").textContent = "Question " + (currentQuestion + 1) + ":";
    document.getElementById("subject").textContent = question.subject || question.category || "Neurology";
    document.getElementById("question").textContent = question.questionText;
    document.getElementById("labelAText").textContent = question.optionA;
    document.getElementById("labelBText").textContent = question.optionB;
    document.getElementById("labelCText").textContent = question.optionC;
    document.getElementById("labelDText").textContent = question.optionD;
    nextButton.disabled = currentQuestion === quizQuestions.length - 1;
    previousButton.disabled = currentQuestion === 0;
    flagButton.textContent = flaggedQuestions[currentQuestion] ? "⚑  Flagged" : "⚑  Flag for review";
    flagButton.classList.toggle("flagged", !!flaggedQuestions[currentQuestion]);
    updateQuestionNavigator();
    updateImagesButton();
    if (isQuestionBankMode) {
        updateQuestionBankStats();
        recordQuestionExposure(question);
        updateQuestionBankStats();
        updateExposureInfo();
    } else {
        startQuestionTimer();
    }
}

function getQuestionStats() {
    if (!isQuestionBankMode) return {};
    const key = QUESTION_STATS_KEY + "_" + String(_account.userId || "default");
    try {
        const raw = localStorage.getItem(key);
        const parsed = raw ? JSON.parse(raw) : {};
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch (error) {
        return {};
    }
}

function saveQuestionStats(stats) {
    if (!isQuestionBankMode) return;
    const key = QUESTION_STATS_KEY + "_" + String(_account.userId || "default");
    try { localStorage.setItem(key, JSON.stringify(stats)); } catch (error) {}
}

function recordQuestionExposure(q) {
    if (!isQuestionBankMode || !q) return;
    if (!window._questionBankSeenThisSession) window._questionBankSeenThisSession = new Set();
    if (window._questionBankSeenThisSession.has(q.id)) return;
    const stats = getQuestionStats();
    const entry = stats[q.id] || { seen: 0, correct: 0, incorrect: 0 };
    entry.seen = (Number(entry.seen) || 0) + 1;
    entry.correct = Number(entry.correct) || 0;
    entry.incorrect = Number(entry.incorrect) || 0;
    stats[q.id] = entry;
    saveQuestionStats(stats);
    window._questionBankSeenThisSession.add(q.id);
}

function updateQuestionBankStats() {
    const bankStats = document.getElementById("bankStats");
    if (!bankStats || !isQuestionBankMode) return;
    let correct = 0, incorrect = 0;
    quizQuestions.forEach(function(q, i) {
        if (userAnswers[i] === undefined) return;
        if (userAnswers[i] === q.correctAnswer) correct++;
        else incorrect++;
    });
    document.getElementById("bankCorrectCount").textContent = correct;
    document.getElementById("bankIncorrectCount").textContent = incorrect;
}

function updateExposureInfo() {
    const el = document.getElementById("questionExposureInfo");
    if (!el || !isQuestionBankMode || !question) return;
    const stats = getQuestionStats();
    const entry = stats[question.id] || { seen: 0, correct: 0, incorrect: 0 };
    const seen = Number(entry.seen) || 0;
    const correct = Number(entry.correct) || 0;
    if (seen <= 1) {
        el.textContent = "New";
        el.className = "questionExposureInfo newQuestion";
    } else {
        el.textContent = "Repeat — Seen " + seen + " times | Correct " + correct + " times";
        el.className = "questionExposureInfo repeatQuestion";
    }
}

function showPreviousResult() {
    const previousAnswer = userAnswers[currentQuestion];
    if (previousAnswer === undefined) return;
    answered = true;
    stopQuestionTimer();

    document.querySelectorAll('input[name="answer"]').forEach(function(option) {
        const label = document.querySelector('label[for="' + option.id + '"]');
        if (!label) return;
        label.classList.remove("correctAnswer", "wrongAnswer");
        if (option.value === quizQuestions[currentQuestion].correctAnswer) label.classList.add("correctAnswer");
        if (option.value === previousAnswer && option.value !== quizQuestions[currentQuestion].correctAnswer) label.classList.add("wrongAnswer");
    });

    if (previousAnswer === quizQuestions[currentQuestion].correctAnswer) {
        result.textContent = "Correct.";
        explanation.textContent = quizQuestions[currentQuestion].explanation;
    } else {
        result.textContent = "Incorrect.";
        explanation.textContent = "The correct answer is " + quizQuestions[currentQuestion].correctAnswer + ". " + quizQuestions[currentQuestion].explanation;
    }
    document.querySelectorAll('input[name="answer"]').forEach(function(radio) { radio.disabled = true; });
}

function showAnswerFeedback(selectedAnswer) {
    document.querySelectorAll('input[name="answer"]').forEach(function(option) {
        const label = document.querySelector('label[for="' + option.id + '"]');
        if (!label) return;
        label.classList.remove("correctAnswer", "wrongAnswer");
        if (option.value === quizQuestions[currentQuestion].correctAnswer) label.classList.add("correctAnswer");
        if (option.value === selectedAnswer.value && option.value !== quizQuestions[currentQuestion].correctAnswer) label.classList.add("wrongAnswer");
    });
}

flagButton.addEventListener("click", function() {
    flaggedQuestions[currentQuestion] = !flaggedQuestions[currentQuestion];
    flagButton.textContent = flaggedQuestions[currentQuestion] ? "⚑  Flagged" : "⚑  Flag for review";
    flagButton.classList.toggle("flagged", !!flaggedQuestions[currentQuestion]);
    updateQuestionNavigator();
    saveProgress();
});

previousButton.addEventListener("click", function() {
    if (currentQuestion > 0) navigateToQuestion(currentQuestion - 1);
});

nextButton.addEventListener("click", function() {
    if (currentQuestion < quizQuestions.length - 1) navigateToQuestion(currentQuestion + 1);
});

submitButton.addEventListener("click", function() {
    const selectedAnswer = document.querySelector('input[name="answer"]:checked');
    if (answered) return;
    if (!selectedAnswer) {
        result.textContent = "Please select an answer.";
        return;
    }

    userAnswers[currentQuestion] = selectedAnswer.value;
    answered = true;
    if (!isQuestionBankMode) stopQuestionTimer();
    showAnswerFeedback(selectedAnswer);
    updateQuestionNavigator();
    document.querySelectorAll('input[name="answer"]').forEach(function(radio) { radio.disabled = true; });

    const isCorrect = selectedAnswer.value === quizQuestions[currentQuestion].correctAnswer;
    if (isCorrect) {
        score++;
        scoreDisplay.textContent = "Score: " + score;
        result.textContent = "Correct.";
        explanation.textContent = quizQuestions[currentQuestion].explanation || "";
    } else {
        result.textContent = "Incorrect.";
        explanation.textContent = "The correct answer is " + quizQuestions[currentQuestion].correctAnswer + ". " + (quizQuestions[currentQuestion].explanation || "");
    }

    if (isQuestionBankMode) {
        const stats = getQuestionStats();
        const entry = stats[quizQuestions[currentQuestion].id] || { seen: 1, correct: 0, incorrect: 0 };
        entry.seen = Math.max(1, Number(entry.seen) || 1);
        entry.correct = Number(entry.correct) || 0;
        entry.incorrect = Number(entry.incorrect) || 0;
        if (isCorrect) entry.correct++; else entry.incorrect++;
        stats[quizQuestions[currentQuestion].id] = entry;
        saveQuestionStats(stats);
        updateQuestionBankStats();
        updateExposureInfo();
        saveProgress();
        return;
    }

    saveProgress();

    // Start Test: record the answer and automatically advance.
    setTimeout(function() {
        if (completedTest) return;
        if (currentQuestion < quizQuestions.length - 1) {
            navigateToQuestion(currentQuestion + 1);
        } else {
            finishTestNow();
        }
    }, 300);
});

function calculateResults() {
    let correct = 0;
    let unanswered = 0;
    quizQuestions.forEach(function(q, i) {
        if (userAnswers[i] === undefined) unanswered++;
        else if (userAnswers[i] === q.correctAnswer) correct++;
    });
    return { correct, unanswered, incorrect: quizQuestions.length - correct - unanswered };
}

function saveTestSession(results) {
    try {
        const history = JSON.parse(localStorage.getItem(TEST_HISTORY_KEY) || "[]");
        history.unshift({
            id: "test_" + Date.now(),
            userId: _account.userId,
            fullName: _account.fullName,
            category: currentTestCategory || "all",
            difficulty: selectedDifficulty || "all",
            questionCount: quizQuestions.length,
            score: results.correct,
            percentage: results.percentage,
            correct: results.correct,
            incorrect: results.incorrect,
            unanswered: results.unanswered,
            timeTakenSeconds: elapsedSeconds,
            startedAt: testStartedAt ? new Date(testStartedAt).toISOString() : null,
            completedAt: new Date().toISOString(),
            questionIds: quizQuestions.map(function(q) { return q.id; }),
            userAnswers: [...userAnswers],
            flaggedQuestions: [...flaggedQuestions]
        });
        localStorage.setItem(TEST_HISTORY_KEY, JSON.stringify(history.slice(0, 100)));
    } catch (error) {
        // History should never prevent a test from being completed.
    }
}

function showResultsSummary() {
    const stats = calculateResults();
    const percentage = quizQuestions.length ? Math.round((stats.correct / quizQuestions.length) * 100) : 0;
    document.getElementById("finalPercentage").textContent = percentage + "%";
    document.getElementById("scoreCircle").style.setProperty("--percentage", percentage + "%");
    document.getElementById("finalScoreLine").textContent = stats.correct + " / " + quizQuestions.length;
    document.getElementById("correctCount").textContent = stats.correct;
    document.getElementById("incorrectCount").textContent = stats.incorrect;
    document.getElementById("unansweredCount").textContent = stats.unanswered;
    document.getElementById("timeTaken").textContent = "Time taken: " + formatTime(elapsedSeconds);
    const resultsHeading = document.querySelector("#resultsSummary .resultsHeading");
    if (resultsHeading) resultsHeading.textContent = isQuestionBankMode ? "Session completed" : "Test completed";
    resultsSummary.style.display = "block";
    reviewButton.style.display = isQuestionBankMode ? "none" : "inline-flex";
    document.getElementById("timeTaken").style.display = isQuestionBankMode ? "none" : "block";
    return { ...stats, percentage };
}

finishButton.addEventListener("click", function() {
    let unansweredCount = 0;
    let flaggedCount = 0;
    for (let i = 0; i < quizQuestions.length; i++) {
        if (userAnswers[i] === undefined) unansweredCount++;
        if (flaggedQuestions[i]) flaggedCount++;
    }

    let message = "";
    if (unansweredCount > 0) message += "You have " + unansweredCount + " unanswered question" + (unansweredCount > 1 ? "s" : "") + ". ";
    if (flaggedCount > 0 && !isQuestionBankMode) message += "You have " + flaggedCount + " question" + (flaggedCount > 1 ? "s" : "") + " flagged for review. ";
    if (isQuestionBankMode) {
        if (!message) message = "Are you sure you want to end this session?";
        else message += "Are you sure you want to end this session?";
    } else if (!message) message = "Are you sure you want to finish the test?";
    else message += "Are you sure you want to finish?";
    document.querySelector("#finishModalBox p").textContent = message;
    document.getElementById("finishModal").style.display = "flex";
});

document.getElementById("cancelFinishButton").addEventListener("click", function() {
    document.getElementById("finishModal").style.display = "none";
});

function finishTestNow() {
    if (completedTest) return;
    document.getElementById("finishModal").style.display = "none";
    completedTest = true;
    if (!isQuestionBankMode) updateTimer();
    stopTimer();
    stopQuestionTimer();
    const stats = showResultsSummary();

    quizLayout.style.display = "none";
    quizContainer.style.display = "none";
    document.getElementById("subject").style.display = "none";
    document.getElementById("progress").style.display = "none";
    document.getElementById("progressContainer").style.display = "none";
    document.getElementById("questionNavigator").style.display = "none";
    document.getElementById("navigatorHeader").style.display = "none";
    document.getElementById("navigatorLegend").style.display = "none";
    document.getElementById("questionNumber").style.display = "none";
    document.getElementById("question").style.display = "none";
    document.getElementById("questionActions").style.display = "none";
    scoreDisplay.style.display = "none";
    finishButton.style.display = "none";
    result.style.display = "none";
    explanation.style.display = "none";
    if (timerDisplay) timerDisplay.style.display = "none";
    if (dashboardButton) dashboardButton.style.display = "inline-flex";

    if (!isQuestionBankMode) saveTestSession(stats);
    clearSavedProgress();
    localStorage.removeItem("neurologyMCQSessionMode");
}

document.getElementById("confirmFinishButton").addEventListener("click", finishTestNow);

if (dashboardButton) {
    dashboardButton.addEventListener("click", function() {
        window.location.href = "dashboard.html";
    });
}

function buildReview() {
    reviewContainer.innerHTML = "";
    const heading = document.createElement("div");
    heading.className = "reviewTopRow";
    heading.innerHTML = "<div><h2>Review answers</h2><p>Use the question numbers or keyboard arrow keys to move through the review.</p></div>";
    reviewContainer.appendChild(heading);

    const nav = document.createElement("div");
    nav.className = "reviewNavigator";
    nav.setAttribute("aria-label", "Review question status");
    quizQuestions.forEach(function(q, i) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "reviewNavButton";
        b.textContent = i + 1;
        const status = userAnswers[i] === undefined ? "unanswered" : (userAnswers[i] === q.correctAnswer ? "correct" : "incorrect");
        b.classList.add(status);
        b.setAttribute("aria-label", "Question " + (i + 1) + ": " + status);
        b.addEventListener("click", function() { showReviewQuestion(i); });
        nav.appendChild(b);
    });
    reviewContainer.appendChild(nav);

    const card = document.createElement("article");
    card.id = "reviewCard";
    reviewContainer.appendChild(card);

    const controls = document.createElement("div");
    controls.className = "reviewPager";
    controls.innerHTML = '<button type="button" id="reviewPrevious">← Previous Question</button><span id="reviewPosition"></span><button type="button" id="reviewNext">Next Question →</button>';
    reviewContainer.appendChild(controls);

    document.getElementById("reviewPrevious").addEventListener("click", function() { showReviewQuestion(reviewCurrentQuestion - 1); });
    document.getElementById("reviewNext").addEventListener("click", function() { showReviewQuestion(reviewCurrentQuestion + 1); });
    showReviewQuestion(0);
}

function showReviewQuestion(index) {
    if (index < 0 || index >= quizQuestions.length) return;
    reviewCurrentQuestion = index;
    const q = quizQuestions[index];
    const userAnswer = userAnswers[index];
    const status = userAnswer === undefined ? "unanswered" : (userAnswer === q.correctAnswer ? "correct" : "incorrect");
    const statusText = status === "correct" ? "✓ Correct" : status === "incorrect" ? "✕ Incorrect" : "— Not answered";
    const card = document.getElementById("reviewCard");
    if (!card) return;

    const options = ["A", "B", "C", "D"];
    const optionHtml = options.map(function(letter) {
        let cls = "";
        if (letter === q.correctAnswer) cls = "reviewCorrect";
        else if (letter === userAnswer && userAnswer !== q.correctAnswer) cls = "reviewWrong";
        return '<div class="reviewOption ' + cls + '"><span class="reviewOptionTag">' + letter + '</span><span>' + escapeHtml(q["option" + letter]) + '</span></div>';
    }).join("");

    const images = getQuestionImages(q);
    const imageButtonHtml = images.length ? '<button type="button" class="reviewImagesButton" data-review-image="' + index + '">View images' + (images.length > 1 ? " (" + images.length + ")" : "") + '</button>' : "";

    card.innerHTML = '<div class="reviewCardHeader"><div><span class="reviewQuestionLabel">Question ' + (index + 1) + '</span><span class="reviewStatus ' + status + '">' + statusText + '</span></div>' + imageButtonHtml + '</div>' +
        '<div class="reviewSubject">' + escapeHtml(q.subject || q.category || "Neurology") + '</div>' +
        '<div class="reviewStem">' + escapeHtml(q.questionText) + '</div>' +
        '<div class="reviewOptions">' + optionHtml + '</div>' +
        '<div class="reviewAnswerBlock"><div><span>Your answer</span><strong>' + (userAnswer === undefined ? "Not answered" : escapeHtml(userAnswer + " — " + q["option" + userAnswer])) + '</strong></div><div><span>Correct answer</span><strong>' + escapeHtml(q.correctAnswer + " — " + q["option" + q.correctAnswer]) + '</strong></div></div>' +
        '<div class="reviewExplanation"><span>Explanation</span><p>' + escapeHtml(q.explanation) + '</p></div>';

    const imageButton = card.querySelector(".reviewImagesButton");
    if (imageButton) imageButton.addEventListener("click", function() { openImagesForQuestion(index); });

    document.querySelectorAll(".reviewNavButton").forEach(function(button, i) { button.classList.toggle("active", i === index); });
    document.getElementById("reviewPrevious").disabled = index === 0;
    document.getElementById("reviewNext").disabled = index === quizQuestions.length - 1;
    document.getElementById("reviewPosition").textContent = (index + 1) + " of " + quizQuestions.length;
}

reviewButton.addEventListener("click", function() {
    reviewVisible = true;
    reviewButton.style.display = "none";
    reviewContainer.style.display = "block";
    buildReview();
    reviewContainer.scrollIntoView({ behavior: "smooth", block: "start" });
});

function keyboardNavigation(event) {
    const tag = document.activeElement ? document.activeElement.tagName : "";
    if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return;
    if (document.getElementById("imageModal").style.display === "flex") return;
    if (document.getElementById("finishModal").style.display === "flex") return;

    if (reviewVisible && reviewContainer && reviewContainer.style.display !== "none") {
        if (event.key === "ArrowLeft") {
            event.preventDefault();
            showReviewQuestion(reviewCurrentQuestion - 1);
        } else if (event.key === "ArrowRight") {
            event.preventDefault();
            showReviewQuestion(reviewCurrentQuestion + 1);
        }
        return;
    }

    if (!completedTest && quizLayout && quizLayout.style.display !== "none" && quizQuestions.length) {
        if (event.key === "ArrowLeft") {
            event.preventDefault();
            if (currentQuestion > 0) navigateToQuestion(currentQuestion - 1);
        } else if (event.key === "ArrowRight") {
            event.preventDefault();
            if (currentQuestion < quizQuestions.length - 1) navigateToQuestion(currentQuestion + 1);
        }
    }
}
document.addEventListener("keydown", keyboardNavigation);

function updateImagesButton() {
    if (!imagesButton || !question) return;
    const count = getQuestionImages(question).length;
    imagesButton.style.display = count ? "inline-flex" : "none";
    imagesButton.textContent = count > 1 ? "Images (" + count + ")" : "Images";
}

function openImagesForQuestion(questionIndex) {
    const items = getQuestionImages(quizQuestions[questionIndex]);
    if (!items.length) return;
    imageItems = items;
    currentImageIndex = 0;
    imageModal.style.display = "flex";
    imageModalTitle.textContent = items.length > 1 ? "Question " + (questionIndex + 1) + " images" : "Question " + (questionIndex + 1) + " image";
    renderCurrentImage();
    document.getElementById("closeImageButton").focus();
}

function renderCurrentImage() {
    const src = imageItems[currentImageIndex];
    imageStage.innerHTML = "";
    const img = document.createElement("img");
    img.src = src;
    img.alt = "Medical image for question";
    img.addEventListener("error", function() {
        imageStage.innerHTML = '<div class="imageError">Image could not be loaded. Check the image file path in the question bank.</div>';
    });
    imageStage.appendChild(img);
    imageCounter.textContent = imageItems.length > 1 ? (currentImageIndex + 1) + " / " + imageItems.length : "";
    document.getElementById("previousImageButton").disabled = currentImageIndex === 0;
    document.getElementById("nextImageButton").disabled = currentImageIndex === imageItems.length - 1;
}

imagesButton.addEventListener("click", function() { openImagesForQuestion(currentQuestion); });
document.getElementById("closeImageButton").addEventListener("click", function() { imageModal.style.display = "none"; });
document.getElementById("previousImageButton").addEventListener("click", function() { if (currentImageIndex > 0) { currentImageIndex--; renderCurrentImage(); } });
document.getElementById("nextImageButton").addEventListener("click", function() { if (currentImageIndex < imageItems.length - 1) { currentImageIndex++; renderCurrentImage(); } });
imageModal.addEventListener("click", function(event) { if (event.target === imageModal) imageModal.style.display = "none"; });
// Initial state: the real Start Test page (start-test.html) controls test configuration.
if (quizLayout) quizLayout.style.display = "none";
if (resultsSummary) resultsSummary.style.display = "none";
if (reviewButton) reviewButton.style.display = "none";
if (reviewContainer) reviewContainer.style.display = "none";
if (dashboardButton) dashboardButton.style.display = "none";
if (timerDisplay) timerDisplay.style.display = "none";
if (imagesButton) imagesButton.style.display = "none";

// Resume an in-progress test first (refresh / accidental back navigation).
// startNewQuiz() from start-test.html already clears STORAGE_KEY whenever a
// brand-new test is started, so a saved test here always means "the user
// left this one unfinished" — never a stale leftover from a newer request.
const resumed = restoreProgress();

if (!resumed) {
const configKey = isQuestionBankMode ? "neurologyMCQQuestionBankConfig" : "neurologyMCQTestConfig";
const testConfigRaw = localStorage.getItem(configKey);
if (testConfigRaw) {
    try {
        const testConfig = JSON.parse(testConfigRaw);
        if (testConfig && typeof testConfig.category === "string" && Number(testConfig.questionCount) > 0) {
            const pool = getFilteredQuestions(testConfig.category, testConfig.difficulty || "all");
            const count = Math.min(Number(testConfig.questionCount), pool.length);
            if (count > 0) {
                localStorage.removeItem(configKey);
                startNewQuiz(testConfig.category, count, testConfig.difficulty || "all", Date.now());
            } else {
                localStorage.removeItem(configKey);
                window.location.replace(isQuestionBankMode ? "question-bank.html" : "start-test.html");
            }
        } else {
            localStorage.removeItem(configKey);
            window.location.replace(isQuestionBankMode ? "question-bank.html" : "start-test.html");
        }
    } catch (error) {
        localStorage.removeItem(configKey);
        window.location.replace(isQuestionBankMode ? "question-bank.html" : "start-test.html");
    }
} else {
    window.location.replace("start-test.html");
}
}
