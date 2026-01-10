import { t } from '../../../../../i18n.js';
import { EXTENSION_FOLDER_PATH } from '../config/theme-info.js';
import { themeCustomSettings } from '../config/theme-settings.js';
import { getSettings as getExtensionSettings, saveSettings as saveExtensionSettings } from '../services/settings-service.js';
import { rgbaToHex, getAlphaFromRgba } from '../utils/color.js';



let applyThemeSettingFn = () => { };
let applyRawCustomCssFn = () => { };

export function configureSettingsFactory(options = {}) {
    applyThemeSettingFn = options.applyThemeSetting || (() => { });
    applyRawCustomCssFn = options.applyRawCustomCss || (() => { });
}


export function addModernCompactStyles() {
    const SETTINGS_STYLES_ID = 'moonlit-modern-styles';
    const SETTINGS_STYLES_URL = new URL('./settings-factory.css', import.meta.url).href;

    if (document.getElementById(SETTINGS_STYLES_ID)) {
        return;
    }

    const linkElement = document.createElement('link');
    linkElement.id = SETTINGS_STYLES_ID;
    linkElement.rel = 'stylesheet';
    linkElement.href = SETTINGS_STYLES_URL;
    document.head.appendChild(linkElement);
}

export function createCustomSettingsUI(container, settings) {
    const categories = {};
    themeCustomSettings.forEach(setting => {
        const category = setting.category || 'general';
        if (!categories[category]) {
            categories[category] = [];
        }
        categories[category].push(setting);
    });

    const categoryNames = {
        'colors': t`Theme Color Settings`,
        'background': t`Background Settings`,
        'chat': t`Chat Interface`,
        'visualNovel': t`Visual Novel Mode`,
        'general': t`General Settings`,
        'features': t`Advanced Settings`
    };

    Object.keys(categories).forEach(category => {
        const categoryContainer = document.createElement('div');
        categoryContainer.classList.add('theme-setting-category');

        const titleContainer = document.createElement('div');
        titleContainer.classList.add('theme-category-header');
        titleContainer.style.cursor = 'pointer';
        titleContainer.style.display = 'flex';
        titleContainer.style.alignItems = 'center';
        titleContainer.style.marginBottom = '5px';
        titleContainer.style.padding = '5px 0';
        titleContainer.style.borderBottom = '1px solid color-mix(in srgb, var(--SmartThemeBodyColor) 10%, transparent)';

        const toggleIcon = document.createElement('i');
        toggleIcon.classList.add('fa', 'fa-chevron-down');
        toggleIcon.style.marginRight = '8px';
        toggleIcon.style.transition = 'transform 0.3s';
        toggleIcon.style.transform = 'rotate(-90deg)';

        const categoryTitle = document.createElement('h4');
        categoryTitle.textContent = categoryNames[category] || category;
        categoryTitle.style.margin = '0';

        titleContainer.appendChild(toggleIcon);
        titleContainer.appendChild(categoryTitle);
        categoryContainer.appendChild(titleContainer);

        const contentContainer = document.createElement('div');
        contentContainer.classList.add('theme-category-content');
        contentContainer.style.transition = 'max-height 0.3s ease-out, opacity 0.2s ease-out';
        contentContainer.style.overflow = 'hidden';
        contentContainer.style.maxHeight = '0px';
        contentContainer.style.opacity = '0';
        contentContainer.style.padding = '5px';

        categories[category].forEach(setting => {
            const settingContainer = document.createElement('div');
            settingContainer.classList.add('theme-setting-item');

            createSettingItem(settingContainer, setting, settings);
            contentContainer.appendChild(settingContainer);
        });

        let isCollapsed = true;
        titleContainer.addEventListener('click', () => {
            if (isCollapsed) {
                const scrollHeight = contentContainer.scrollHeight;
                contentContainer.style.maxHeight = scrollHeight + 'px';
                contentContainer.style.opacity = '1';
                toggleIcon.style.transform = 'rotate(0deg)';
            } else {
                contentContainer.style.maxHeight = '0px';
                contentContainer.style.opacity = '0';
                toggleIcon.style.transform = 'rotate(-90deg)';
            }
            isCollapsed = !isCollapsed;
        });

        categoryContainer.appendChild(contentContainer);
        container.appendChild(categoryContainer);
    });

    addModernCompactStyles();
}

export function createSettingItem(container, setting, settings) {
    const settingContainer = document.createElement('div');
    settingContainer.classList.add('theme-setting-container');

    if (setting.type !== 'checkbox') {
        const label = document.createElement('label');
        label.textContent = setting.displayText;
        settingContainer.appendChild(label);

        if (setting.description) {
            const description = document.createElement('small');
            description.textContent = setting.description;
            settingContainer.appendChild(description);
        }
    }

    switch (setting.type) {
        case 'color': createColorPicker(settingContainer, setting, settings); break;
        case 'slider': createSlider(settingContainer, setting, settings); break;
        case 'select': createSelect(settingContainer, setting, settings); break;
        case 'text': createTextInput(settingContainer, setting, settings); break;
        case 'checkbox': createCheckbox(settingContainer, setting, settings); break;
        case 'textarea': createTextareaInput(settingContainer, setting, settings); break;
        default:
            break;
    }

    container.appendChild(settingContainer);
}

function createColorPicker(container, setting, settings) {
    const context = SillyTavern.getContext();
    const { varId, default: defaultValue } = setting;
    const currentValue = settings[varId] || defaultValue;

    const colorPickerContainer = document.createElement('div');
    colorPickerContainer.classList.add('theme-color-picker');
    colorPickerContainer.style.display = 'flex';
    colorPickerContainer.style.alignItems = 'center';
    colorPickerContainer.style.gap = '10px';
    colorPickerContainer.style.padding = '2px 0';
    colorPickerContainer.style.minHeight = '36px';

    const colorPreview = document.createElement('div');
    colorPreview.id = `cts-${varId}-preview`;
    colorPreview.classList.add('color-preview');
    colorPreview.style.width = '30px';
    colorPreview.style.height = '30px';
    colorPreview.style.minWidth = '30px';
    colorPreview.style.minHeight = '30px';
    colorPreview.style.borderRadius = '4px';
    colorPreview.style.border = '1px solid color-mix(in srgb, var(--SmartThemeBodyColor) 10%, transparent)';
    colorPreview.style.background = currentValue;
    colorPreview.style.cursor = 'pointer';
    colorPreview.style.boxShadow = '0 1px 3px var(--SmartThemeShadowColor)';

    const textInput = document.createElement('input');
    textInput.id = `cts-${varId}-text`;
    textInput.type = 'text';
    const initialHexValue = rgbaToHex(currentValue);
    textInput.value = initialHexValue || currentValue;
    textInput.classList.add('color-input-text');
    textInput.style.flex = '1';
    textInput.style.minWidth = '80px';
    textInput.style.minHeight = '28px';
    textInput.style.padding = '4px 6px';
    textInput.style.backgroundColor = 'var(--black30a)';
    textInput.style.border = '1px solid color-mix(in srgb, var(--SmartThemeBodyColor) 10%, transparent)';
    textInput.style.borderRadius = '4px';
    textInput.style.color = 'var(--SmartThemeBodyColor)';

    const colorInput = document.createElement('input');
    colorInput.id = `cts-${varId}-color`;
    colorInput.type = 'color';
    colorInput.value = rgbaToHex(currentValue) || '#ffffff';
    colorInput.style.width = '1px';
    colorInput.style.height = '1px';
    colorInput.style.opacity = '0';
    colorInput.style.position = 'absolute';
    colorInput.style.pointerEvents = 'auto';

    const alphaContainer = document.createElement('div');
    alphaContainer.style.display = 'flex';
    alphaContainer.style.flexDirection = 'column';
    alphaContainer.style.width = '120px';
    alphaContainer.style.gap = '3px';

    const alphaLabel = document.createElement('span');
    alphaLabel.textContent = t`Opacity`;
    alphaLabel.style.fontSize = '10px';
    alphaLabel.style.opacity = '0.7';
    alphaLabel.style.alignSelf = 'flex-start';

    const alphaRow = document.createElement('div');
    alphaRow.style.display = 'flex';
    alphaRow.style.alignItems = 'center';
    alphaRow.style.width = '100%';
    alphaRow.style.gap = '5px';

    const alphaSlider = document.createElement('input');
    alphaSlider.id = `cts-${varId}-alpha`;
    alphaSlider.type = 'range';
    alphaSlider.min = '0';
    alphaSlider.max = '100';
    alphaSlider.step = '1';
    alphaSlider.value = Math.round(getAlphaFromRgba(currentValue) * 100);
    alphaSlider.style.flex = '1';
    alphaSlider.style.height = '5px';
    alphaSlider.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
    alphaSlider.style.borderRadius = '2px';
    alphaSlider.style.appearance = 'none';
    alphaSlider.style.outline = 'none';

    const alphaValue = document.createElement('span');
    alphaValue.id = `cts-${varId}-alpha-value`;
    alphaValue.textContent = Math.round(getAlphaFromRgba(currentValue) * 100);
    alphaValue.style.minWidth = '28px';
    alphaValue.style.textAlign = 'right';

    const styleElem = document.createElement('style');
    styleElem.id = `color-slider-style-${varId}`;
    document.head.appendChild(styleElem);

    textInput.addEventListener('input', () => {
        const hexValue = textInput.value;
        if (/^#[0-9A-Fa-f]{6}$/.test(hexValue)) {
            const rgbaColor = hexToRgba(hexValue, alphaSlider.value / 100);
            colorPreview.style.background = rgbaColor;
            colorInput.value = hexValue;
        }
    });

    textInput.addEventListener('change', () => {
        const inputValue = textInput.value.trim();
        if (/^#[0-9A-Fa-f]{6}$/.test(inputValue)) {
            colorInput.value = inputValue;
            updateColor();
        } else if (/^rgba?\([^)]*\)$/.test(inputValue)) {
            try {
                const rgbaValue = inputValue.replace(/\s+/g, '');
                const tempElement = document.createElement('div');
                tempElement.style.color = rgbaValue;
                if (tempElement.style.color) {
                    const rgbaColor = getComputedStyle(tempElement).color;
                    colorPreview.style.background = rgbaColor;
                    const hexColor = rgbaToHex(rgbaColor);
                    if (hexColor) {
                        colorInput.value = hexColor;
                        const [, , , a] = rgbaColor.match(/rgba?\((\d+),(\d+),(\d+)(?:,([\d.]+))?\)/) || [];
                        const alpha = a ? parseFloat(a) : 1;
                        alphaSlider.value = Math.round(alpha * 100);
                        alphaValue.textContent = Math.round(alpha * 100);
                        updateSliderThumbColor(hexColor);
                        settings[varId] = rgbaColor;
                        applyThemeSettingFn(varId, rgbaColor);
                        saveExtensionSettings(context);
                    }
                }
            } catch {
                const previousHex = rgbaToHex(settings[varId]);
                textInput.value = previousHex || settings[varId] || defaultValue;
            }
        } else {
            try {
                const rgbaValue = inputValue.replace(/\s+/g, '');
                const tempElement = document.createElement('div');
                tempElement.style.color = rgbaValue;
                if (tempElement.style.color) {
                    const rgbaColor = getComputedStyle(tempElement).color;
                    colorPreview.style.background = rgbaColor;
                    const hexColor = rgbaToHex(rgbaColor);
                    if (hexColor) {
                        colorInput.value = hexColor;
                        const [, , , a] = rgbaColor.match(/rgba?\((\d+),(\d+),(\d+)(?:,([\d.]+))?\)/) || [];
                        const alpha = a ? parseFloat(a) : 1;
                        alphaSlider.value = Math.round(alpha * 100);
                        alphaValue.textContent = Math.round(alpha * 100);
                        updateSliderThumbColor(hexColor);
                        settings[varId] = rgbaColor;
                        applyThemeSettingFn(varId, rgbaColor);
                        saveExtensionSettings(context);
                    }
                } else {
                    const previousHex = rgbaToHex(settings[varId]);
                    textInput.value = previousHex || settings[varId] || defaultValue;
                }
            } catch {
                const previousHex = rgbaToHex(settings[varId]);
                textInput.value = previousHex || settings[varId] || defaultValue;
            }
        }
    });

    colorPreview.addEventListener('click', () => {
        colorInput.click();
    });

    colorInput.addEventListener('input', () => {
        updateColorAndAlpha();
        alphaSlider.dispatchEvent(new Event('input'));
    });

    alphaSlider.addEventListener('input', () => {
        alphaValue.textContent = alphaSlider.value;
        const hexColor = colorInput.value;
        updateSliderThumbColor(hexColor);
        updateColorAndAlpha();
    });

    alphaSlider.addEventListener('change', () => {
        const hexColor = colorInput.value;
        updateSliderThumbColor(hexColor);
        updateColorAndAlpha();
    });

    textInput.addEventListener('focusout', () => {
        const inputValue = textInput.value.trim();
        if (!/^#[0-9A-Fa-f]{6}$/.test(inputValue)) {
            const previousHex = rgbaToHex(settings[varId]);
            textInput.value = previousHex || settings[varId] || defaultValue;
        }
    });

    function updateSliderThumbColor(hexColor) {
        const newThumbStyle = `
            #${alphaSlider.id}::-webkit-slider-thumb {
                appearance: none;
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: ${hexColor};
                border: 1px solid color-mix(in srgb, var(--SmartThemeBodyColor) 10%, transparent);
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
                cursor: pointer;
            }
            #${alphaSlider.id}::-moz-range-thumb {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: ${hexColor};
                border: 1px solid color-mix(in srgb, var(--SmartThemeBodyColor) 10%, transparent);
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
                cursor: pointer;
            }
        `;

        styleElem.textContent = newThumbStyle;
    }

    function updateColor() {
        const hexColor = colorInput.value;
        const alpha = alphaSlider.value / 100;

        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);

        const rgbaColor = `rgba(${r}, ${g}, ${b}, ${alpha})`;

        colorPreview.style.background = rgbaColor;
        updateSliderThumbColor(hexColor);
        textInput.value = hexColor;

        settings[varId] = rgbaColor;
        applyThemeSettingFn(varId, rgbaColor);
        saveExtensionSettings(context);

        document.dispatchEvent(new CustomEvent('colorChanged', {
            detail: { varId, value: rgbaColor, hexColor }
        }));
    }

    function updateColorAndAlpha() {
        const hexColor = colorInput.value;
        const alpha = alphaSlider.value / 100;

        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);

        const rgbaColor = `rgba(${r}, ${g}, ${b}, ${alpha})`;

        colorPreview.style.background = rgbaColor;
        updateSliderThumbColor(hexColor);

        settings[varId] = rgbaColor;
        applyThemeSettingFn(varId, rgbaColor);
        saveExtensionSettings(context);
    }

    alphaRow.appendChild(alphaSlider);
    alphaRow.appendChild(alphaValue);
    alphaContainer.appendChild(alphaLabel);
    alphaContainer.appendChild(alphaRow);

    colorPickerContainer.appendChild(colorPreview);
    colorPickerContainer.appendChild(textInput);
    colorPickerContainer.appendChild(alphaContainer);
    colorPickerContainer.appendChild(colorInput);

    container.appendChild(colorPickerContainer);

    setTimeout(() => {
        const hexColor = rgbaToHex(currentValue) || '#ffffff';
        updateSliderThumbColor(hexColor);
    }, 10);
}

function createSlider(container, setting, settings) {
    const context = SillyTavern.getContext();
    const { varId, default: defaultValue, min, max, step } = setting;

    const sliderContainer = document.createElement('div');
    sliderContainer.style.display = 'flex';
    sliderContainer.style.alignItems = 'center';
    sliderContainer.style.gap = '10px';
    sliderContainer.style.maxWidth = '480px';

    const slider = document.createElement('input');
    slider.id = `cts-slider-${varId}`;
    slider.type = 'range';
    slider.min = min;
    slider.max = max;
    slider.step = step;
    slider.value = settings[varId] || defaultValue;
    slider.classList.add('moonlit-neo-range-input');
    slider.style.flex = '1';

    const numberInput = document.createElement('input');
    numberInput.id = `cts-number-${varId}`;
    numberInput.type = 'number';
    numberInput.min = min;
    numberInput.max = max;
    numberInput.step = step;
    numberInput.value = settings[varId] || defaultValue;
    numberInput.classList.add('moonlit-neo-range-input');
    numberInput.style.width = '60px';

    slider.addEventListener('input', () => {
        numberInput.value = slider.value;
        settings[varId] = slider.value;
        applyThemeSettingFn(varId, slider.value);
        saveExtensionSettings(context);
    });

    numberInput.addEventListener('change', () => {
        slider.value = numberInput.value;
        settings[varId] = numberInput.value;
        applyThemeSettingFn(varId, numberInput.value);
        saveExtensionSettings(context);
    });

    sliderContainer.appendChild(slider);
    sliderContainer.appendChild(numberInput);
    container.appendChild(sliderContainer);
}

function createSelect(container, setting, settings) {
    const context = SillyTavern.getContext();
    const { varId, default: defaultValue, options } = setting;

    const select = document.createElement('select');
    select.id = `cts-${varId}`;
    select.classList.add('widthNatural', 'flex1', 'margin0', 'moonlit-select');

    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.textContent = option.label;
        optionElement.selected = (settings[varId] || defaultValue) === option.value;
        select.appendChild(optionElement);
    });

    select.addEventListener('change', () => {
        settings[varId] = select.value;
        applyThemeSettingFn(varId, select.value);
        saveExtensionSettings(context);
    });

    container.appendChild(select);
}

function createTextInput(container, setting, settings) {
    const context = SillyTavern.getContext();
    const { varId, default: defaultValue } = setting;

    const input = document.createElement('input');
    input.id = `cts-${varId}`;
    input.type = 'text';
    input.value = settings[varId] || defaultValue;
    input.classList.add('text_pole', 'wide100p', 'widthNatural', 'flex1', 'margin0', 'moonlit-input');

    input.addEventListener('change', () => {
        settings[varId] = input.value;
        applyThemeSettingFn(varId, input.value);
        saveExtensionSettings(context);
    });

    container.appendChild(input);
}

function createTextareaInput(container, setting, settings) {
    const context = SillyTavern.getContext();
    const { varId, default: defaultValue } = setting;

    const textarea = document.createElement('textarea');
    textarea.id = `cts-${varId}`;
    textarea.classList.add('text_pole', 'margin0', 'margin-r5', 'textarea_compact', 'monospace');
    textarea.rows = 10;
    textarea.spellcheck = false;
    textarea.value = (settings[varId] ?? defaultValue) || '';

    const apply = () => {
        settings[varId] = textarea.value;
        if (varId === 'rawCustomCss') {
            applyRawCustomCssFn(settings[varId]);
        }
        saveExtensionSettings(context);
    };

    textarea.addEventListener('change', apply);
    textarea.addEventListener('input', apply);

    container.appendChild(textarea);
}

function createCheckbox(container, setting, settings) {
    const context = SillyTavern.getContext();
    const { varId, default: defaultValue, displayText, cssBlock, cssFile, description } = setting;

    const checkboxContainer = document.createElement('div');
    checkboxContainer.classList.add('checkbox-container');
    checkboxContainer.style.display = 'flex';
    checkboxContainer.style.flexDirection = 'column';
    checkboxContainer.style.marginTop = '8px';

    const checkboxRow = document.createElement('div');
    checkboxRow.style.display = 'flex';
    checkboxRow.style.alignItems = 'center';

    const label = document.createElement('label');
    label.htmlFor = `cts-checkbox-${varId}`;
    label.textContent = displayText;
    label.style.marginRight = '8px';
    label.style.cursor = 'pointer';

    const checkbox = document.createElement('input');
    checkbox.id = `cts-checkbox-${varId}`;
    checkbox.type = 'checkbox';
    checkbox.checked = settings[varId] === true;
    checkbox.style.marginLeft = 'auto';

    let styleElement = document.getElementById(`css-block-${varId}`);
    if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = `css-block-${varId}`;
        document.head.appendChild(styleElement);
    }

    function updateInlineCssBlock(enabled) {
        if (!settings.enabled) {
            styleElement.textContent = '';
            return;
        }

        if (styleElement && cssBlock) {
            styleElement.textContent = enabled ? cssBlock : '';
        }
    }

    async function loadExternalCss(enabled) {
        if (!settings.enabled || !enabled || !cssFile) {
            if (styleElement) {
                styleElement.textContent = '';
            }
            return;
        }

        try {
            const cssFilePath = `${EXTENSION_FOLDER_PATH}/css/${cssFile}`;
            const response = await fetch(cssFilePath);
            if (response.ok) {
                const cssText = await response.text();
                if (styleElement) {
                    styleElement.textContent = cssText;
                }
            }
        } catch {
            // Silently ignore CSS loading errors
        }
    }

    async function applyCss(enabled) {
        if (cssFile) {
            await loadExternalCss(enabled);
        } else if (cssBlock) {
            updateInlineCssBlock(enabled);
        }
    }

    void applyCss(checkbox.checked);

    checkbox.addEventListener('change', () => {
        settings[varId] = checkbox.checked;
        void applyCss(checkbox.checked);
        applyThemeSettingFn(varId, checkbox.checked ? 'true' : 'false');
        saveExtensionSettings(context);
    });

    checkboxRow.appendChild(label);
    checkboxRow.appendChild(checkbox);
    checkboxContainer.appendChild(checkboxRow);

    if (description) {
        const descriptionElement = document.createElement('small');
        descriptionElement.textContent = description;
        descriptionElement.style.marginLeft = '0';
        descriptionElement.style.marginTop = '4px';
        descriptionElement.style.opacity = '0.7';
        descriptionElement.style.fontSize = '0.85em';
        checkboxContainer.appendChild(descriptionElement);
    }

    container.appendChild(checkboxContainer);
}

export function updateSettingsUI() {
    const context = SillyTavern.getContext();
    const settings = getExtensionSettings(context);

    themeCustomSettings.forEach(setting => {
        const { varId, type } = setting;
        const value = settings[varId];

        switch (type) {
            case 'color':
                updateColorPickerUI(varId, value);
                break;
            case 'slider':
                updateSliderUI(varId, value);
                break;
            case 'select':
                updateSelectUI(varId, value);
                break;
            case 'text':
                updateTextInputUI(varId, value);
                break;
            case 'checkbox':
                updateCheckboxUI(varId, value);
                break;
        }
    });
}

export function updateColorPickerUI(varId, value) {
    const colorPreview = document.querySelector(`#cts-${varId}-preview`);
    if (colorPreview) {
        colorPreview.style.background = value;
    }

    const colorPicker = document.querySelector(`#cts-${varId}-color`);
    if (colorPicker) {
        if (typeof colorPicker.setColor === 'function') {
            colorPicker.setColor(value);
        } else {
            colorPicker.setAttribute('color', value);
        }
    }

    const textInput = document.querySelector(`#cts-${varId}-text`);
    if (textInput) {
        const hexValue = rgbaToHex(value);
        textInput.value = hexValue || value;
    }

    const alphaSlider = document.querySelector(`#cts-${varId}-alpha`);
    const alphaValue = document.querySelector(`#cts-${varId}-alpha-value`);

    if (alphaSlider && alphaValue) {
        const alpha = getAlphaFromRgba(value);
        const alphaPercent = Math.round(alpha * 100);
        alphaSlider.value = alphaPercent;
        alphaValue.textContent = alphaPercent;

        const hexColor = rgbaToHex(value);
        if (hexColor) {
            setTimeout(() => {
                updateColorSliderThumb(varId, hexColor);
            }, 10);
        }
    }
}

function updateSliderUI(varId, value) {
    const slider = document.querySelector(`#cts-slider-${varId}`);
    if (slider) {
        slider.value = value;
    }

    const numberInput = document.querySelector(`#cts-number-${varId}`);
    if (numberInput) {
        numberInput.value = value;
    }
}

export function updateSelectUI(varId, value) {
    const select = document.querySelector(`#cts-${varId}`);
    if (!select) return;

    const settingConfig = themeCustomSettings.find(s => s.varId === varId);
    if (!settingConfig || !settingConfig.options) return;

    select.innerHTML = '';

    settingConfig.options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.textContent = option.label;
        optionElement.selected = value === option.value;
        select.appendChild(optionElement);
    });

    select.value = value;
}

export function updateTextInputUI(varId, value) {
    const input = document.querySelector(`#cts-${varId}`);
    if (input) {
        input.value = value;
    }
}

export function updateCheckboxUI(varId, value) {
    const checkbox = document.querySelector(`#cts-checkbox-${varId}`);
    if (checkbox) {
        checkbox.checked = value === true;
    }
}

function updateColorSliderThumb(varId, hexColor) {
    const alphaSlider = document.querySelector(`#cts-${varId}-alpha`);
    if (!alphaSlider) return;

    let styleElement = document.getElementById(`thumb-style-${varId}`);
    if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = `thumb-style-${varId}`;
        document.head.appendChild(styleElement);
    }

    const newThumbStyle = `
        #cts-${varId}-alpha::-webkit-slider-thumb {
            appearance: none;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: ${hexColor};
            border: 1px solid color-mix(in srgb, var(--SmartThemeBodyColor) 10%, transparent);
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
            cursor: pointer;
        }
        #cts-${varId}-alpha::-moz-range-thumb {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: ${hexColor};
            border: 1px solid color-mix(in srgb, var(--SmartThemeBodyColor) 10%, transparent);
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
            cursor: pointer;
        }
    `;

    styleElement.textContent = newThumbStyle;
}

document.addEventListener('colorChanged', (event) => {
    const { varId, hexColor } = event.detail;
    updateColorSliderThumb(varId, hexColor);
});

function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
