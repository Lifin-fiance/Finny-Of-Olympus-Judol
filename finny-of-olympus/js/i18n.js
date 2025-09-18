let translations = {};

/**
 * Sets the language for the site.
 * @param {string} lang - The language code (e.g., 'en', 'id').
 */
export async function setLanguage(lang) {
    await loadTranslations(lang);
    translatePage();
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang; 
}

/**
 * Loads the translation file for the selected language.
 * @param {string} lang - The language code.
 */
async function loadTranslations(lang) {
    try {
        const response = await fetch(`locales/${lang}.json`);
        if (!response.ok) {
            throw new Error(`Could not load translation file for ${lang}.`);
        }
        translations = await response.json();
    } catch (error) {
        console.error(error);
        // Fallback to English if the chosen language fails to load
        if (lang !== 'en') {
            await loadTranslations('en');
        }
    }
}

/**
 * Translates all elements on the page with a data-i18n-key attribute.
 */
export function translatePage() {
    document.querySelectorAll('[data-i18n-key]').forEach(element => {
        const key = element.getAttribute('data-i18n-key');
        const translation = translations[key];
        if (translation) {
            // Use innerHTML to allow for tags like <strong> in the translation
            element.innerHTML = translation;
        }
    });
}

/**
 * Gets a specific string from the loaded translations.
 * @param {string} key - The key of the string to retrieve.
 *p* @param {object} replacements - An object of placeholders to replace in the string.
 * @returns {string} The translated string.
 */
export function getString(key, replacements = {}) {
    let translation = translations[key] || key;
    for (const placeholder in replacements) {
        translation = translation.replace(`{${placeholder}}`, replacements[placeholder]);
    }
    return translation;
}

/**
 * Gets a translated object/array (like quiz data) from the loaded translations.
 * @param {string} key - The key of the object/array to retrieve.
 * @returns {object | Array} The translated data.
 */
export function getTranslatedData(key) {
    return translations[key] || {};
}


/**
 * Initializes the translation system.
 */
export async function initI18n() {
    const savedLang = localStorage.getItem('lang');
    const browserLang = navigator.language.split('-')[0];
    const lang = savedLang || (['en', 'id'].includes(browserLang) ? browserLang : 'en');
    await setLanguage(lang);
}
