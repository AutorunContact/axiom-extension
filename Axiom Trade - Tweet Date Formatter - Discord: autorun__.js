// ==UserScript==
// @name         Axiom Trade - Tweet Date Formatter - Discord: autorun__
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Axiom Trade - Tweet Date Formatter - Discord: autorun__
// @author       Discord: autorun__
// @match        https://axiom.trade/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const MARKER_ATTR = "data-date-formatted";

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    function timeAgo(date) {
        const now = new Date();
        const diff = now - date;

        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) {
            return `${days} day${days > 1 ? 's' : ''}`;
        } else if (hours > 0) {
            return `${hours} hour${hours > 1 ? 's' : ''}`;
        } else if (minutes > 0) {
            return `${minutes} minute${minutes > 1 ? 's' : ''}`;
        } else {
            return `1 minute`;
        }
    }

    function formatDateEN(date) {
        const day = date.getDate().toString().padStart(2, '0');
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();

        let hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;

        return `${day} ${month} ${year} - ${hours}:${minutes} ${ampm}`;
    }

    function formatTweetDates() {
        const tweetDates = document.querySelectorAll(`.tweet-info-created-at_root__KaxZi time:not([${MARKER_ATTR}])`);

        tweetDates.forEach(dateElement => {
            const tweetDateStr = dateElement.getAttribute('datetime');
            if (!tweetDateStr) return;

            const tweetDate = new Date(tweetDateStr);
            if (!isNaN(tweetDate)) {
                const formattedDate = formatDateEN(tweetDate);
                const timeAgoText = timeAgo(tweetDate);
                dateElement.textContent = `${formattedDate} (${timeAgoText})`;
                dateElement.style.fontWeight = "bold";
                dateElement.setAttribute(MARKER_ATTR, "true");
            }
        });
    }

    function debounce(fn, delay) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn(...args), delay);
        };
    }

    const debouncedFormatTweetDates = debounce(formatTweetDates, 100);

    const tweetContainer = document.querySelector('.tweets-container') || document.body;
    const observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            if (mutation.addedNodes.length > 0) {
                debouncedFormatTweetDates();
                break;
            }
        }
    });

    observer.observe(tweetContainer, { childList: true, subtree: true });
    formatTweetDates();
})();

// Discord: autorun__
