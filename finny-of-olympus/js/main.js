/**
 * This is the main script for the Gate of Olympus educational game.
 * It handles game state, logic, and orchestrates UI updates.
 */
import * as ui from './ui.js';
import { loadComponent, initializeNavbar, playSound, stopSound } from './utility.js';
import { initI18n, getString, translatePage } from './i18n.js';

// Variabel untuk menyimpan dialog tutor
let tutorLines = {};

/**
 * Memuat file JSON dialog tutor secara terpisah.
 */
async function loadTutorLines() {
    try {
        const response = await fetch(`locales/fenuz.json`);
        if (!response.ok) {
            throw new Error(`Could not load tutor lines file.`);
        }
        tutorLines = await response.json();
    } catch (error) {
        console.error("Failed to load tutor lines:", error);
        // Fallback dengan beberapa dialog default jika gagal
        tutorLines = { intro: "Halo! Mari kita mulai." };
    }
}

/**
 * Fungsi untuk mendapatkan string dialog dari tutor.
 * @param {string} key - Kunci dari dialog yang diinginkan.
 * @returns {string} Dialog tutor.
 */
function getTutorString(key) {
    return tutorLines[key] || key;
}

// Inisialisasi utama saat DOM dimuat
document.addEventListener('DOMContentLoaded', async () => {
    await initI18n();
    await loadTutorLines();

    const entryOverlay = document.getElementById('entry-overlay');
    const entryButton = document.getElementById('entry-button');
    const introOverlay = document.getElementById('intro-overlay');
    const gameRoot = document.getElementById('game-root');

    entryButton.addEventListener('click', () => {
        entryOverlay.classList.add('hidden');
        introOverlay.classList.remove('hidden');
        playSound('sound-lightning');
        setTimeout(() => {
            introOverlay.classList.add('hidden');
            gameRoot.classList.remove('initially-hidden');
            gameRoot.classList.add('fade-in');
        }, 2500);
    }, { once: true });

    await loadComponent('components/navbar.html', 'navbar-container');
    initializeNavbar();
    await loadComponent('components/footer.html', 'footer-default');
    translatePage();
    initializeGame();
});

/**
 * Mengatur dan menjalankan seluruh logika permainan.
 */
function initializeGame() {
    let tutorBubbleTimeout;

    const elements = {
        ...ui.getDOMElements(),
        tutorBubble: document.getElementById('tutor-bubble'),
        tutorMessage: document.getElementById('tutor-message'),
    };

    function hideTutorMessage() {
        clearTimeout(tutorBubbleTimeout);
        elements.tutorBubble.classList.remove('opacity-100', 'scale-100');
        elements.tutorBubble.classList.add('opacity-0', 'scale-95');
        setTimeout(() => {
            elements.tutorBubble.classList.add('hidden');
        }, 300);
    }

    function showTutorMessage(message, duration = 2000) {
        clearTimeout(tutorBubbleTimeout);
        elements.tutorMessage.textContent = message;
        elements.tutorBubble.classList.remove('hidden', 'opacity-0', 'scale-95');
        
        requestAnimationFrame(() => {
            elements.tutorBubble.classList.add('opacity-100', 'scale-100');
        });

        tutorBubbleTimeout = setTimeout(hideTutorMessage, duration);
    }
    
    elements.tutorBubble.addEventListener('click', hideTutorMessage);

    function updateTutorMessage(state, eventInfo = null) {
        let messageKey = '';
        if (eventInfo) {
            if (eventInfo.isWin) {
                if (eventInfo.winSymbol === '⚡' && state.firstJackpot) {
                    messageKey = 'win_jackpot'; state.firstJackpot = false;
                } else if (['🏛️', '⭐'].includes(eventInfo.winSymbol) && state.firstHighWin) {
                    messageKey = 'win_high'; state.firstHighWin = false;
                } else if (eventInfo.isLdw && state.firstLdw) {
                    messageKey = 'first_ldw'; state.firstLdw = false;
                } else if (!eventInfo.isLdw && state.firstRealWin) {
                    messageKey = 'first_win'; state.firstRealWin = false;
                }
            } else {
                if (state.losses > state.wins && state.spinCount > 5) {
                    const msgs = ['losing_streak1', 'losing_streak2'];
                    messageKey = msgs[Math.floor(Math.random() * msgs.length)];
                }
            }
        } else {
            if (state.spinCount === 14) {
                messageKey = 'final_words';
            } else if (state.credits > 1050 && !state.winningStreakNotified) { 
                messageKey = 'winning_overall'; state.winningStreakNotified = true;
            } else if (state.credits < 950 && state.winningStreakNotified) {
                messageKey = 'losing_overall'; state.winningStreakNotified = false;
            } else if (state.credits < 400 && !state.lowCreditWarning) {
                messageKey = 'low_credits'; state.lowCreditWarning = true;
            }
        }
        if (messageKey) {
            showTutorMessage(getTutorString(messageKey));
        }
    }

    const reelTracks = [
        document.getElementById('reel1-track'),
        document.getElementById('reel2-track'),
        document.getElementById('reel3-track'),
    ];

    const state = {
        credits: 1000, spinCount: 0, wins: 0, losses: 0, isSpinning: false,
        creditHistory: [1000], houseEarnings: 0, startTime: new Date(),
        firstRealWin: true, firstLdw: true, firstJackpot: true, firstHighWin: true,
        lowCreditWarning: false, winningStreakNotified: false,
    };

    const COST_PER_SPIN = 60;
    const MAX_SPINS = 15;
    const SYMBOLS = ['⚡', '🏛️', '⭐', '💎', '🏆', '🔱'];
    
    const PAYOUTS = { 
        '⚡': 120, '🏛️': 90, '⭐': 70, '💎': 60, '🏆': 40, '🔱': 25
    };

    const ALL_REEL_STRIPS = [
        ['⚡', '💎', '🏛️', '🏆', '⭐', '🔱', '💎', '🏆', '🏛️', '⚡', '⭐', '🔱', '�', '🏆', '⚡', '🏛️', '⭐', '🔱', '💎', '🏆', '🏛️', '⭐', '⚡', '🔱'],
        ['💎', '🏆', '🔱', '⭐', '⚡', '🏛️', '🏆', '⭐', '💎', '🔱', '⚡', '🏛️', '💎', '🏆', '⭐', '🔱', '⚡', '🏛️', '⭐', '🏆', '💎', '🔱', '⚡', '🏛️'],
        ['🏆', '⚡', '⭐', '💎', '🔱', '🏛️', '⚡', '💎', '⭐', '🏆', '🔱', '🏛️', '⚡', '🏆', '⭐', '💎', '🔱', '🏛️', '🏆', '⚡', '⭐', '💎', '🔱', '🏛️']
    ];
    let symbolHeight = 0;

    function populateReels() {
        reelTracks.forEach((track, i) => {
            const strip = ALL_REEL_STRIPS[i];
            track.innerHTML = '';
            const repeatedStrip = [...strip, ...strip, ...strip];
            repeatedStrip.forEach(symbol => {
                const symbolDiv = document.createElement('div');
                symbolDiv.className = 'reel-symbol';
                symbolDiv.textContent = symbol;
                track.appendChild(symbolDiv);
            });
        });
        const firstSymbol = reelTracks[0].querySelector('.reel-symbol');
        if (firstSymbol) symbolHeight = firstSymbol.offsetHeight;
    }
    
    const getCurrentWinOdds = () => {
        const spin = state.spinCount;
        if (spin < 5) return 0.90;  // Fase 1 (Putaran 1-5)
        if (spin < 10) return 0.50; // Fase 2 (Putaran 6-10)
        return 0.10;                // Fase 3 (Putaran 11-15)
    };

    const getWinSymbol = () => {
        const rand = Math.random();
        if (rand < 0.60) return '🔱';
        if (rand < 0.85) return '🏆';
        const otherSymbols = ['⚡', '🏛️', '⭐', '💎'];
        return otherSymbols[Math.floor(Math.random() * otherSymbols.length)];
    };
    
    const checkForEndGame = () => {
        const outOfCredits = state.credits < COST_PER_SPIN;
        const reachedMaxSpins = state.spinCount >= MAX_SPINS;
        if (!state.isSpinning && (outOfCredits || reachedMaxSpins)) {
            elements.spinButton.disabled = true;
            elements.cashoutButton.disabled = true;
            let msgKey = outOfCredits ? 'Masa Depan Hilang' : 'Trapped By Luck';
            elements.winLoseMessage.textContent = getString(msgKey);
            elements.winLoseMessage.classList.add('text-red-500');
            setTimeout(() => { window.location.href = 'ending.html'; }, 2500);
        }
    };

    const handleWin = (winSymbol) => {
        const prize = PAYOUTS[winSymbol];
        state.wins++;
        state.credits += prize;
        state.houseEarnings -= prize;
        
        const isLdw = prize <= COST_PER_SPIN;
        if (isLdw) {
            elements.winLoseMessage.innerHTML = `${getString('win_message_loss', { prize })} <br> <span class="ldw-indicator">${getString('loss_disguised_as_win')}</span>`;
            elements.winLoseMessage.classList.add('win-message', 'text-orange-400');
        } else {
            elements.winLoseMessage.textContent = `${getString('win_message_generic')} ${prize}!`;
            elements.winLoseMessage.classList.add('win-message', 'text-green-400');
        }
        updateTutorMessage(state, { isWin: true, isLdw: isLdw, winSymbol: winSymbol });
    };

    const handleLoss = () => {
        state.losses++;
        elements.winLoseMessage.textContent = getString('lose_message');
        elements.winLoseMessage.classList.add('text-red-500');
        updateTutorMessage(state, { isWin: false });
    };

    const handleSpin = () => {
        if (state.isSpinning || state.credits < COST_PER_SPIN) return;
        
        state.isSpinning = true;
        state.spinCount++;

        state.credits -= COST_PER_SPIN;
        state.houseEarnings += COST_PER_SPIN;
        ui.updateStatsDisplays(elements, state);
        ui.updateSpinButtonState(elements, state, COST_PER_SPIN);

        if (state.spinCount > 0 && state.spinCount <= MAX_SPINS) {
            const messageKey = `spin_encourage_${state.spinCount}`;
            showTutorMessage(getTutorString(messageKey));
        }

        playSound('sound-spin');
        elements.winLoseMessage.textContent = '';
        elements.winLoseMessage.classList.remove('text-green-400', 'text-red-500', 'text-orange-400', 'win-message');
        
        reelTracks.forEach(track => {
            track.style.transition = 'none';
            track.style.transform = `translateY(-${Math.random() * 10 * symbolHeight}px)`;
            track.classList.add('spinning');
        });
        
        setTimeout(() => {
            reelTracks.forEach(track => { track.style.transition = 'transform 1s cubic-bezier(0.25, 0.1, 0.25, 1)'; });
        }, 100);

        const currentOdds = getCurrentWinOdds();
        let didWin = Math.random() < currentOdds;
        let winSymbol = null;
        
        if (didWin) {
            if (state.spinCount <= 5) {
                const guaranteedWins = ['🔱', '🏆', '🔱', '💎', '🔱'];
                winSymbol = guaranteedWins[state.spinCount - 1];
            } else {
                winSymbol = getWinSymbol();
            }
        }

        let targetSymbols = [];
        if (didWin) {
            targetSymbols = [winSymbol, winSymbol, winSymbol];
        } else {
            const nearMissSymbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
            let finalSymbol;
            do { finalSymbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]; } while (finalSymbol === nearMissSymbol);
            targetSymbols = [nearMissSymbol, nearMissSymbol, finalSymbol].sort(() => Math.random() - 0.5);
        }

        const stopPositions = [];
        reelTracks.forEach((track, i) => {
            const strip = ALL_REEL_STRIPS[i];
            const targetSymbol = targetSymbols[i];
            const possibleIndexes = strip.map((s, idx) => s === targetSymbol ? idx : -1).filter(idx => idx !== -1);
            const targetIndex = possibleIndexes[Math.floor(Math.random() * possibleIndexes.length)];
            const position = -1 * (targetIndex + strip.length - 1) * symbolHeight;
            stopPositions.push(position);
        });

        const stopDelays = [1500, 2500, 3500];
        reelTracks.forEach((track, index) => {
            setTimeout(() => {
                track.classList.remove('spinning');
                track.style.transform = `translateY(${stopPositions[index]}px)`;
                playSound('sound-click');
                if (index === reelTracks.length - 1) {
                    stopSound('sound-spin');
                    if (didWin) {
                        playSound('sound-win');
                        elements.lightningOverlay.classList.add('active');
                        setTimeout(() => { elements.lightningOverlay.classList.remove('active'); }, 700);
                    } else {
                        playSound('sound-lose');
                    }

                    setTimeout(() => {
                        if (didWin) { handleWin(winSymbol); } else { handleLoss(); }
                        
                        state.isSpinning = false;
                        state.creditHistory.push(state.credits);

                        ui.updateStatsDisplays(elements, state);
                        ui.updateSpinButtonState(elements, state, COST_PER_SPIN);
                        ui.updateDynamicEducationalMessage(elements, state);
                        
                        ui.updateEducationalInfo(elements, state.spinCount, getCurrentWinOdds());
                        
                        // --- FIKSASI BUG MODAL ---
                        // Memeriksa apakah modal fase 3 muncul setelah putaran ke-10
                        // dan memperbaiki teksnya secara manual jika tertulis "20%".
                        if (state.spinCount === 10) {
                            setTimeout(() => {
                                const modalBody = document.getElementById('modal-body');
                                const modalIsVisible = document.getElementById('phase-modal')?.classList.contains('hidden') === false;
                                if (modalBody && modalIsVisible && modalBody.textContent.includes('20%')) {
                                    modalBody.textContent = modalBody.textContent.replace('20%', '10%');
                                }
                            }, 50); 
                        }
                        
                        setTimeout(() => { elements.winLoseMessage.classList.remove('win-message'); }, 1500);
                        
                        checkForEndGame();
                    }, 100);
                }
            }, stopDelays[index]);
        });
    };
    
    const handleCashOut = () => {
        playSound('sound-click');
        const startingCredits = state.creditHistory[0];
        const finalCredits = state.credits;
        const netChange = finalCredits - startingCredits;
        const resultKey = netChange >= 0 ? 'cashout_profit' : 'cashout_loss';
        const resultText = getString(resultKey, { change: Math.abs(netChange) });
        
        elements.cashoutSummary.innerHTML = getString('cashout_summary', {
            start: startingCredits,
            end: finalCredits,
            result: resultText
        });
        ui.renderCreditsChart(elements, state.creditHistory);

        elements.cashoutModal.classList.remove('hidden');
        elements.spinButton.disabled = true;
        elements.cashoutButton.disabled = true;
    };

    const realityCheck = () => {
        const timeDiff = new Date() - state.startTime;
        const minutes = Math.floor(timeDiff / 60000);
        if (minutes < 1) return;
        const netChange = state.credits - 1000;
        const resultKey = netChange >= 0 ? 'cashout_profit' : 'cashout_loss';
        const resultText = getString(resultKey, { change: Math.abs(netChange) });
        const message = getString('reality_check_body', {
            minutes: minutes,
            s: getString('lang') === 'en' ? (minutes === 1 ? '' : 's') : '',
            result: resultText
        });
        ui.showRealityCheckModal(elements, message);
    };

    elements.spinButton.addEventListener('click', handleSpin);
    elements.cashoutButton.addEventListener('click', handleCashOut);
    elements.modalCloseButton.addEventListener('click', () => {
        playSound('sound-click');
        ui.hideModal(elements);
    });
    elements.realityCheckCloseButton.addEventListener('click', () => {
        playSound('sound-click');
        ui.hideRealityCheckModal(elements);
    });
    elements.playAgainButton.addEventListener('click', () => {
        playSound('sound-click');
        location.reload();
    });

    populateReels();
    ui.displayPayouts(elements, PAYOUTS);
    ui.updateStatsDisplays(elements, state);
    ui.updateSpinButtonState(elements, state, COST_PER_SPIN);
    ui.updateEducationalInfo(elements, state.spinCount, getCurrentWinOdds());
    
    setTimeout(() => {
        showTutorMessage(getTutorString('intro'), 5000);
    }, 2000);

    setInterval(realityCheck, 60000);
}
