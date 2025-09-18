import { initI18n, getString, getTranslatedData, translatePage } from './i18n.js';
// ADDED: playSound to the import list
import { loadComponent, initializeNavbar, playSound } from './utility.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initialize i18n
    await initI18n();

    // 2. Load shared components
    await loadComponent('components/navbar.html', 'navbar-container');
    initializeNavbar();
    await loadComponent('components/footer-default.html', 'footer-default');

    // 3. Translate the page, including the new components
    translatePage();
    
    // 4. Start the quiz logic
    initializeQuiz();
});

function initializeQuiz() {
    // --- DOM ELEMENTS ---
    const quizTitle = document.getElementById('quiz-title');
    const quizContainer = document.getElementById('quiz-container');
    const progressContainer = document.getElementById('progress-container');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');

    // --- STATE ---
    let currentQuestions = [];
    let currentQuestionIndex = 0;
    let score = 0;

    function renderCategorySelector() {
        quizTitle.textContent = getString('quiz_choose_category');
        quizContainer.innerHTML = '';
        progressContainer.classList.add('hidden');

        const categoriesGrid = document.createElement('div');
        categoriesGrid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';

        const categories = getTranslatedData('quiz_categories');
        
        for (const key in categories) {
            const categoryButton = document.createElement('button');
            categoryButton.className = 'quiz-option p-6 rounded-lg text-center h-32 flex items-center justify-center font-cinzel font-bold text-xl';
            categoryButton.textContent = categories[key];
            // ADDED: Click sound for selecting a category
            categoryButton.onclick = () => {
                playSound('sound-click');
                startQuiz(key, categories[key]);
            };
            categoriesGrid.appendChild(categoryButton);
        }
        quizContainer.appendChild(categoriesGrid);
    }
    
    function startQuiz(categoryKey, categoryName) {
        currentQuestions = getTranslatedData(`quiz_data_${categoryKey}`);
        currentQuestionIndex = 0;
        score = 0;
        quizTitle.textContent = categoryName;
        progressContainer.classList.remove('hidden');
        renderQuestion();
    }

    function renderQuestion() {
        quizContainer.innerHTML = '';

        const totalQuestions = currentQuestions.length;
        progressBar.style.width = `${((currentQuestionIndex) / totalQuestions) * 100}%`;
        progressText.textContent = getString('quiz_question_progress', { current: currentQuestionIndex + 1, total: totalQuestions });

        if (currentQuestionIndex >= totalQuestions) {
            renderResults();
            return;
        }

        const questionData = currentQuestions[currentQuestionIndex];
        
        const questionBlock = document.createElement('div');
        questionBlock.className = 'question-block mb-8';

        const questionText = document.createElement('p');
        questionText.className = 'text-lg md:text-xl font-bold mb-4 text-center';
        questionText.textContent = questionData.question;

        const optionsGrid = document.createElement('div');
        optionsGrid.className = 'grid grid-cols-1 md:grid-cols-2 gap-4';

        questionData.options.forEach(optionText => {
            const optionButton = document.createElement('button');
            optionButton.className = 'quiz-option p-4 rounded-lg text-left';
            optionButton.textContent = optionText;
            optionButton.onclick = () => handleOptionSelect(optionButton, optionText, questionData);
            optionsGrid.appendChild(optionButton);
        });

        questionBlock.appendChild(questionText);
        questionBlock.appendChild(optionsGrid);
        quizContainer.appendChild(questionBlock);
    }

    function handleOptionSelect(selectedButton, selectedAnswer, questionData) {
        const allOptions = quizContainer.querySelectorAll('.quiz-option');
        let isCorrect = selectedAnswer === questionData.correctAnswer;

        // ADDED: Sound for correct or incorrect answers
        if (isCorrect) {
            score++;
            playSound('sound-win');
        } else {
            playSound('sound-lose');
        }

        allOptions.forEach(button => {
            button.disabled = true;
            if (button.textContent === questionData.correctAnswer) {
                button.classList.add('correct');
            }
        });

        selectedButton.classList.add(isCorrect ? 'correct' : 'incorrect');

        const explanationBox = document.createElement('div');
        explanationBox.className = 'explanation-box mt-4 p-4 rounded-lg';
        explanationBox.innerHTML = `
            <p class="font-bold">${isCorrect ? getString('correct_answer_text') : getString('incorrect_answer_text')}</p>
            <p>${questionData.explanation}</p>
        `;
        quizContainer.querySelector('.question-block').appendChild(explanationBox);

        const nextButton = document.createElement('button');
        nextButton.id = 'next-button';
        nextButton.className = 'spin-button mt-6 w-full py-3 text-xl font-bold rounded-lg';
        const isLastQuestion = currentQuestionIndex === currentQuestions.length - 1;
        nextButton.textContent = getString(isLastQuestion ? 'show_results_button' : 'next_question_button');
        // ADDED: Click sound for the next/results button
        nextButton.onclick = () => {
            playSound('sound-click');
            currentQuestionIndex++;
            renderQuestion();
        };
        quizContainer.appendChild(nextButton);
    }
    
    function renderResults() {
        // ADDED: Sound for showing the final results
        playSound('sound-lightning');
        
        progressBar.style.width = `100%`;
        progressText.textContent = getString('quiz_complete');
        
        const finalScore = (score / currentQuestions.length) * 100;

        quizContainer.innerHTML = `
            <div class="text-center">
                <h3 class="font-cinzel text-2xl md:text-3xl text-yellow-300">${getString('quiz_results_title')}</h3>
                <p class="text-4xl md:text-5xl font-bold my-4">${Math.round(finalScore)}%</p>
                <p class="text-lg">${getString('quiz_results_summary', { score: score, total: currentQuestions.length })}</p>
                <p class="mt-4 opacity-90">${getString('quiz_results_encouragement')}</p>
                <div class="mt-8 space-y-4 md:space-y-0 md:space-x-4">
                    <button id="retry-quiz-button" class="spin-button inline-block px-8 py-3 text-xl font-bold rounded-lg">${getString('quiz_try_another')}</button>
                </div>
            </div>
        `;
        
        // ADDED: Click sound for trying another quiz
        document.getElementById('retry-quiz-button').onclick = () => {
            playSound('sound-click');
            renderCategorySelector();
        };
    }

    renderCategorySelector();
}