// ==UserScript==
// @name         Axiom Trade - Translate - Discord: autorun__
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Axiom Trade - Translate - Discord: autorun__
// @author       Discord: autorun__
// @match        https://axiom.trade/*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @connect      translate.googleapis.com
// @require      https://gist.githubusercontent.com/arantius/3123124/raw/grant-none-shim.js
// ==/UserScript==

(function () {
    'use strict';

    const CONFIG = {
        TRANSLATE_TO: 'fr', // Select language
        CHECK_INTERVAL: 500,
        MAX_RETRIES: 3,
        FREEZE_CONTENT: true
    };

    GM_addStyle(`
        .frozen-translation {
            position: relative;
            border-left: 3px solid #4CAF50;
            padding-left: 8px;
            background-color: rgba(76, 175, 80, 0.05);
        }
        .translate-link {
            display: inline-block;
            margin-left: 10px;
            font-size: 0.8em;
            color: #1da1f2;
            cursor: pointer;
            background-color: rgba(29, 161, 242, 0.1);
            padding: 0 5px;
            border-radius: 3px;
            text-decoration: none;
        }
        .translate-link:hover {
            text-decoration: underline;
            background-color: rgba(29, 161, 242, 0.2);
        }
        .translation-original {
            border-left-color: #FF9800;
            background-color: rgba(255, 152, 0, 0.05);
        }
    `);

    const translationCache = {};
    const originalTextStore = new WeakMap();
    const activeTweets = new WeakSet();

    function createTranslateLink() {
        const link = document.createElement('span');
        link.className = 'translate-link';
        link.textContent = 'Translate';
        return link;
    }

    function freezeElement(element) {
        if (element.dataset.frozen === 'true') return element;

        const clone = element.cloneNode(true);
        clone.dataset.frozen = 'true';
        clone.classList.add('frozen-translation');

        const timeElement = clone.querySelector('time');
        if (timeElement) {
            const translateLink = createTranslateLink();
            timeElement.parentNode.insertBefore(translateLink, timeElement.nextSibling);

            translateLink.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                toggleTranslation(clone);
            });
        }

        element.parentNode.replaceChild(clone, element);
        return clone;
    }

    function toggleTranslation(element) {
        const isShowingOriginal = element.classList.contains('translation-original');

        const textNodes = collectTextNodes(element);
        textNodes.forEach(node => {
            const originalText = originalTextStore.get(node);
            if (originalText) {
                const currentText = node.textContent;
                node.textContent = originalText;
                originalTextStore.set(node, currentText);
            }
        });

        element.classList.toggle('translation-original');
    }

    async function deepTranslateAndFreeze(element) {
        if (element.dataset.translated === 'true') return;

        if (element.dataset.translating === 'true') {
            setTimeout(() => deepTranslateAndFreeze(element), 500);
            return;
        }

        element.dataset.translating = 'true';
        const frozenContainer = freezeElement(element);
        const textNodes = collectTextNodes(frozenContainer);

        for (const node of textNodes) {
            const originalText = node.textContent.trim();
            if (!originalText) continue;

            originalTextStore.set(node, originalText);
            let translatedText = await translateWithRetry(originalText);
            node.textContent = node.textContent.replace(originalText, translatedText);
        }

        frozenContainer.dataset.translated = 'true';
        activeTweets.add(frozenContainer);
        delete frozenContainer.dataset.translating;
    }

    function collectTextNodes(element) {
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: node => {
                    if (!node.textContent.trim()) return NodeFilter.FILTER_REJECT;
                    if (node.parentNode.closest('a, .tweet-actions_likeCount__MyxBd, .translate-link')) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        const nodes = [];
        let currentNode;
        while (currentNode = walker.nextNode()) {
            nodes.push(currentNode);
        }
        return nodes;
    }

    function translateWithRetry(text, retry = 0) {
        return new Promise((resolve) => {
            if (translationCache[text]) {
                resolve(translationCache[text]);
                return;
            }

            const apiUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${CONFIG.TRANSLATE_TO}&dt=t&q=${encodeURIComponent(text)}`;

            GM_xmlhttpRequest({
                method: "GET",
                url: apiUrl,
                onload: function (response) {
                    try {
                        const data = JSON.parse(response.responseText);
                        const translatedText = data[0].map(item => item[0]).join('');
                        translationCache[text] = translatedText;
                        resolve(translatedText);
                    } catch (e) {
                        console.error('Erreur de traduction:', e);
                        if (retry < CONFIG.MAX_RETRIES) {
                            setTimeout(() => {
                                translateWithRetry(text, retry + 1).then(resolve);
                            }, 1000 * (retry + 1));
                        } else {
                            resolve(text);
                        }
                    }
                },
                onerror: function (error) {
                    console.error('API error:', error);
                    if (retry < CONFIG.MAX_RETRIES) {
                        setTimeout(() => {
                            translateWithRetry(text, retry + 1).then(resolve);
                        }, 1000 * (retry + 1));
                    } else {
                        resolve(text);
                    }
                }
            });
        });
    }

    function cleanUpRemovedTweets() {
        Object.keys(translationCache).forEach(text => {
            let isTextInUse = false;
            document.querySelectorAll('.tweet-container_article__0ERPK').forEach(tweet => {
                if (tweet.textContent.includes(text)) {
                    isTextInUse = true;
                }
            });
            if (!isTextInUse) {
                delete translationCache[text];
            }
        });
    }

    function checkForNewTweets() {
        document.querySelectorAll('.tweet-container_article__0ERPK:not([data-translated])').forEach(tweet => {
            deepTranslateAndFreeze(tweet);
        });
        cleanUpRemovedTweets();
    }

    const observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            mutation.addedNodes.forEach(function (node) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.matches('.tweet-container_article__0ERPK')) {
                        deepTranslateAndFreeze(node);
                    }
                    if (node.querySelectorAll) {
                        node.querySelectorAll('.tweet-container_article__0ERPK').forEach(tweet => {
                            deepTranslateAndFreeze(tweet);
                        });
                    }
                }
            });
            mutation.removedNodes.forEach(function (node) {
                if (node.nodeType === Node.ELEMENT_NODE && node.matches('.tweet-container_article__0ERPK')) {
                    cleanUpRemovedTweets();
                }
            });
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    window.addEventListener('load', function () {
        checkForNewTweets();
        setInterval(checkForNewTweets, CONFIG.CHECK_INTERVAL);
    });
})();

// Discord: autorun__
