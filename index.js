/**
 * Moonlit Echoes Theme for SillyTavern
 * A beautiful theme with extensive customization options
 */

// Global settings and constants
import { EXTENSION_NAME, EXTENSION_ID, EXTENSION_FOLDER_PATH, THEME_VERSION } from './src/config/theme-info.js';
export { THEME_VERSION } from './src/config/theme-info.js';

// Import required functions for drag functionality
import { dragElement } from '../../../RossAscends-mods.js';
import { loadMovingUIState } from '../../../power-user.js';
import { t } from '../../../i18n.js';
import { tabMappings, themeCustomSettings } from './src/config/theme-settings.js';
import { settingsKey, getSettings as getExtensionSettings, saveSettings as saveExtensionSettings } from './src/services/settings-service.js';
import { initializeSlashCommands } from './src/services/slash-commands.js';
import { initExtension } from './src/bootstrap/init-extension.js';
import { registerDomReadyHandler } from './src/bootstrap/lifecycle-hooks.js';
import { initControls, toggleSettingsPopout } from './src/ui/controls.js';
import {
    configurePresetManager,
    createPresetManagerUI,
    initPresetManager,
    applyActivePreset,
    loadPreset,
    applyPresetToSettings,
    syncMoonlitPresetsWithThemeList,
} from './src/ui/preset-manager.js';
import { configureSettingsTabs, createTabbedSettingsUI } from './src/ui/settings-tabs.js';
import {
    configureSettingsFactory,
    createCustomSettingsUI,
    createSettingItem,
    updateSettingsUI,
    updateColorPickerUI,
    updateSelectUI,
    addModernCompactStyles,
} from './src/ui/settings-factory.js';
import { applyAllThemeSettings as applyAllThemeSettingsCore } from './src/core/theme-applier.js';
import { createMoonlitDomStateController } from './src/core/dom-state.js';
import { initAvatarInjector, initFormSheldHeightMonitor } from './src/core/observers.js';
import { addThemeButtonsHint } from './src/services/hints.js';
import { integrateWithThemeSelector } from './src/services/theme-selector.js';

// Track if custom chat styles have been added
let customChatStylesAdded = false;
const moonlitDomState = createMoonlitDomStateController();

export function applyAllThemeSettings(contextOverride) {
    return applyAllThemeSettingsCore(settingsKey, themeCustomSettings, contextOverride);
}


/**
 * Initialize UI elements and events for the extension
 * Includes settings panel, chat style, color picker, and sidebar button
 */
export function initExtensionUI() {
    configurePresetManager({
        settingsKey,
        themeVersion: THEME_VERSION,
        t,
        themeCustomSettings,
        applyThemeSetting,
        applyAllThemeSettings,
        updateSettingsUI,
        updateColorPickerUI,
        updateSelectUI,
        updateThemeSelector,
    });

    configureSettingsTabs({
        t,
        tabMappings,
        themeCustomSettings,
        createSettingItem,
        addModernCompactStyles,
    });

    loadSettingsHTML().then(() => {
        renderExtensionSettings();
        initChatDisplaySwitcher();
        initAvatarInjector();

        // Initialize preset manager
        initPresetManager();

        // Apply active preset
        applyActivePreset();

        // Add creator information
        addThemeCreatorInfo();

        // Add modern compact styles
        addModernCompactStyles();

        // Add theme version information
        addThemeVersionInfo();

        // Integrate with theme selector
        integrateWithThemeSelector();

        // Add theme buttons hint
        addThemeButtonsHint();

        // Initialize sidebar button, popout, and message interactions
        initControls({
            settingsKey,
            t,
            dragElement,
            loadMovingUIState,
        });

        // Adds a button to the extensions dropdown menu
        addExtensionMenuButton();

        // Initialize slash commands (only when enabled)
        initializeSlashCommands();

        const context = SillyTavern.getContext();
        const settings = getExtensionSettings(context) || {};
        applyRawCustomCss(settings.rawCustomCss || '');
    });

}

/**
 * Adds a button to the Extensions dropdown menu for Moonlit Echoes Theme
 * This function creates a menu item in SillyTavern's Extensions dropdown
 * that opens the theme settings popup when clicked.
 */
function addExtensionMenuButton() {
    // Select the Extensions dropdown menu
    let $extensions_menu = $('#extensionsMenu');
    if (!$extensions_menu.length) {
        return;
    }

    // Create button element with moon icon and theme name
    let $button = $(`
    <div class="list-group-item flex-container flexGap5 interactable" title="Open Moonlit Echoes Theme Settings" data-i18n="[title]Open Moonlit Echoes Theme Settings" tabindex="0">
        <i class="fa-solid fa-moon"></i>
        <span>Moonlit Echoes</span>
    </div>
    `);

    // Append to extensions menu
    $button.appendTo($extensions_menu);

    // Set click handler to toggle the settings popup
    $button.click(() => {
        toggleSettingsPopout();
    });
}

/**
 * Add thumbnail tip
 * Add thumbnail setting tip in the settings panel
 */
function addThumbnailTip(container) {
    // Check if tip already added
    if (document.getElementById('moonlit-thumbnail-tip')) return;

    // Create tip container
    const tipContainer = document.createElement('div');
    tipContainer.id = 'moonlit-thumbnail-tip';
    tipContainer.classList.add('moonlit-tip-container');
    tipContainer.style.borderRadius = '5px';
    tipContainer.style.overflow = 'hidden';

    // Create tip header block
    const tipHeader = document.createElement('div');
    tipHeader.classList.add('moonlit-tip-header');
    tipHeader.style.display = 'flex'; // Add flex display
    tipHeader.style.alignItems = 'center'; // Center align items vertically

    // Add small icon with better alignment
    const tipIcon = document.createElement('i');
    tipIcon.classList.add('fa', 'fa-info-circle');
    tipIcon.style.marginRight = '8px';
    tipIcon.style.display = 'flex'; // Make icon a flex container
    tipIcon.style.alignItems = 'center'; // Align icon content vertically
    tipIcon.style.justifyContent = 'center'; // Center icon content horizontally
    tipIcon.style.width = '16px'; // Fixed width
    tipIcon.style.height = '16px'; // Fixed height

    // Add tip title text
    const tipTitle = document.createElement('span');
    tipTitle.textContent = t`Blurry or thumbnail-sized character images in chat?`;
    tipTitle.style.fontWeight = 'normal';

    // Add small expand icon with consistent sizing
    const toggleIcon = document.createElement('i');
    toggleIcon.classList.add('fa', 'fa-chevron-down');
    toggleIcon.style.marginLeft = 'auto';
    toggleIcon.style.fontSize = '0.85em';
    toggleIcon.style.opacity = '0.8';
    toggleIcon.style.transition = 'transform 0.3s';
    toggleIcon.style.display = 'flex'; // Make icon a flex container
    toggleIcon.style.alignItems = 'center'; // Align icon content vertically
    toggleIcon.style.width = '16px'; // Fixed width for consistency
    toggleIcon.style.justifyContent = 'center'; // Center horizontally

    // Assemble title
    tipHeader.appendChild(tipIcon);
    tipHeader.appendChild(tipTitle);
    tipHeader.appendChild(toggleIcon);
    tipContainer.appendChild(tipHeader);

    // Create tip content
    const tipContent = document.createElement('div');
    tipContent.classList.add('moonlit-tip-content');
    tipContent.style.padding = '0';
    tipContent.style.maxHeight = '0';
    tipContent.style.overflow = 'hidden';
    tipContent.style.transition = 'all 0.3s ease';

    // Set tip content, more concise
    tipContent.innerHTML = `
        <div style="line-height: 1.4;">
            <span data-i18n="Please refer to the">Please refer to the</span> <a href="https://github.com/RivelleDays/SillyTavern-MoonlitEchoesTheme" target="_blank">Moonlit Echoes Theme GitHub README</a> <span data-i18n="and complete the necessary setup.">and complete the necessary setup.</span>
            </div>
        </div>
    `;

    tipContainer.appendChild(tipContent);

    // Add click event
    tipHeader.addEventListener('click', () => {
        const isExpanded = tipContent.style.maxHeight !== '0px' && tipContent.style.maxHeight !== '0';

        if (isExpanded) {
            // Collapse
            tipContent.style.maxHeight = '0';
            tipContent.style.padding = '0 10px';
            toggleIcon.style.transform = 'rotate(0deg)';
        } else {
            // Expand
            tipContent.style.maxHeight = '1000px';
            tipContent.style.padding = '10px';
            toggleIcon.style.transform = 'rotate(180deg)';
        }
    });

    // Add to container
    container.appendChild(tipContainer);
}

/**
 * Add slash commands tip
 * Add a tip about available slash commands in the settings panel
 */
function addSlashCommandsTip(container) {
    // Check if tip already added
    if (document.getElementById('moonlit-slashcmd-tip')) return;

    // Create tip container
    const tipContainer = document.createElement('div');
    tipContainer.id = 'moonlit-slashcmd-tip';
    tipContainer.classList.add('moonlit-tip-container');
    tipContainer.style.borderRadius = '5px';
    tipContainer.style.overflow = 'hidden';

    // Create tip header block
    const tipHeader = document.createElement('div');
    tipHeader.classList.add('moonlit-tip-header');
    tipHeader.style.display = 'flex'; // Add flex display
    tipHeader.style.alignItems = 'center'; // Center align items vertically

    // Add small icon with better alignment
    const tipIcon = document.createElement('i');
    tipIcon.classList.add('fa', 'fa-terminal');
    tipIcon.style.marginRight = '8px';
    tipIcon.style.display = 'flex'; // Make icon a flex container
    tipIcon.style.alignItems = 'center'; // Align icon content vertically
    tipIcon.style.justifyContent = 'center'; // Center icon content horizontally
    tipIcon.style.width = '16px'; // Fixed width
    tipIcon.style.height = '16px'; // Fixed height

    // Add tip title text with a more concise title
    const tipTitle = document.createElement('span');
    tipTitle.textContent = t`Chat Style Slash Commands`;
    tipTitle.setAttribute('data-i18n', 'Chat Style Slash Commands');
    tipTitle.style.fontWeight = 'normal';

    // Add small expand icon with consistent sizing
    const toggleIcon = document.createElement('i');
    toggleIcon.classList.add('fa', 'fa-chevron-down');
    toggleIcon.style.marginLeft = 'auto';
    toggleIcon.style.fontSize = '0.85em';
    toggleIcon.style.opacity = '0.8';
    toggleIcon.style.transition = 'transform 0.3s';
    toggleIcon.style.display = 'flex'; // Make icon a flex container
    toggleIcon.style.alignItems = 'center'; // Align icon content vertically
    toggleIcon.style.width = '16px'; // Fixed width for consistency
    toggleIcon.style.justifyContent = 'center'; // Center horizontally

    // Assemble title
    tipHeader.appendChild(tipIcon);
    tipHeader.appendChild(tipTitle);
    tipHeader.appendChild(toggleIcon);
    tipContainer.appendChild(tipHeader);

    // Create tip content
    const tipContent = document.createElement('div');
    tipContent.classList.add('moonlit-tip-content');
    tipContent.style.padding = '0';
    tipContent.style.maxHeight = '0';
    tipContent.style.overflow = 'hidden';
    tipContent.style.transition = 'all 0.3s ease';

    // Set tip content with slash command info and increased list item spacing
    tipContent.innerHTML = `
    <div style="line-height: 1.5;">
        <span style="font-weight:500;" data-i18n="Moonlit Echoes Styles:">Moonlit Echoes Styles:</span>
        <ul style="margin-top: 5px; margin-bottom: 10px; padding-left: 20px;">
            <li style="margin-bottom: 8px;"><code>/echostyle</code> - <span data-i18n="Switch to Echo style">Switch to Echo style</span></li>
            <li style="margin-bottom: 8px;"><code>/whisperstyle</code> - <span data-i18n="Switch to Whisper style">Switch to Whisper style</span></li>
            <li style="margin-bottom: 8px;"><code>/hushstyle</code> - <span data-i18n="Switch to Hush style">Switch to Hush style</span></li>
            <li style="margin-bottom: 8px;"><code>/ripplestyle</code> - <span data-i18n="Switch to Ripple style">Switch to Ripple style</span></li>
            <li><code>/tidestyle</code> - <span data-i18n="Switch to Tide style">Switch to Tide style</span></li>
        </ul>

        <span style="font-weight:500;" data-i18n="SillyTavern Safe Switch Commands:">SillyTavern Safe Switch Commands:</span>
        <ul style="margin-top: 5px; margin-bottom: 10px; padding-left: 20px;">
            <li style="margin-bottom: 8px;"><code>/moonlit-flat</code> - <span data-i18n="Switch to Flat style">Switch to Flat style</span></li>
            <li style="margin-bottom: 8px;"><code>/moonlit-bubble</code> - <span data-i18n="Switch to Bubble style">Switch to Bubble style</span></li>
            <li><code>/moonlit-document</code> - <span data-i18n="Switch to Document style">Switch to Document style</span></li>
        </ul>

        <div style="margin-top: 8px; margin-bottom: 5px; text-align: center;">
            <span data-i18n="For more commands, see">For more commands, see</span>
            <button class="menu_button menu_button_icon inline-flex interactable" onclick="window.open('https://docs.sillytavern.app/usage/st-script/', '_blank')" tabindex="0" style="margin-left: 5px; font-size: 0.9em;">
                <i class="fa-solid fa-terminal"></i>
                <span data-i18n="STscript Reference">STscript Reference</span>
            </button>
        </div>
    </div>
`;

    tipContainer.appendChild(tipContent);

    // Add click event
    tipHeader.addEventListener('click', () => {
        const isExpanded = tipContent.style.maxHeight !== '0px' && tipContent.style.maxHeight !== '0';

        if (isExpanded) {
            // Collapse
            tipContent.style.maxHeight = '0';
            tipContent.style.padding = '0 10px';
            toggleIcon.style.transform = 'rotate(0deg)';
        } else {
            // Expand
            tipContent.style.maxHeight = '1000px';
            tipContent.style.padding = '10px';
            toggleIcon.style.transform = 'rotate(180deg)';
        }
    });

    // Add to container
    container.appendChild(tipContainer);
}


/**
* Handle Moonlit Echoes preset import
* @param {Object} jsonData - Imported JSON data
*/
/**
* Update theme selector
* @param {string} presetName - Preset name
*/
function updateThemeSelector(presetName) {
    const themeSelector = document.getElementById('themes');
    if (!themeSelector) return;

    // Only update theme selector when option already exists, don't add any new options
    let optionExists = false;

    // Check if option already exists
    for (let i = 0; i < themeSelector.options.length; i++) {
        if (themeSelector.options[i].value === presetName) {
            optionExists = true;
            themeSelector.selectedIndex = i; // Select that option
            break;
        }
    }

    // Only trigger change event if option exists
    if (optionExists) {
        themeSelector.dispatchEvent(new Event('change'));
    }
}

/**
* Settings UI initialization function - no longer requires external HTML file
* @returns {Promise} Promise for initialization completion
*/
function loadSettingsHTML() {
return new Promise((resolve) => {
    // Since all HTML is now integrated into JavaScript, no need to load from external sources
    // Just return resolved Promise to continue the initialization flow

    // If any initialization operations need to be performed here, can be added here

    // Immediately resolve Promise
    resolve();
});
}

/**
 * Automatically load or remove CSS based on enabled status in settings
 * @param {boolean} shouldLoad - If true, load CSS, otherwise remove
 */
export function toggleCss(shouldLoad) {
    // Get existing <link> elements
    const existingLinkStyle = document.getElementById('MoonlitEchosTheme-style');
    const existingLinkExt = document.getElementById('MoonlitEchosTheme-extension');

    if (shouldLoad) {
        // Keep optional companion-extension states out of document-wide CSS :has() selectors.
        moonlitDomState.start();

        // Determine base URL path
        const baseUrl = getBaseUrl();

        // Load theme style
        if (!existingLinkStyle) {
            const cssUrl = baseUrl + '/style.css';
            const linkStyle = document.createElement('link');
            linkStyle.id = 'MoonlitEchosTheme-style';
            linkStyle.rel = 'stylesheet';
            linkStyle.href = cssUrl;
            document.head.append(linkStyle);
        }

        // Load extension style
        if (!existingLinkExt) {
            const extUrl = baseUrl + '/extension.css';
            const linkExt = document.createElement('link');
            linkExt.id = 'MoonlitEchosTheme-extension';
            linkExt.rel = 'stylesheet';
            linkExt.href = extUrl;
            document.head.append(linkExt);
        }

        // Ensure hint is visible
        addThemeButtonsHint();

        // Re-apply all checkbox styles if they were enabled
        updateAllCheckboxStyles(true);
    } else {
        // Remove Moonlit-owned state classes before its styles are unloaded.
        moonlitDomState.stop();

        // Remove CSS
        if (existingLinkStyle) existingLinkStyle.remove();
        if (existingLinkExt) existingLinkExt.remove();

        // Remove hint
        const existingHint = document.getElementById('moonlit-theme-buttons-hint');
        if (existingHint) existingHint.remove();

        // Clear all checkbox styles
        clearAllCheckboxStyles();
    }
}

/**
 * Clear all CSS styles added by checkboxes
 */
function clearAllCheckboxStyles() {
    // Find all style elements created by checkboxes
    document.querySelectorAll('style[id^="css-block-"]').forEach(element => {
        element.textContent = '';
    });
}

/**
 * Update all checkbox styles based on their current settings and extension state
 * @param {boolean} extensionEnabled - Whether the extension is enabled
 */
function updateAllCheckboxStyles(extensionEnabled) {
    if (!extensionEnabled) {
        clearAllCheckboxStyles();
        return;
    }

    // Get settings
    const context = SillyTavern.getContext();
    const settings = getExtensionSettings(context);

    // Go through all checkbox settings and update their styles
    themeCustomSettings.forEach(setting => {
        if (setting.type === 'checkbox' && (setting.cssBlock || setting.cssFile)) {
            const varId = setting.varId;
            const enabled = settings[varId] === true;
            const styleElement = document.getElementById(`css-block-${varId}`);

            if (styleElement) {
                if (setting.cssBlock && enabled) {
                    styleElement.textContent = setting.cssBlock;
                } else {
                    styleElement.textContent = '';
                }
            }
        }
    });
}

/**
* Get the base URL path for the extension
* @returns {string} Base URL for the extension
*/
function getBaseUrl() {
let baseUrl = '';

// Try various possible path retrieval methods
if (typeof import.meta !== 'undefined' && import.meta.url) {
    baseUrl = new URL('.', import.meta.url).href;
} else {
    const currentScript = document.currentScript;
    if (currentScript && currentScript.src) {
        baseUrl = currentScript.src.substring(0, currentScript.src.lastIndexOf('/'));
    } else {
        // If above methods fail, use hardcoded path
        baseUrl = `${window.location.origin}/scripts/extensions/third-party/${EXTENSION_ID}`;
    }
}

return baseUrl;
}

/**
 * Render extension settings panel - Refactored with tabbed interface
 * Create UI elements and set up event handling
 */
function renderExtensionSettings() {
    const context = SillyTavern.getContext();
    const settingsContainer = document.getElementById(`${settingsKey}-container`) ?? document.getElementById('extensions_settings2');
    if (!settingsContainer) {
        return;
    }

    // Find existing settings drawer to avoid duplication
    let existingDrawer = settingsContainer.querySelector(`#${settingsKey}-drawer`);
    if (existingDrawer) {
        return; // Don't recreate if exists
    }

    // Create settings drawer
    const inlineDrawer = document.createElement('div');
    inlineDrawer.id = `${settingsKey}-drawer`;
    inlineDrawer.classList.add('inline-drawer');
    settingsContainer.append(inlineDrawer);

    // Create drawer title
    const inlineDrawerToggle = document.createElement('div');
    inlineDrawerToggle.classList.add('inline-drawer-toggle', 'inline-drawer-header');

    const extensionNameElement = document.createElement('b');
    extensionNameElement.textContent = EXTENSION_NAME;

    const inlineDrawerIcon = document.createElement('div');
    inlineDrawerIcon.classList.add('inline-drawer-icon', 'fa-solid', 'fa-circle-chevron-down', 'down');

    inlineDrawerToggle.append(extensionNameElement, inlineDrawerIcon);

    // Create settings content area
    const inlineDrawerContent = document.createElement('div');
    inlineDrawerContent.classList.add('inline-drawer-content');

    // Add to drawer
    inlineDrawer.append(inlineDrawerToggle, inlineDrawerContent);

    // Get settings
    const settings = getExtensionSettings(context);

    // Add creator
    addThemeCreatorInfo(inlineDrawerContent);

    // Create enable switch
    const enabledCheckboxLabel = document.createElement('label');
    enabledCheckboxLabel.classList.add('checkbox_label');
    enabledCheckboxLabel.htmlFor = `${settingsKey}-enabled`;

    const enabledCheckbox = document.createElement('input');
    enabledCheckbox.id = `${settingsKey}-enabled`;
    enabledCheckbox.type = 'checkbox';
    enabledCheckbox.checked = settings.enabled;

    enabledCheckbox.addEventListener('change', () => {
        settings.enabled = enabledCheckbox.checked;
        toggleCss(settings.enabled);

        // Update hint display when enable status changes
        addThemeButtonsHint();

        // Update custom chat styles when enabled status changes
        updateCustomChatStyles();

        // Re-initialize slash commands based on enabled status
        if (settings.enabled) {
            initializeSlashCommands();
        }

        saveExtensionSettings(context);
    });

    const enabledCheckboxText = document.createElement('span');
    enabledCheckboxText.textContent = t`Enable Moonlit Echoes Theme`;

    enabledCheckboxLabel.append(enabledCheckbox, enabledCheckboxText);
    inlineDrawerContent.append(enabledCheckboxLabel);

    // Toggle using original avatar images instead of thumbnails
    const originalAvatarLabel = document.createElement('label');
    originalAvatarLabel.classList.add('checkbox_label');
    originalAvatarLabel.htmlFor = `${settingsKey}-use-original-avatars`;

    const originalAvatarCheckbox = document.createElement('input');
    originalAvatarCheckbox.id = `${settingsKey}-use-original-avatars`;
    originalAvatarCheckbox.type = 'checkbox';
    originalAvatarCheckbox.checked = settings.useOriginalAvatarImages === true;

    originalAvatarCheckbox.addEventListener('change', () => {
        settings.useOriginalAvatarImages = originalAvatarCheckbox.checked;
        saveExtensionSettings(context);
        window.updateAvatars?.();
    });

    const originalAvatarText = document.createElement('span');
    originalAvatarText.textContent = t`Use original character avatars in chat messages`;

    originalAvatarLabel.append(originalAvatarCheckbox, originalAvatarText);
    inlineDrawerContent.append(originalAvatarLabel);

    // Add spacer for visual spacing
    const spacer = document.createElement('div');
    spacer.style.height = '15px';
    inlineDrawerContent.append(spacer);

    // Create preset manager
    createPresetManagerUI(inlineDrawerContent, settings);

    // Add tips
    addThumbnailTip(inlineDrawerContent);
    addSlashCommandsTip(inlineDrawerContent);

    // Add spacer for visual spacing
    const spacer2 = document.createElement('div');
    spacer2.style.height = '10px';
    inlineDrawerContent.append(spacer2);

    // Create tabbed settings UI
    createTabbedSettingsUI(inlineDrawerContent, settings);

    // Add version information
    addThemeVersionInfo(inlineDrawerContent);

    // Initialize drawer toggle functionality
    inlineDrawerToggle.addEventListener('click', function() {
        this.classList.toggle('open');
        inlineDrawerIcon.classList.toggle('down');
        inlineDrawerIcon.classList.toggle('up');
        inlineDrawerContent.classList.toggle('open');
    });
}

/**
 * Update custom chat styles based on extension enabled status
 */
function updateCustomChatStyles() {
    // No-op: options are now permanent; nothing to add/remove on enable toggle
}

/**
 * Remove custom chat styles when theme is disabled
 */
function removeCustomChatStyles() {
    // Intentionally empty: we no longer remove options when the theme is disabled
}

/**
 * Create tabbed settings UI with state persistence - Updated tab name
 * @param {HTMLElement} container - Container to add tabbed settings
 * @param {Object} settings - Current settings object
 */

/**
 * Populate tab content with sections and settings
 * Modified to support always-expanded first sections
 * @param {Array} tabs - Tab configuration objects
 * @param {HTMLElement} tabContents - Container for tab content
 * @param {Object} settings - Current settings object
 * @param {boolean} firstSectionAlwaysExpanded - Whether to keep first section expanded
 */

/**
 * Enhanced populateTabContent without expand/collapse all buttons
 * @param {Array} tabs - Tab configuration objects
 * @param {HTMLElement} tabContents - Container for tab content
 * @param {Object} settings - Current settings object
 */

/**
 * Save section expand/collapse state to localStorage
 * @param {string} category - Category ID
 * @param {boolean} isExpanded - Whether section is expanded
 */

/**
* Create preset manager UI
* @param {HTMLElement} container - Container to add preset manager
* @param {Object} settings - Current settings object
*/
/**
 * Add theme creator information to settings panel
 * @param {HTMLElement} [container] - Optional container, uses default settings container if not provided
 */
function addThemeCreatorInfo(container) {
    // Check if creator info already added
    if (document.getElementById('moonlit-echoes-creator')) return;

    // If no container passed, use default settings container
    if (!container) {
        container = document.querySelector('.settings-container');
    }

    // Check if container exists
    if (!container) return;

    // Create creator info container
    const creatorContainer = document.createElement('div');
    creatorContainer.classList.add('moonlit-echoes', 'flex-container', 'flexFlowColumn');
    creatorContainer.style.marginTop = '5px';
    creatorContainer.style.marginBottom = '15px';
    creatorContainer.style.textAlign = 'center';

    // Set HTML content
    creatorContainer.innerHTML = `
        <small id="moonlit-echoes-creator">
            <span>Created with Heartfelt Passion by</span>
            <a href="https://github.com/RivelleDays" target="_blank" rel="noopener noreferrer">Rivelle</a><br>
            <span>Dedicated to All 可愛 (Kind & Wonderful) People</span>
        </small>
    `;

    // Add to settings panel container
    container.appendChild(creatorContainer);
}


/**
* Add theme version information to settings panel
* @param {HTMLElement} container - Container to add version info
*/
function addThemeVersionInfo(container) {
// Check if version info already added
if (document.getElementById('moonlit-echoes-version')) return;

// Check if container exists
if (!container) return;

// Create version info container
const versionContainer = document.createElement('div');
versionContainer.classList.add('moonlit-echoes', 'flex-container', 'flexFlowColumn');
versionContainer.style.marginTop = '5px';
versionContainer.style.marginBottom = '15px';
versionContainer.style.textAlign = 'center';

// Set HTML content
versionContainer.innerHTML = `
    <small class="flex-container justifyCenter alignitemscenter">
        <span data-i18n="Moonlit Echoes Theme Version">Moonlit Echoes Theme Version</span>
        <a id="moonlit-echoes-version"
            href="https://github.com/RivelleDays/SillyTavern-MoonlitEchoesTheme"
            target="_blank"
            rel="noopener noreferrer"
            style="margin-left: 5px;">${THEME_VERSION}</a>
    </small>
`;

// Add to provided container
container.appendChild(versionContainer);
}

/**
 * Initialize chat appearance switcher - only when theme is enabled
 * Handle switching between different chat styles
 */
function initChatDisplaySwitcher() {
    const context = SillyTavern.getContext();
    const settings = getExtensionSettings(context);

    const themeSelect = document.getElementById("themes");
    const chatDisplaySelect = document.getElementById("chat_display");
    if (!themeSelect || !chatDisplaySelect) return;

    // Add our custom options exactly once (regardless of theme enabled)
    function addCustomStyleOptions() {
        if (customChatStylesAdded) return;

        const ensureOption = (value, label) => {
            if (!chatDisplaySelect.querySelector(`option[value="${value}"]`)) {
                const opt = document.createElement("option");
                opt.value = value;
                opt.text = label;
                chatDisplaySelect.appendChild(opt);
            }
        };

        // Ensure all custom styles exist
        ensureOption("3", t`Echo`);
        ensureOption("4", t`Whisper`);
        ensureOption("5", t`Hush`);
        ensureOption("6", t`Ripple`);
        ensureOption("7", t`Tide`);

        customChatStylesAdded = true;
    }

    // Apply the selected chat style by toggling body classes
    function applyChatDisplayStyle() {
        document.body.classList.remove(
            "flatchat","bubblechat","documentstyle",
            "echostyle","whisperstyle","hushstyle",
            "ripplestyle","tidestyle"
        );

        switch (chatDisplaySelect.value) {
            case "0": document.body.classList.add("flatchat"); break;
            case "1": document.body.classList.add("bubblechat"); break;
            case "2": document.body.classList.add("documentstyle"); break;
            case "3": document.body.classList.add("echostyle"); break;
            case "4": document.body.classList.add("whisperstyle"); break;
            case "5": document.body.classList.add("hushstyle"); break;
            case "6": document.body.classList.add("ripplestyle"); break;
            case "7": document.body.classList.add("tidestyle"); break;
        }

        window.updateAvatars?.();
    }

    // Always add our options
    addCustomStyleOptions();

    // Restore saved selections
    const savedTheme = localStorage.getItem("savedTheme");
    const savedChatStyle = localStorage.getItem("savedChatStyle");
    if (savedTheme) themeSelect.value = savedTheme;
    if (savedChatStyle) chatDisplaySelect.value = savedChatStyle;

    // Events
    themeSelect.addEventListener("change", function() {
        localStorage.setItem("savedTheme", themeSelect.value);
        applyChatDisplayStyle();
    });

    chatDisplaySelect.addEventListener("change", function() {
        localStorage.setItem("savedChatStyle", chatDisplaySelect.value);
        applyChatDisplayStyle();
    });

    applyChatDisplayStyle();
}


/**
* Apply single theme setting
* @param {string} varId - CSS variable ID
* @param {string} value - Setting value
*/
export function applyThemeSetting(varId, value) {
    // Directly set CSS variable
    document.documentElement.style.setProperty(`--${varId}`, value, 'important');

    // Trigger custom event
    document.dispatchEvent(new CustomEvent('themeSettingChanged', {
        detail: { varId, value }
    }));
}
// Inject raw CSS (unfiltered) into the page via a dedicated <style> tag
function applyRawCustomCss(cssText) {
    let rawStyle = document.getElementById('moonlit-raw-css');
    if (!rawStyle) {
        rawStyle = document.createElement('style');
        rawStyle.id = 'moonlit-raw-css';
        // DO NOT sanitize or filter; user explicitly wants full control
        document.head.appendChild(rawStyle);
    }
    rawStyle.textContent = cssText || '';
}
// Re-apply when the setting changes (optional safety net)
document.addEventListener('themeSettingChanged', (ev) => {
    const { varId, value } = ev.detail || {};
    if (varId === 'rawCustomCss') {
        applyRawCustomCss(value);
    }
});

/**
 * Convert RGBA to HEX - enhanced version
 * Support more formats and better error handling
 * @param {string} rgba - RGBA color string
 * @returns {string|null} HEX color string or null
 */


/**
* Dynamically add a new custom setting
* Use this function to add new settings at runtime
* @param {Object} settingConfig - Setting configuration object
*/
export function addCustomSetting(settingConfig) {
    // Check setting validity
    if (!settingConfig || !settingConfig.varId || !settingConfig.type) {
        return;
    }

    // Check if already exists
    const existing = themeCustomSettings.find(s => s.varId === settingConfig.varId);
    if (existing) {
        return;
    }

    // Add to setting configuration
    themeCustomSettings.push(settingConfig);

    // Get settings and add default value
    const context = SillyTavern.getContext();
    const settings = getExtensionSettings(context);

    // If settings don't have this item, add default value
    if (settings[settingConfig.varId] === undefined) {
        settings[settingConfig.varId] = settingConfig.default;
    }

    // Save settings
    saveExtensionSettings(context);

    // Re-render settings panel
    const settingsContainer = document.querySelector(`#${settingsKey}-drawer .inline-drawer-content`);
    if (settingsContainer) {
        // Clear existing settings (keep enable switch)
        const enabledCheckbox = settingsContainer.querySelector(`#${settingsKey}-enabled`).parentElement;
        const separator = settingsContainer.querySelector('hr');

        // Clear child elements
        while (settingsContainer.lastChild) {
            settingsContainer.removeChild(settingsContainer.lastChild);
        }

        // Re-add enable switch
        settingsContainer.appendChild(enabledCheckbox);
        settingsContainer.appendChild(separator);

        // Recreate settings
        createCustomSettingsUI(settingsContainer, settings);
    }
}

configureSettingsFactory({
    applyThemeSetting,
    applyRawCustomCss,
});

export { addModernCompactStyles };

function runStartupDomReadyTasks() {
    try {
        addModernCompactStyles();
    } catch (error) {
        console.error('Moonlit Echoes failed to add compact styles', error);
    }

    try {
        syncMoonlitPresetsWithThemeList();
    } catch (error) {
        console.error('Moonlit Echoes failed to sync presets after DOM ready', error);
    }
}

function initializeThemeColorOnDemand() {
    applyAllThemeSettings();
    syncMoonlitPresetsWithThemeList();
}

function setupPublicMoonlitApi() {
    window.initializeThemeColorOnDemand = initializeThemeColorOnDemand;

    window.MoonlitEchoesTheme = {
        init: function() {
            applyAllThemeSettings();
            initializeThemeColorOnDemand();
            syncMoonlitPresetsWithThemeList();
        },

        addSetting: addCustomSetting,

        applySetting: applyThemeSetting,

        getSettings: function() {
            return getExtensionSettings();
        },

        getSettingsConfig: function() {
            return [...themeCustomSettings];
        },

        presets: {
            getAll: function() {
                const context = SillyTavern.getContext();
                const settings = getExtensionSettings(context);
                return settings?.presets || {};
            },

            getActive: function() {
                const context = SillyTavern.getContext();
                const settings = getExtensionSettings(context);
                return {
                    name: settings.activePreset,
                    settings: settings.presets[settings.activePreset] || {}
                };
            },

            create: function(name, settingsObj) {
                const context = SillyTavern.getContext();
                const settings = getExtensionSettings(context);

                if (!name || typeof name !== 'string') {
                    return false;
                }

                settings.presets[name] = settingsObj || {};
                saveExtensionSettings(context);
                syncMoonlitPresetsWithThemeList();

                return true;
            },

            load: function(name) {
                return loadPreset(name);
            },

            update: function(name, settingsObj) {
                const context = SillyTavern.getContext();
                const settings = getExtensionSettings(context);

                if (!settings.presets[name]) {
                    return false;
                }

                settings.presets[name] = settingsObj || settings.presets[name];
                saveExtensionSettings(context);

                return true;
            },

            delete: function(name) {
                const context = SillyTavern.getContext();
                const settings = getExtensionSettings(context);

                if (name === 'Default') {
                    return false;
                }

                if (!settings.presets[name]) {
                    return false;
                }

                if (Object.keys(settings.presets).length <= 1) {
                    return false;
                }

                if (settings.activePreset === name) {
                    settings.activePreset = 'Default';
                    applyPresetToSettings('Default');
                }

                delete settings.presets[name];
                saveExtensionSettings(context);
                syncMoonlitPresetsWithThemeList();

                return true;
            },

            export: function(name) {
                const context = SillyTavern.getContext();
                const settings = getExtensionSettings(context);

                if (!settings.presets[name]) {
                    return null;
                }

                return {
                    moonlitEchoesPreset: true,
                    presetVersion: THEME_VERSION,
                    presetName: name,
                    settings: settings.presets[name]
                };
            },

            import: function(jsonData) {
                if (!jsonData || !jsonData.moonlitEchoesPreset || !jsonData.presetName || !jsonData.settings) {
                    return false;
                }

                const context = SillyTavern.getContext();
                const settings = getExtensionSettings(context);
                const presetName = jsonData.presetName;

                settings.presets[presetName] = jsonData.settings;
                saveExtensionSettings(context);
                syncMoonlitPresetsWithThemeList();

                return true;
            }
        }
    };

    window.formSheldHeightController = initFormSheldHeightMonitor();
}

setupPublicMoonlitApi();
initExtension({ initExtensionUI, toggleCss });
registerDomReadyHandler(runStartupDomReadyTasks);
