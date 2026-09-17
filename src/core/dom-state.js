/**
 * Tracks the small set of optional companion-extension DOM states that Moonlit
 * styles need. Keeping these states as Moonlit-owned body classes avoids the
 * document-wide CSS :has() invalidation that Chromium performs on viewport
 * changes after one of the optional elements has appeared.
 */

const stateClasses = Object.freeze({
    extensionTopBar: 'moonlit-has-extension-topbar',
    connectionProfiles: 'moonlit-connection-profiles-visible',
    stwiiTrigger: 'moonlit-has-stwii-trigger',
    extensionPanel: 'moonlit-extension-panel-visible',
    chatsPlusTabRow: 'moonlit-has-chatsplus-tab-row',
    slideToggle: 'moonlit-slide-toggle-shown',
    lacommonQuickActions: 'moonlit-has-lacommon-quick-actions',
});

const stateClassNames = Object.freeze(Object.values(stateClasses));
const relevantIds = new Set([
    'extensionTopBar',
    'extensionConnectionProfiles',
    'extensionSideBar',
    'chatsplus-tab-row',
]);
const relevantClasses = new Set([
    'stwii--trigger',
    'lacommon--quickActions',
]);
const relevantSelector = [
    '#extensionTopBar',
    '#extensionConnectionProfiles',
    '#extensionSideBar',
    '.stwii--trigger',
    '#chatsplus-tab-row',
    '.lacommon--quickActions',
    '[data-slide-toggle]',
].join(', ');

function isElement(node) {
    return node?.nodeType === Node.ELEMENT_NODE;
}

function hasRelevantClass(className) {
    return String(className ?? '').split(/\s+/).some((name) => relevantClasses.has(name));
}

function elementCanAffectMoonlitState(element) {
    return element.matches(relevantSelector) || Boolean(element.querySelector(relevantSelector));
}

function nodeCanAffectMoonlitState(node) {
    return isElement(node) && elementCanAffectMoonlitState(node);
}

/**
 * Creates an idempotent controller for the body classes consumed by Moonlit's
 * optional companion-extension styles.
 *
 * @returns {{start: () => void, stop: () => void, refresh: () => void}}
 */
export function createMoonlitDomStateController() {
    let active = false;
    let observer = null;
    let animationFrame = null;
    let domReadyListener = null;

    function setBodyClass(className, enabled) {
        const body = document.body;
        if (!body || body.classList.contains(className) === enabled) {
            return;
        }

        body.classList.toggle(className, enabled);
    }

    function refresh() {
        animationFrame = null;
        if (!active || !document.body) {
            return;
        }

        const connectionProfiles = document.getElementById('extensionConnectionProfiles');
        const extensionSideBar = document.getElementById('extensionSideBar');
        const connectionProfilesVisible = connectionProfiles?.classList.contains('visible') === true;
        const extensionSideBarVisible = extensionSideBar?.classList.contains('visible') === true;

        setBodyClass(stateClasses.extensionTopBar, Boolean(document.getElementById('extensionTopBar')));
        setBodyClass(stateClasses.connectionProfiles, connectionProfilesVisible);
        setBodyClass(stateClasses.stwiiTrigger, Boolean(document.querySelector('.stwii--trigger')));
        setBodyClass(stateClasses.extensionPanel, connectionProfilesVisible || extensionSideBarVisible);
        setBodyClass(stateClasses.chatsPlusTabRow, Boolean(document.getElementById('chatsplus-tab-row')));
        setBodyClass(stateClasses.slideToggle, Boolean(document.querySelector('[data-slide-toggle="shown"]')));
        setBodyClass(stateClasses.lacommonQuickActions, Boolean(document.querySelector('.lacommon--quickActions')));
    }

    function scheduleRefresh() {
        if (!active || animationFrame !== null) {
            return;
        }

        animationFrame = requestAnimationFrame(refresh);
    }

    function attributeCanAffectMoonlitState(mutation) {
        const target = mutation.target;
        if (!isElement(target) || target === document.body) {
            return false;
        }

        if (elementCanAffectMoonlitState(target)) {
            return true;
        }

        if (mutation.attributeName === 'id') {
            return relevantIds.has(mutation.oldValue);
        }

        if (mutation.attributeName === 'class') {
            return hasRelevantClass(mutation.oldValue);
        }

        return mutation.attributeName === 'data-slide-toggle' && mutation.oldValue === 'shown';
    }

    function mutationCanAffectMoonlitState(mutation) {
        if (mutation.type === 'attributes') {
            return attributeCanAffectMoonlitState(mutation);
        }

        for (const node of mutation.addedNodes) {
            if (nodeCanAffectMoonlitState(node)) {
                return true;
            }
        }

        for (const node of mutation.removedNodes) {
            if (nodeCanAffectMoonlitState(node)) {
                return true;
            }
        }

        return false;
    }

    function startObserving() {
        if (observer || !document.body) {
            return;
        }

        observer = new MutationObserver((mutations) => {
            if (mutations.some(mutationCanAffectMoonlitState)) {
                scheduleRefresh();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeOldValue: true,
            attributeFilter: ['class', 'id', 'data-slide-toggle'],
        });
    }

    function start() {
        active = true;

        if (!document.body) {
            if (!domReadyListener) {
                domReadyListener = () => {
                    domReadyListener = null;
                    if (active) {
                        start();
                    }
                };
                document.addEventListener('DOMContentLoaded', domReadyListener, { once: true });
            }
            return;
        }

        refresh();
        startObserving();
    }

    function stop() {
        active = false;
        observer?.disconnect();
        observer = null;

        if (animationFrame !== null) {
            cancelAnimationFrame(animationFrame);
            animationFrame = null;
        }

        if (domReadyListener) {
            document.removeEventListener('DOMContentLoaded', domReadyListener);
            domReadyListener = null;
        }

        for (const className of stateClassNames) {
            document.body?.classList.remove(className);
        }
    }

    return { start, stop, refresh };
}
