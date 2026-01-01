fetch('question.json')
    .then(res => res.json())
    .then(data => {
        // STRICT filter: python + basic
        if (data.language !== "python" || data.level !== "basic") return;

        const container = document.getElementById('questionsContainer');

        data.questions.forEach((q, index) => {
            const card = document.createElement('div');
            card.className = 'question-card';

            card.innerHTML = `
                <div class="question-title">
                    ${index + 1}. ${q.title}
                </div>
                <div class="question-text">
                    ${q.question}
                </div>
                <button class="show-answer-btn">
                    Show Answer
                </button>

                <div class="answer-box">
                    <span class="close-answer">✖</span>
                    <pre>${q.solution.code}</pre>
                </div>
            `;

            const showBtn = card.querySelector('.show-answer-btn');
            const answerBox = card.querySelector('.answer-box');
            const closeBtn = card.querySelector('.close-answer');

            showBtn.onclick = () => {
                answerBox.style.display = 'block';
                showBtn.style.display = 'none';
            };

            closeBtn.onclick = () => {
                answerBox.style.display = 'none';
                showBtn.style.display = 'inline-block';
            };

            container.appendChild(card);
        });
    })
    .catch(err => console.error(err));
