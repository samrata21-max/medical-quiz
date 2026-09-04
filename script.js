const STORAGE_KEY = "neurologyMCQProgress";
const QUESTION_BANK_VERSION = "v2";
const questionsPerPage = 20;

let quizQuestions = [];
let currentQuestion = 0;
let currentQuestionPage = 0;
let score = 0;
let answered = false;
let userAnswers = [];
let flaggedQuestions = [];
let question = null;

let nextButton = document.getElementById("nextButton");
let previousButton = document.getElementById("previousButton");
let finishButton = document.getElementById("finishButton");
let restartButton = document.getElementById("restartButton");
let quizContainer = document.getElementById("quizContainer");
let flagButton = document.getElementById("flagButton");
let button = document.getElementById("submitButton");
let result = document.getElementById("result");
let explanation = document.getElementById("explanation");
let finalResult = document.getElementById("finalResult");
let scoreDisplay = document.getElementById("score");
let reviewButton = document.getElementById("reviewButton");
let reviewContainer = document.getElementById("reviewContainer");
let categorySelect = document.getElementById("categorySelect");
let startScreen = document.getElementById("startScreen");
let startQuizButton = document.getElementById("startQuizButton");
let questionCount = document.getElementById("questionCount");
let quizLayout = document.getElementById("quizLayout");

function shuffleArray(array) {
    let shuffled = [...array];

    for (let i = shuffled.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
}

function getCategories() {
    return [...new Set(questions.map(function(q) {
        return q.category || "General";
    }))].sort();
}

function populateCategories() {

    getCategories().forEach(function(category) {
        let option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });
}

function getFilteredQuestions(category) {
    if (category === "all") {
        return [...questions];
    }

    return questions.filter(function(q) {
        return (q.category || "General") === category;
    });
}

function saveProgress() {

    if (!quizQuestions.length) {
        return;
    }

    let progress = {
        version: QUESTION_BANK_VERSION,
        category: categorySelect.value,
        order: quizQuestions.map(function(q) { return q.id; }),
        currentQuestion: currentQuestion,
        userAnswers: userAnswers,
        flaggedQuestions: flaggedQuestions,
        score: score
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function clearSavedProgress() {
    localStorage.removeItem(STORAGE_KEY);
}

function restoreProgress() {

    let saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
        return false;
    }

    try {
        let progress = JSON.parse(saved);

        if (progress.version !== QUESTION_BANK_VERSION) {
            clearSavedProgress();
            return false;
        }

        let availableIds = new Set(questions.map(function(q) { return q.id; }));
        let validOrder = Array.isArray(progress.order) &&
            progress.order.length > 0 &&
            progress.order.length === getFilteredQuestions(progress.category).length &&
            progress.order.every(function(id) { return availableIds.has(id); });

        if (!validOrder) {
            clearSavedProgress();
            return false;
        }

        categorySelect.value = progress.category || "all";

        let questionMap = new Map(questions.map(function(q) {
            return [q.id, q];
        }));

        quizQuestions = progress.order.map(function(id) {
            return questionMap.get(id);
        });

        // Make sure the saved order belongs to the selected category.
        let categoryMatches = quizQuestions.every(function(q) {
            return progress.category === "all" ||
                (q.category || "General") === progress.category;
        });

        if (!categoryMatches) {
            clearSavedProgress();
            return false;
        }

        currentQuestion = Math.min(
            Math.max(Number(progress.currentQuestion) || 0, 0),
            quizQuestions.length - 1
        );

        userAnswers = Array.isArray(progress.userAnswers)
            ? progress.userAnswers
            : [];

        flaggedQuestions = Array.isArray(progress.flaggedQuestions)
            ? progress.flaggedQuestions
            : [];

        score = Number(progress.score) || 0;
        question = quizQuestions[currentQuestion];
        answered = userAnswers[currentQuestion] !== undefined;

        return true;

    } catch (error) {
        clearSavedProgress();
        return false;
    }
}

function updateQuestionCount() {

    let category = categorySelect.value;
    let count = getFilteredQuestions(category).length;

    questionCount.textContent =
        count + (count === 1 ? " Question" : " Questions");
}

function startNewQuiz(category) {

        startScreen.style.display = "none";
    quizLayout.style.display = "grid";

    quizQuestions = shuffleArray(getFilteredQuestions(category));

    currentQuestion = 0;
    currentQuestionPage = 0;
    score = 0;
    answered = false;
    userAnswers = [];
    flaggedQuestions = [];
    question = quizQuestions[currentQuestion];

    quizContainer.style.display = "block";
    document.getElementById("questionNavigator").style.display = "flex";
    document.getElementById("navigatorLegend").style.display = "flex";
    document.getElementById("navigatorHeader").style.display = "flex";
    document.getElementById("subject").style.display = "block";
    document.getElementById("progress").style.display = "block";
    document.getElementById("progressContainer").style.display = "block";
    document.getElementById("questionNumber").style.display = "block";
    document.getElementById("question").style.display = "block";

    scoreDisplay.style.display = "block";
    finishButton.style.display = "inline-flex";
    document.getElementById("questionActions").style.display = "flex";
    result.style.display = "block";
    explanation.style.display = "block";

    result.textContent = "";
    explanation.textContent = "";
    finalResult.textContent = "";

    reviewContainer.style.display = "none";
    reviewContainer.innerHTML = "";
    reviewButton.style.display = "none";
    restartButton.style.display = "none";

    scoreDisplay.textContent = "Score: 0";

    resetAnswerControls();
    createQuestionNavigator();
    displayQuestion();
    saveProgress();
}

function resetAnswerControls() {

    let radioButtons = document.querySelectorAll('input[name="answer"]');

    radioButtons.forEach(function(radio) {

        radio.checked = false;
        radio.disabled = false;

        let label = document.querySelector(
            'label[for="' + radio.id + '"]'
        );

        label.classList.remove("correctAnswer");
        label.classList.remove("wrongAnswer");
    });

    flagButton.textContent = flaggedQuestions[currentQuestion]
        ? "⚑  Flagged"
        : "⚑  Flag for review";
    flagButton.classList.toggle("flagged", !!flaggedQuestions[currentQuestion]);
}

function createQuestionNavigator() {

    let navigator = document.getElementById("questionNavigator");

    navigator.innerHTML = "";

    let previousPageButton = document.createElement("button");
    previousPageButton.type = "button";
    previousPageButton.textContent = "‹";
    previousPageButton.classList.add("navigatorArrow");
    previousPageButton.id = "navigatorPrevious";
    previousPageButton.setAttribute("aria-label", "Previous 20 questions");

    let questionNumbers = document.createElement("div");
    questionNumbers.id = "questionNumbers";

    let nextPageButton = document.createElement("button");
    nextPageButton.type = "button";
    nextPageButton.textContent = "›";
    nextPageButton.classList.add("navigatorArrow");
    nextPageButton.id = "navigatorNext";
    nextPageButton.setAttribute("aria-label", "Next 20 questions");

    navigator.appendChild(previousPageButton);
    navigator.appendChild(questionNumbers);
    navigator.appendChild(nextPageButton);

    previousPageButton.addEventListener("click", function() {

        if (currentQuestionPage > 0) {
            currentQuestionPage--;
            updateQuestionNavigator();
        }

    });

    nextPageButton.addEventListener("click", function() {

        let totalPages = Math.ceil(
            quizQuestions.length / questionsPerPage
        );

        if (currentQuestionPage < totalPages - 1) {
            currentQuestionPage++;
            updateQuestionNavigator();
        }

    });

    updateQuestionNavigator();
}

function updateQuestionNavigator() {

    let questionNumbers = document.getElementById("questionNumbers");

    if (!questionNumbers) {
        return;
    }

    questionNumbers.innerHTML = "";

    let startIndex = currentQuestionPage * questionsPerPage;
    let endIndex = Math.min(
        startIndex + questionsPerPage,
        quizQuestions.length
    );

    for (let i = startIndex; i < endIndex; i++) {

        let navButton = document.createElement("button");
        navButton.type = "button";
        navButton.textContent = i + 1;
        navButton.classList.add("questionNumberButton");
        navButton.setAttribute("aria-label", "Go to question " + (i + 1));

        if (i === currentQuestion) {
            navButton.classList.add("currentQuestion");
        } else if (userAnswers[i] !== undefined) {

            if (userAnswers[i] === quizQuestions[i].correctAnswer) {
                navButton.classList.add("correctQuestion");
            } else {
                navButton.classList.add("wrongQuestion");
            }

        }

        if (flaggedQuestions[i]) {
            navButton.classList.add("flaggedQuestion");
        }

        navButton.addEventListener("click", function() {

            currentQuestion = i;
            question = quizQuestions[currentQuestion];
            answered = false;

            resetAnswerControls();

            result.textContent = "";
            explanation.textContent = "";

            if (userAnswers[currentQuestion] !== undefined) {

                let savedAnswer = document.querySelector(
                    'input[name="answer"][value="' +
                    userAnswers[currentQuestion] +
                    '"]'
                );

                if (savedAnswer) {
                    savedAnswer.checked = true;
                }

                showPreviousResult();
            }

            displayQuestion();
            saveProgress();
        });

        questionNumbers.appendChild(navButton);
    }

    let totalPages = Math.ceil(
        quizQuestions.length / questionsPerPage
    );

    let previousPageButton = document.getElementById("navigatorPrevious");
    let nextPageButton = document.getElementById("navigatorNext");

    if (previousPageButton) {
        previousPageButton.disabled = currentQuestionPage === 0;
    }

    if (nextPageButton) {
        nextPageButton.disabled = currentQuestionPage >= totalPages - 1;
    }

    let range = document.getElementById("navigatorRange");

    if (range && quizQuestions.length > 0) {
        range.textContent =
            (startIndex + 1) + "–" + endIndex +
            " of " + quizQuestions.length;
    }
}

function displayQuestion() {

    currentQuestionPage = Math.floor(
        currentQuestion / questionsPerPage
    );

    document.getElementById("progress").textContent =
        "Question " + (currentQuestion + 1) +
        " of " + quizQuestions.length;

    let progressPercentage =
        ((currentQuestion + 1) / quizQuestions.length) * 100;

    document.getElementById("progressBar").style.width =
        progressPercentage + "%";

    document.getElementById("questionNumber").textContent =
        "Question " + (currentQuestion + 1) + ":";

    document.getElementById("subject").textContent =
        question.subject;

    document.getElementById("question").textContent =
        question.questionText;

    document.getElementById("labelAText").textContent = question.optionA;
    document.getElementById("labelBText").textContent = question.optionB;
    document.getElementById("labelCText").textContent = question.optionC;
    document.getElementById("labelDText").textContent = question.optionD;

    nextButton.disabled = currentQuestion === quizQuestions.length - 1;
    previousButton.disabled = currentQuestion === 0;

    flagButton.textContent = flaggedQuestions[currentQuestion]
        ? "⚑  Flagged"
        : "⚑  Flag for review";
    flagButton.classList.toggle("flagged", !!flaggedQuestions[currentQuestion]);

    updateQuestionNavigator();
}

function showPreviousResult() {

    if (userAnswers[currentQuestion] === undefined) {
        return;
    }

    let previousAnswer = userAnswers[currentQuestion];
    answered = true;

    let options = document.querySelectorAll('input[name="answer"]');

    options.forEach(function(option) {

        let label = document.querySelector(
            'label[for="' + option.id + '"]'
        );

        label.classList.remove("correctAnswer");
        label.classList.remove("wrongAnswer");

        if (option.value === quizQuestions[currentQuestion].correctAnswer) {
            label.classList.add("correctAnswer");
        }

        if (
            option.value === previousAnswer &&
            option.value !== quizQuestions[currentQuestion].correctAnswer
        ) {
            label.classList.add("wrongAnswer");
        }
    });

    if (previousAnswer === quizQuestions[currentQuestion].correctAnswer) {
        result.textContent = "Correct.";
        explanation.textContent =
            quizQuestions[currentQuestion].explanation;
    } else {
        result.textContent = "Incorrect.";
        explanation.textContent =
            "The correct answer is " +
            quizQuestions[currentQuestion].correctAnswer + ". " +
            quizQuestions[currentQuestion].explanation;
    }

    options.forEach(function(radio) {
        radio.disabled = true;
    });
}

function showAnswerFeedback(selectedAnswer) {

    let options = document.querySelectorAll('input[name="answer"]');

    options.forEach(function(option) {

        let label = document.querySelector(
            'label[for="' + option.id + '"]'
        );

        label.classList.remove("correctAnswer");
        label.classList.remove("wrongAnswer");

        if (option.value === quizQuestions[currentQuestion].correctAnswer) {
            label.classList.add("correctAnswer");
        }

        if (
            option.value === selectedAnswer.value &&
            option.value !== quizQuestions[currentQuestion].correctAnswer
        ) {
            label.classList.add("wrongAnswer");
        }
    });
}

flagButton.addEventListener("click", function() {

    flaggedQuestions[currentQuestion] = !flaggedQuestions[currentQuestion];

    flagButton.textContent = flaggedQuestions[currentQuestion]
        ? "⚑  Flagged"
        : "⚑  Flag for review";
    flagButton.classList.toggle("flagged", !!flaggedQuestions[currentQuestion]);

    updateQuestionNavigator();
    saveProgress();
});

previousButton.addEventListener("click", function() {

    if (currentQuestion > 0) {

        currentQuestion--;
        question = quizQuestions[currentQuestion];
        answered = false;

        resetAnswerControls();
        result.textContent = "";
        explanation.textContent = "";

        if (userAnswers[currentQuestion] !== undefined) {
            document.querySelector(
                'input[name="answer"][value="' +
                userAnswers[currentQuestion] +
                '"]'
            ).checked = true;

            showPreviousResult();
        }

        displayQuestion();
        saveProgress();
    }
});

nextButton.addEventListener("click", function() {

    if (currentQuestion < quizQuestions.length - 1) {

        currentQuestion++;
        question = quizQuestions[currentQuestion];
        answered = false;

        resetAnswerControls();
        result.textContent = "";
        explanation.textContent = "";

        if (userAnswers[currentQuestion] !== undefined) {
            document.querySelector(
                'input[name="answer"][value="' +
                userAnswers[currentQuestion] +
                '"]'
            ).checked = true;

            showPreviousResult();
        }

        displayQuestion();
        saveProgress();
    }
});

button.addEventListener("click", function() {

    let selectedAnswer = document.querySelector(
        'input[name="answer"]:checked'
    );

    if (answered === true) {
        return;
    }

    if (selectedAnswer === null) {
        result.textContent = "Please select an answer.";
        return;
    }

    let previousAnswer = userAnswers[currentQuestion];
    userAnswers[currentQuestion] = selectedAnswer.value;
    answered = true;

    showAnswerFeedback(selectedAnswer);
    updateQuestionNavigator();

    let radioButtons = document.querySelectorAll('input[name="answer"]');
    radioButtons.forEach(function(radio) {
        radio.disabled = true;
    });

    if (
        selectedAnswer.value ===
        quizQuestions[currentQuestion].correctAnswer
    ) {

        if (previousAnswer === undefined) {
            score++;
        }

        scoreDisplay.textContent = "Score: " + score;
        result.textContent = "Correct.";
        explanation.textContent =
            quizQuestions[currentQuestion].explanation;

    } else {

        result.textContent = "Incorrect.";
        explanation.textContent =
            "The correct answer is " +
            quizQuestions[currentQuestion].correctAnswer + ". " +
            quizQuestions[currentQuestion].explanation;
    }

    saveProgress();
});

finishButton.addEventListener("click", function() {

    let unansweredCount = 0;
    let flaggedCount = 0;

    for (let i = 0; i < quizQuestions.length; i++) {
        if (userAnswers[i] === undefined) unansweredCount++;
        if (flaggedQuestions[i]) flaggedCount++;
    }

    let message = "";

    if (unansweredCount > 0) {
        message +=
            "You have " + unansweredCount +
            " unanswered question" +
            (unansweredCount > 1 ? "s" : "") + ". ";
    }

    if (flaggedCount > 0) {
        message +=
            "You have " + flaggedCount +
            " question" +
            (flaggedCount > 1 ? "s" : "") +
            " flagged for review. ";
    }

    if (message === "") {
        message = "Are you sure you want to finish the quiz?";
    } else {
        message += "Are you sure you want to finish?";
    }

    document.querySelector("#finishModalBox p").textContent = message;
    document.getElementById("finishModal").style.display = "flex";
});

document.getElementById("cancelFinishButton").addEventListener("click", function() {
    document.getElementById("finishModal").style.display = "none";
});

document.getElementById("confirmFinishButton").addEventListener("click", function() {

    document.getElementById("finishModal").style.display = "none";

    let totalQuestions = quizQuestions.length;
    let percentage = totalQuestions > 0
        ? Math.round((score / totalQuestions) * 100)
        : 0;

    finalResult.textContent =
        "Quiz completed. Score: " +
        score + " / " + totalQuestions +
        " (" + percentage + "%)";

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

    reviewButton.style.display = "block";
    reviewContainer.style.display = "none";
    restartButton.style.display = "block";

    clearSavedProgress();
});

reviewButton.addEventListener("click", function() {

    reviewContainer.style.display = "block";
    reviewContainer.innerHTML = "<h2>Review answers</h2>";

    quizQuestions.forEach(function(q, i) {

        let reviewQuestion = document.createElement("div");
        let userAnswer = userAnswers[i];

        let userAnswerText = "Not answered";
        let correctAnswerText = q.correctAnswer + " — " + q["option" + q.correctAnswer];

        if (userAnswer !== undefined) {
            userAnswerText = userAnswer + " — " + q["option" + userAnswer];
        }

        reviewQuestion.innerHTML =
            "<h3>Question " + (i + 1) + "</h3>" +
            "<p><strong>" + q.questionText + "</strong></p>" +
            "<p>A. " + q.optionA + "</p>" +
            "<p>B. " + q.optionB + "</p>" +
            "<p>C. " + q.optionC + "</p>" +
            "<p>D. " + q.optionD + "</p>" +
            "<p><strong>Your answer: " + userAnswerText + "</strong></p>" +
            "<p><strong>Correct answer: " + correctAnswerText + "</strong></p>" +
            "<p><strong>Explanation:</strong><br> " + q.explanation + "</p>";

        reviewContainer.appendChild(reviewQuestion);
    });

    reviewButton.style.display = "none";
});

restartButton.addEventListener("click", function() {

    clearSavedProgress();
    categorySelect.disabled = false;
    startNewQuiz(categorySelect.value);
});

categorySelect.addEventListener("change", function() {

    updateQuestionCount();

});



startQuizButton.addEventListener("click", function() {

    clearSavedProgress();

    startNewQuiz(categorySelect.value);

});

populateCategories();

categorySelect.value = "all";
updateQuestionCount();

/* Initial/start screen state: hide quiz-only header controls. */
document.getElementById("progressContainer").style.display = "none";
scoreDisplay.style.display = "none";
finishButton.style.display = "none";
reviewButton.style.display = "none";
