// ==UserScript==
// @name         Axiom Trade - Tweet Date Colorizer - t.me/darkteam_crypto
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Color the tweet dates based on the current time
// @author       TG : t.me/darkteam_crypto
// @match        https://axiom.trade/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const MARKER_ATTR = "data-date-colorized";
    let debounceTimer;

    function colorizeTweetDates() {
        const tweetDates = document.querySelectorAll(`.tweet-info-created-at_root__KaxZi time:not([${MARKER_ATTR}])`);
        const now = new Date();
        const oneHour = 60 * 60 * 1000;

        tweetDates.forEach(dateElement => {
            const tweetDateStr = dateElement.getAttribute('datetime');
            const tweetDate = new Date(tweetDateStr);
            const timeDiff = now - tweetDate;

            const isToday = tweetDate.getDate() === now.getDate() &&
                          tweetDate.getMonth() === now.getMonth() &&
                          tweetDate.getFullYear() === now.getFullYear();

            dateElement.style.fontWeight = 'bold';
            dateElement.style.color = (isToday && timeDiff < oneHour) ? 'green' : 'red';
            dateElement.setAttribute(MARKER_ATTR, "true");
        });
    }

    function handleChanges() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(colorizeTweetDates, 200);
    }

    colorizeTweetDates();

    const tweetContainer = document.querySelector('.tweets-container') || document.body;
    const observer = new MutationObserver(handleChanges);
    observer.observe(tweetContainer, { childList: true, subtree: true });

    setInterval(colorizeTweetDates, 1000);
})();

// https://t.me/darkteam_crypto - @autoruncrypto
