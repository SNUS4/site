/* ============================================================
   ANTI-CHEAT PROTECTION
============================================================ */
(function() {
    // Disable right-click
    document.addEventListener('contextmenu', e => e.preventDefault());

    // Disable keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        const blocked = [
            e.key === 'F12',
            e.ctrlKey && ['u','U','s','S','a','A','c','C','v','V','x','X','p','P','i','I','j','J'].includes(e.key),
            e.ctrlKey && e.shiftKey,
            e.metaKey && ['u','U','s','S','a','A','c','C','v','V','x','X','p','P','i','I','j','J'].includes(e.key),
        ];
        if (blocked.some(Boolean)) e.preventDefault();
    });

    // Detect DevTools open via window size difference
    setInterval(() => {
        if (window.outerWidth - window.innerWidth > 160 || window.outerHeight - window.innerHeight > 160) {
            document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;font-size:1.3rem;color:#fff;background:#080e1a;">🚫 Закройте инструменты разработчика для продолжения.</div>';
        }
    }, 1000);
})();


/* ============================================================
   STATE
============================================================ */
const TOTAL = 25;
let currentMode = null;   // 'teacher' | 'ai'
let quizQuestions = [];   // selected & shuffled questions
let userAnswers = [];     // index of selected option per question
let submitted = false;

/* ============================================================
   HELPERS
============================================================ */
function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function getScreen(id) { return document.getElementById(id); }

function showScreen(id) {
    ['home-screen', 'quiz-screen', 'result-screen'].forEach(s => {
        const el = getScreen(s);
        el.classList.remove('active');
        el.classList.add('hidden');
    });
    const target = getScreen(id);
    target.classList.remove('hidden');
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ============================================================
   START QUIZ
============================================================ */
function startQuiz(mode) {
    currentMode = mode;
    submitted = false;
    userAnswers = [];

    const pool = mode === 'ai' ? aiQuestionsData : questionsData;
    const valid = pool.filter(q => q.options && q.options.some(o => o.isCorrect));
    const picked = shuffle(valid).slice(0, TOTAL);

    // Shuffle options within each question, keep correct flag
    quizQuestions = picked.map(q => ({
        question: q.question,
        options: shuffle(q.options)
    }));

    userAnswers = new Array(TOTAL).fill(null);

    renderQuiz(mode);
    showScreen('quiz-screen');
}

/* ============================================================
   RENDER QUIZ (all 25 at once)
============================================================ */
function renderQuiz(mode) {
    getScreen('quiz-mode-label').textContent = mode === 'ai' ? 'Тест от ИИ' : 'Тест от учителя';
    updateCounter();

    const list = document.getElementById('questions-list');
    list.innerHTML = '';

    quizQuestions.forEach((q, qi) => {
        const block = document.createElement('div');
        block.className = 'question-block';
        block.id = `qblock-${qi}`;

        const numEl = document.createElement('div');
        numEl.className = 'q-number';
        numEl.textContent = `Вопрос ${qi + 1} / ${TOTAL}`;

        const textEl = document.createElement('div');
        textEl.className = 'q-text';
        textEl.textContent = q.question;

        const optList = document.createElement('div');
        optList.className = 'options-list';

        q.options.forEach((opt, oi) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = opt.text;
            btn.id = `opt-${qi}-${oi}`;
            btn.addEventListener('click', () => selectOption(qi, oi));
            optList.appendChild(btn);
        });

        block.appendChild(numEl);
        block.appendChild(textEl);
        block.appendChild(optList);
        list.appendChild(block);
    });
}

/* ============================================================
   SELECT OPTION
============================================================ */
function selectOption(qi, oi) {
    if (submitted) return;

    const prev = userAnswers[qi];
    userAnswers[qi] = oi;

    // Update UI for this question
    const block = document.getElementById(`qblock-${qi}`);
    const buttons = block.querySelectorAll('.option-btn');

    buttons.forEach((btn, i) => {
        btn.classList.remove('selected');
        if (i === oi) btn.classList.add('selected');
    });

    block.classList.add('answered');
    updateCounter();
}

/* ============================================================
   COUNTER
============================================================ */
function updateCounter() {
    const answered = userAnswers.filter(a => a !== null).length;
    document.getElementById('quiz-answered-counter').textContent = `Отвечено: ${answered} / ${TOTAL}`;
}

/* ============================================================
   SUBMIT QUIZ
============================================================ */
function submitQuiz() {
    const unanswered = userAnswers.filter(a => a === null).length;
    const warning = document.getElementById('submit-warning');

    if (unanswered > 0) {
        warning.classList.remove('hidden');
        warning.textContent = `⚠️ Вы не ответили на ${unanswered} вопрос(а/ов)! Прокрутите вверх и ответьте на все.`;
        // Scroll to first unanswered
        const firstNull = userAnswers.findIndex(a => a === null);
        const el = document.getElementById(`qblock-${firstNull}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    warning.classList.add('hidden');
    submitted = true;

    // Disable all options and mark correct/wrong
    let score = 0;
    quizQuestions.forEach((q, qi) => {
        const block = document.getElementById(`qblock-${qi}`);
        const buttons = block.querySelectorAll('.option-btn');
        const selected = userAnswers[qi];
        const isCorrect = q.options[selected].isCorrect;

        if (isCorrect) { score++; block.classList.add('correct-block'); }
        else            { block.classList.add('wrong-block'); }

        buttons.forEach((btn, oi) => {
            btn.disabled = true;
            if (oi === selected && isCorrect)  btn.classList.add('correct-ans');
            if (oi === selected && !isCorrect) btn.classList.add('wrong-ans');
            if (q.options[oi].isCorrect && oi !== selected) btn.classList.add('correct-ans');
            if (oi !== selected && !q.options[oi].isCorrect) btn.classList.add('dimmed');
        });
    });

    showResults(score);
}

/* ============================================================
   RESULTS
============================================================ */
function showResults(score) {
    const pct = Math.round((score / TOTAL) * 100);

    // Emoji & label
    let emoji, label;
    if (pct >= 90)      { emoji = '🏆'; label = 'Отлично!'; }
    else if (pct >= 70) { emoji = '🎉'; label = 'Хорошо!'; }
    else if (pct >= 50) { emoji = '📖'; label = 'Неплохо, повторите материал'; }
    else                { emoji = '😓'; label = 'Нужно учить материал'; }

    document.getElementById('result-emoji').textContent = emoji;
    document.getElementById('score-big').textContent = score;
    document.getElementById('score-percent').textContent = pct + '%';
    document.getElementById('result-label').textContent = label;

    // Ring animation
    const circumference = 326.73;
    const offset = circumference - (pct / 100) * circumference;
    setTimeout(() => {
        document.getElementById('ring-fill').style.strokeDashoffset = offset;
    }, 300);

    // Review list
    const reviewList = document.getElementById('review-list');
    reviewList.innerHTML = '';
    quizQuestions.forEach((q, qi) => {
        const selected = userAnswers[qi];
        const isCorrect = q.options[selected].isCorrect;
        const correctOpt = q.options.find(o => o.isCorrect);
        const selectedOpt = q.options[selected];

        const item = document.createElement('div');
        item.className = `review-item ${isCorrect ? 'ok' : 'fail'}`;
        item.innerHTML = `
            <div class="review-q">${qi + 1}. ${q.question}</div>
            <div class="review-a">
                ${isCorrect
                    ? `<span class="ok-ans">✓ ${selectedOpt.text}</span>`
                    : `<span class="bad-ans">✗ Ваш ответ: ${selectedOpt.text}</span>&nbsp;&nbsp;
                       <span class="ok-ans">✓ Верно: ${correctOpt.text}</span>`}
            </div>`;
        reviewList.appendChild(item);
    });

    showScreen('result-screen');
}

/* ============================================================
   NAVIGATION
============================================================ */
function goHome() {
    submitted = false;
    quizQuestions = [];
    userAnswers = [];
    showScreen('home-screen');
}

function retryQuiz() {
    startQuiz(currentMode);
}
