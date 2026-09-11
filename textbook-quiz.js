function getChapterMCQSet(bookName, chapterTitle) {
    if (bookName === BRADLEY_BOOK && typeof bradleyChapterMCQs !== "undefined") {
        return bradleyChapterMCQs[chapterTitle] || null;
    }
    if (bookName === DEJONG_BOOK && typeof dejongChapterMCQs !== "undefined") {
        return dejongChapterMCQs[chapterTitle] || null;
    }
    return null;
}

let quizState = null;

function startChapterQuiz(bookName, chapterTitle, questions) {
    quizState = { book: bookName, chapter: chapterTitle, questions: questions, index: 0, score: 0, answered: false };

    document.getElementById("selectionPanel").style.display = "none";
    document.getElementById("intro").style.display = "none";
    document.getElementById("reviewView").style.display = "none";
    document.getElementById("quizView").style.display = "block";
    document.getElementById("quizCompleteBody").style.display = "none";
    document.getElementById("quizBody").style.display = "block";
    document.getElementById("quizHeading").textContent = chapterTitle;

    document.body.classList.add("reviewing-textbook");
    if (typeof updateActiveNavigation === "function") updateActiveNavigation();

    renderQuizQuestion();
}

function renderQuizQuestion() {
    const q = quizState.questions[quizState.index];
    quizState.answered = false;

    document.getElementById("quizProgress").textContent = "Question " + (quizState.index + 1) + " of " + quizState.questions.length;
    document.getElementById("quizScoreLine").textContent = "Score: " + quizState.score + " / " + quizState.questions.length;
    document.getElementById("quizQuestionMeta").textContent = quizState.chapter;
    document.getElementById("quizQuestionText").textContent = q.question;

    const optionsEl = document.getElementById("quizOptions");
    optionsEl.innerHTML = "";
    ["A", "B", "C", "D"].forEach(letter => {
        const text = q["option" + letter];
        if (!text) return;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "quizOption";
        button.innerHTML = '<span class="quizOptionTag">' + letter + '</span><span>' + escapeHtml(text) + '</span>';
        button.addEventListener("click", () => selectQuizAnswer(letter));
        optionsEl.appendChild(button);
    });

    document.getElementById("quizNextButton").style.display = "none";
}

function selectQuizAnswer(letter) {
    if (quizState.answered) return;
    quizState.answered = true;
    const q = quizState.questions[quizState.index];
    if (letter === q.correctAnswer) quizState.score++;

    document.querySelectorAll("#quizOptions .quizOption").forEach(opt => {
        opt.disabled = true;
        const optLetter = opt.querySelector(".quizOptionTag").textContent;
        if (optLetter === q.correctAnswer) opt.classList.add("correct");
        else if (optLetter === letter) opt.classList.add("wrong");
    });

    document.getElementById("quizScoreLine").textContent = "Score: " + quizState.score + " / " + quizState.questions.length;
    const nextButton = document.getElementById("quizNextButton");
    nextButton.textContent = quizState.index === quizState.questions.length - 1 ? "Finish chapter" : "Next question";
    nextButton.style.display = "inline-block";
}

function advanceQuiz() {
    quizState.index++;
    if (quizState.index >= quizState.questions.length) { finishQuiz(); return; }
    renderQuizQuestion();
}

function finishQuiz() {
    document.getElementById("quizBody").style.display = "none";
    document.getElementById("quizCompleteBody").style.display = "block";
    const pct = quizState.questions.length ? Math.round((quizState.score / quizState.questions.length) * 100) : 0;
    document.getElementById("quizCompleteText").textContent =
        quizState.chapter + " — " + quizState.score + " / " + quizState.questions.length + " correct (" + pct + "%)";
    document.getElementById("quizProgress").textContent = "Complete";
}

function exitQuizView() {
    quizState = null;
    document.getElementById("quizView").style.display = "none";
    document.getElementById("reviewView").style.display = "none";
    document.getElementById("selectionPanel").style.display = "block";
    document.getElementById("intro").style.display = "block";
    document.body.classList.remove("reviewing-textbook");
    if (typeof updateActiveNavigation === "function") updateActiveNavigation();
}

document.getElementById("quizNextButton").addEventListener("click", advanceQuiz);
document.getElementById("quizChangeButton").addEventListener("click", exitQuizView);
document.getElementById("quizDashboardButton").addEventListener("click", () => { window.location.href = "dashboard.html"; });
