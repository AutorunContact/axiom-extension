// ==UserScript==
// @name         Axiom Trade - Translate - t.me/darkteam_crypto
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Axiom Trade - Translate Tweet (X)
// @author       TG : @autoruncrypto
// @match        https://axiom.trade/*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @connect      translate.googleapis.com
// @require      https://gist.githubusercontent.com/arantius/3123124/raw/grant-none-shim.js
// ==/UserScript==

(function() {
    'use strict';

    // config
    const CONFIG = {
        TRANSLATE_TO: 'fr', // Select language: Default - FR (French)
        CHECK_INTERVAL: 1000,
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
        .frozen-translation::before {
            content: "Traduit";
            position: absolute;
            top: -10px;
            right: 5px;
            font-size: 0.7em;
            color: #4CAF50;
            background: white;
            padding: 0 5px;
        }
    `);

    const translationCache = {};

    function freezeElement(element) {
        if (element.dataset.frozen === 'true') return element;

        const clone = element.cloneNode(true);
        clone.dataset.frozen = 'true';
        clone.classList.add('frozen-translation');

        element.parentNode.replaceChild(clone, element);

        return clone;
    }

    async function deepTranslateAndFreeze(element) {
        if (element.dataset.translated === 'true') return;

        element.dataset.translating = 'true';

        const frozenContainer = freezeElement(element);

        const textNodes = collectTextNodes(frozenContainer);

        for (const node of textNodes) {
            const originalText = node.textContent.trim();
            if (!originalText) continue;

            let translatedText = await translateWithRetry(originalText);
            node.textContent = node.textContent.replace(originalText, translatedText);
        }

        frozenContainer.dataset.translated = 'true';
        delete frozenContainer.dataset.translating;
    }

    function collectTextNodes(element) {
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: node => {
                    if (!node.textContent.trim()) return NodeFilter.FILTER_REJECT;
                    if (node.parentNode.closest('a, time, .tweet-actions_likeCount__MyxBd')) {
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
                onload: function(response) {
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
                onerror: function(error) {
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

    function checkForNewTweets() {
        document.querySelectorAll('.tweet-container_article__0ERPK:not([data-translated]):not([data-translating])').forEach(tweet => {
            deepTranslateAndFreeze(tweet);
        });
    }

    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
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
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    window.addEventListener('load', function() {
        checkForNewTweets();
        setInterval(checkForNewTweets, CONFIG.CHECK_INTERVAL);
    });

})();

// https://t.me/darkteam_crypto - @autoruncrypto