Neurology MCQ — medical theme account flow

This package includes:
- Login / Register
- Dashboard
- Start Test with topic selection
- Question counts: 10, 20, 40, 50 (options disable when unavailable)
- Existing MCQ engine with random test selection
- Quiz profile in the header
- Dashboard navigation from Start Test and the completed-test screen
- Finish test wording throughout the test flow
- Review answers after completion
- Restart quiz removed from the completion screen
- Each completed test session's score is saved locally in localStorage under neurologyMCQTestHistory for future score-history display
- Subtle clinical SVG profile icon and EKG/pulse visual identity

Important:
- Keep all files together in the same folder.
- This is a local development/demo authentication system. Production authentication should use a secure backend or authentication provider, HTTPS, server-side password hashing, and appropriate privacy/security controls.
- The current question bank contains 40 questions, so the 50-question button is visible but disabled until the selected topic/all-topics has at least 50 questions. When more questions are added to questions.js, the 50 option will automatically become available.


Recent feature additions
- Start Test now supports topic, difficulty and question-count selection (10/20/40/50). Existing SCE-tagged questions are treated as Advanced for difficulty filtering.
- Quiz includes an elapsed timer and stores time taken with each completed session.
- Review flow starts with a percentage circle, correct/incorrect/unanswered counts and time taken; detailed review opens after Review answers.
- Review navigation supports clickable status buttons and laptop Left/Right Arrow keys.
- Questions can expose one or more medical images through an `images` array (or a single `image` field); the Images button is hidden when none are present. Images open in a centered viewer with close, Esc and multi-image navigation support.
- Dashboard includes a persistent local Subscribe/Subscribed status and Test History.
- Test History stores completed sessions and can open a previous test review when the question IDs are still present in the current question bank.
- Subscription and test history are local browser storage features in this development version; no real payment/subscription service is connected.

Next correction set applied:
- Start Test heading and vertical spacing tightened for laptop visibility.
- Start Test automatically selects all available questions when the chosen topic/difficulty has fewer than 10 questions, while retaining 10/20/40/50 choices for larger pools.
- Submit answer now advances automatically to the next question (or completes the test after the final answer).
- Left/Right Arrow keys now navigate questions during the live test as well as in Review Answers.
- Results summary compacted so Review answers is visible without unnecessary scrolling.
- Review question-number navigator spacing/padding refined for a cleaner, more balanced card layout.


Question Bank session
- Question Bank uses the same questions.js pool as Start Test.
- Selection page uses topic, difficulty and question-count controls matching Start Test.
- Question Bank has no timer. Submit checks the answer without advancing; Next/Previous or Left/Right Arrow navigates.
- The live Question Bank navigator shows current-session correct/incorrect counts and question exposure status (New or Repeat with seen/correct totals).
- End of session opens a summary without a Review answers action.
- Question Bank exposure statistics are stored per signed-in user in local browser storage.

Test History
- Test History has a Clear History button that removes saved completed-test records and the selected history-review pointer.

Question bank content
- The current question bank contains 60 questions: 10 Easy, 10 Moderate and 40 Advanced/SCE.

Review Facts
------------
Review Facts is an independent learning module. Its content is stored in facts.js and is not part of the MCQ question bank or Question Bank exposure statistics. The Review Facts page filters facts by topic and difficulty; it does not ask the user to choose a number of facts.
