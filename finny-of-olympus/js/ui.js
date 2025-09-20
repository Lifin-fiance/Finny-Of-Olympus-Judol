/**
 * This module handles all direct interactions with the DOM,
 * such as updating text content, changing styles, and showing/hiding elements.
 */
import { getString } from './i18n.js';

export const getDOMElements = () => ({
    spinButton: document.getElementById('spin-button'),
    cashoutButton: document.getElementById('cashout-button'),
    slots: [document.getElementById('slot1'), document.getElementById('slot2'), document.getElementById('slot3')],
    creditsDisplay: document.getElementById('credits'),
    spinCountDisplay: document.getElementById('spin-count'),
    winsDisplay: document.getElementById('wins'),
    lossesDisplay: document.getElementById('losses'),
    winLoseMessage: document.getElementById('win-lose-message'),
    oddsDisplay: document.getElementById('odds-display'),
    winOddsPercent: document.getElementById('win-odds-percent'),
    oddsExplanation: document.getElementById('odds-explanation'),
    educationalMessage: document.getElementById('educational-message'),
    payoutsInfo: document.getElementById('payouts-info'),
    houseEarningsDisplay: document.getElementById('house-earnings'),
    phaseModal: document.getElementById('phase-modal'),
    modalTitle: document.getElementById('modal-title'),
    modalBody: document.getElementById('modal-body'),
    modalCloseButton: document.getElementById('modal-close-button'),
    lightningOverlay: document.getElementById('lightning-overlay'),
    // Cashout Modal Elements
    cashoutModal: document.getElementById('cashout-modal'),
    cashoutSummary: document.getElementById('cashout-summary'),
    playAgainButton: document.getElementById('play-again-button'),
    creditsChartCanvas: document.getElementById('credits-chart'),
    // Reality Check Modal Elements
    realityCheckModal: document.getElementById('reality-check-modal'),
    realityCheckBody: document.getElementById('reality-check-body'),
    realityCheckCloseButton: document.getElementById('reality-check-close-button'),
});

let creditsChart = null; 

export const renderCreditsChart = (elements, creditHistory) => {
    const ctx = elements.creditsChartCanvas.getContext('2d');
    
    if (creditsChart) {
        creditsChart.destroy();
    }

    const labels = creditHistory.map((_, index) => `${getString('spins_label')} ${index}`);

    creditsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: getString('credits_label'),
                data: creditHistory,
                borderColor: '#ffd700',
                backgroundColor: 'rgba(255, 215, 0, 0.2)',
                fill: true,
                tension: 0.1,
                pointBackgroundColor: '#ffd700',
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: false, ticks: { color: '#f0e6ff' }, grid: { color: 'rgba(255, 255, 255, 0.1)' }},
                x: { ticks: { color: '#f0e6ff' }, grid: { color: 'rgba(255, 255, 255, 0.1)' }}
            },
            plugins: { legend: { display: false } }
        }
    });
};


export const showModal = (elements, title, body) => {
    elements.modalTitle.textContent = title;
    elements.modalBody.innerHTML = body;
    elements.phaseModal.classList.remove('hidden');
};

export const hideModal = (elements) => {
    elements.phaseModal.classList.add('hidden');
};

export const showRealityCheckModal = (elements, body) => {
    elements.realityCheckBody.innerHTML = body;
    elements.realityCheckModal.classList.remove('hidden');
};

export const hideRealityCheckModal = (elements) => {
    elements.realityCheckModal.classList.add('hidden');
};

export const updateStatsDisplays = (elements, state) => {
    elements.creditsDisplay.textContent = state.credits;
    elements.spinCountDisplay.textContent = state.spinCount;
    elements.winsDisplay.textContent = state.wins;
    elements.lossesDisplay.textContent = state.losses;
    elements.houseEarningsDisplay.textContent = state.houseEarnings;
};

export const updateSpinButtonState = (elements, state, costPerSpin) => {
    const outOfCredits = state.credits < costPerSpin;
    elements.spinButton.disabled = state.isSpinning || outOfCredits;
    elements.cashoutButton.disabled = state.isSpinning;
    
    if (outOfCredits && !state.isSpinning) {
        elements.spinButton.textContent = getString('insufficient_credits');
    } else {
        elements.spinButton.textContent = `${getString('spin_button_text')} (${getString('spin_button_cost')}: ${costPerSpin})`;
    }
};

export const displayPayouts = (elements, payouts) => {
    elements.payoutsInfo.innerHTML = '';
    for (const symbol in payouts) {
        const payoutDiv = document.createElement('div');
        payoutDiv.innerHTML = `<span>${symbol}</span> <span>${payouts[symbol]}</span>`;
        elements.payoutsInfo.appendChild(payoutDiv);
    }
};

export const updateEducationalInfo = (elements, spinCount, odds) => {
    elements.winOddsPercent.textContent = `${Math.round(odds * 100)}%`;
    
    let phaseKey;
    let modalTitleKey;
    let modalBodyKey;

    if (spinCount < 5) {
        phaseKey = 'phase1_explanation';
        elements.oddsDisplay.className = 'stat-box rounded-lg p-4 text-center odds-display-hook';
    } else if (spinCount < 10) {
        phaseKey = 'phase2_explanation';
        elements.oddsDisplay.className = 'stat-box rounded-lg p-4 text-center odds-display-transition';
        if (spinCount === 5) {
            modalTitleKey = 'phase2_modal_title';
            modalBodyKey = 'phase2_modal_body';
        }
    } else {
        phaseKey = 'phase3_explanation';
        elements.oddsDisplay.className = 'stat-box rounded-lg p-4 text-center odds-display-house';
        if (spinCount === 10) {
            modalTitleKey = 'phase3_modal_title';
            modalBodyKey = 'phase3_modal_body';
        }
    }

    elements.oddsExplanation.innerHTML = getString(phaseKey);

    if (modalTitleKey && modalBodyKey) {
        showModal(elements, getString(modalTitleKey), getString(modalBodyKey));
    }
};

export const updateDynamicEducationalMessage = (elements, state) => {
    let messageKey;
    if (state.losses > 3 && state.credits < 500) {
        messageKey = 'dynamic_chasing_losses';
    } else if (state.wins > 5) {
        messageKey = 'dynamic_winning_streak';
    }

    if (messageKey) {
        elements.educationalMessage.innerHTML = getString(messageKey);
    }
};