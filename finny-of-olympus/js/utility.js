/**
 * utility.js
 * * Contains shared functions used across the entire site,
 * such as dynamic component loading, navbar initialization, and sound playback.
 */
import { setLanguage } from './i18n.js';

// --- SOUND FUNCTIONS ---

/**
 * Plays a sound effect.
 * @param {string} soundId - The ID of the <audio> element to play.
 */
export function playSound(soundId) {
    const sound = document.getElementById(soundId);
    if (sound) {
        sound.currentTime = 0; // Rewind to the start
        sound.play().catch(error => console.error(`Audio play failed: ${error}`));
    }
}

/**
 * Stops a sound effect.
 * @param {string} soundId - The ID of the <audio> element to stop.
 */
export function stopSound(soundId) {
    const sound = document.getElementById(soundId);
    if (sound) {
        sound.pause();
        sound.currentTime = 0; // Rewind to the start
    }
}


// --- COMPONENT LOADING ---

/**
 * Fetches HTML content from a file and injects it into a placeholder element.
 * @param {string} url - The URL of the HTML component to fetch.
 * @param {string} placeholderId - The ID of the element to inject the HTML into.
 * @returns {Promise} A promise that resolves when the component is loaded.
 */
export async function loadComponent(url, placeholderId) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Could not load ${url}: ${response.statusText}`);
        }
        const text = await response.text();
        const placeholder = document.getElementById(placeholderId);
        if (placeholder) {
            placeholder.innerHTML = text;
        } else {
            console.error(`Placeholder with ID #${placeholderId} not found.`);
        }
    } catch (error) {
        console.error(`Error loading component: ${error}`);
    }
}

// --- NAVBAR INITIALIZATION ---
/**
 * Attaches event listeners for the mobile navbar and language switcher.
 */
export function initializeNavbar() {
    const hamburgerButton = document.getElementById('hamburger-button');
    const menu = document.getElementById('menu');
    const body = document.body;

    // Mobile menu logic
    if (hamburgerButton && menu) {
        hamburgerButton.addEventListener('click', () => {
            playSound('sound-click'); // Play click sound
            menu.classList.toggle('hidden');
            body.classList.toggle('menu-is-open');
        });

        document.addEventListener('click', (e) => {
            const isMenuOpen = !menu.classList.contains('hidden');
            const isClickInsideMenu = menu.contains(e.target);
            const isClickOnButton = hamburgerButton.contains(e.target);

            if (isMenuOpen && !isClickInsideMenu && !isClickOnButton) {
                menu.classList.add('hidden');
                body.classList.remove('menu-is-open');
            }
        });
    }

    // Language switcher logic
    const langEnButton = document.getElementById('lang-en');
    const langIdButton = document.getElementById('lang-id');

    if (langEnButton && langIdButton) {
        langEnButton.addEventListener('click', () => {
            playSound('sound-click');
            setLanguage('en');
        });
        langIdButton.addEventListener('click', () => {
            playSound('sound-click');
            setLanguage('id');
        });
    }
}