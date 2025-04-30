// ==UserScript==
// @name         Axiom Trade - User-Tracker - t.me/darkteam_crypto
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  This script lets you quickly spot tokens linked to specific users, with a management UI
// @author       TG : t.me/darkteam_crypto
// @match        https://axiom.trade/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_setClipboard
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';
    console.log("✅ Script OK!");

    // Initialize storage if empty
    if (!GM_getValue('targetUsernames')) {
        GM_setValue('targetUsernames', [
            "elonmusk",
            "@realDonaldTrump"
        ]);
    }

    const MARKER_ATTR = "data-plume-modified";

    // Dark UI CSS
    const css = `
        .dt-user-manager {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            font-family: 'Segoe UI', Roboto, sans-serif;
        }

        .dt-toggle-btn {
            display: none;
        }

        .dt-panel {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 600px;
            height: 70vh;
            max-height: 550px;
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
            display: none;
            z-index: 10000;
            flex-direction: column;
        }

        .dt-panel.visible {
            display: flex;
        }

        .dt-title {
            color: #e0e0e0;
            margin: 0 0 20px 0;
            font-size: 20px;
            border-bottom: 1px solid #333;
            padding-bottom: 10px;
        }

        .dt-input-group {
            display: flex;
            margin-bottom: 15px;
        }

        .dt-input {
            flex-grow: 1;
            background: #2a2a2a;
            border: 1px solid #333;
            color: #e0e0e0;
            padding: 10px 15px;
            border-radius: 6px;
            outline: none;
            font-size: 14px;
            margin-right: 10px;
        }

        .dt-input:focus {
            border-color: #555;
        }

        .dt-textarea {
            width: 100%;
            height: 100px;
            background: #2a2a2a;
            border: 1px solid #333;
            color: #e0e0e0;
            padding: 10px;
            border-radius: 6px;
            margin-bottom: 15px;
            resize: vertical;
            font-family: monospace;
        }

        .dt-btn {
            background: #333;
            color: #e0e0e0;
            border: none;
            padding: 10px 15px;
            cursor: pointer;
            transition: background 0.2s;
            font-size: 14px;
            border-radius: 6px;
            margin-left: 5px;
            white-space: nowrap;
        }

        .dt-btn:hover {
            background: #444;
        }

        .dt-btn-primary {
            background: #3a5c8a;
        }

        .dt-btn-primary:hover {
            background: #4a6c9a;
        }

        .dt-btn-success {
            background: #3a8a5c;
        }

        .dt-btn-success:hover {
            background: #4a9a6c;
        }

        .dt-btn-danger {
            background: #8a3a5c;
        }

        .dt-btn-danger:hover {
            background: #9a4a6c;
        }

        .dt-list {
            flex-grow: 1;
            overflow-y: auto;
            margin-bottom: 15px;
            border: 1px solid #333;
            border-radius: 6px;
            background: #222;
            max-height: 300px;
            scrollbar-width: thin;
            scrollbar-color: #555 #222;
        }

        .dt-list::-webkit-scrollbar {
            width: 8px;
        }

        .dt-list::-webkit-scrollbar-track {
            background: #222;
        }

        .dt-list::-webkit-scrollbar-thumb {
            background-color: #555;
            border-radius: 4px;
        }

        .dt-list-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 15px;
            background: #2a2a2a;
            border-bottom: 1px solid #333;
            color: #e0e0e0;
            min-height: 20px;
            box-sizing: border-box;
        }

        .dt-delete-btn {
            background: #5a2a2a;
            color: #e0a0a0;
            border: none;
            border-radius: 4px;
            padding: 5px 10px;
            cursor: pointer;
            font-size: 12px;
        }

        .dt-delete-btn:hover {
            background: #6a3a3a;
        }

        .dt-footer {
            font-size: 12px;
            color: #666;
            text-align: right;
            margin-top: 10px;
            position: absolute;
            bottom: 10px;
            right: 20px;
        }

        .dt-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            z-index: 9999;
            display: none;
        }

        .dt-overlay.visible {
            display: block;
        }

        .dt-close-btn {
            position: absolute;
            top: 15px;
            right: 15px;
            background: none;
            border: none;
            color: #e0e0e0;
            font-size: 20px;
            cursor: pointer;
        }

        .dt-tab-content {
            display: none;
        }

        .dt-tab-content.active {
            display: block;
            flex-grow: 1;
            display: flex;
            flex-direction: column;
        }

        .dt-tabs {
            display: flex;
            margin-bottom: 15px;
            border-bottom: 1px solid #333;
        }

        .dt-tab {
            padding: 8px 15px;
            cursor: pointer;
            color: #aaa;
            border-bottom: 2px solid transparent;
        }

        .dt-tab.active {
            color: #e0e0e0;
            border-bottom: 2px solid #3a5c8a;
        }

        .dt-import-export {
            display: flex;
            flex-direction: column;
            flex-grow: 1;
        }

        .dt-format-hint {
            font-size: 12px;
            color: #666;
            margin-bottom: 10px;
        }

        /* Style for the new button */
        .dt-axiom-button {
            background: var(--primaryStroke);
            display: flex;
            flex-direction: row;
            height: 32px;
            padding: 0 12px;
            gap: 8px;
            justify-content: center;
            align-items: center;
            border-radius: 9999px;
            transition: background-color 150ms ease-in-out;
            cursor: pointer;
            border: none;
            color: inherit;
            font: inherit;
        }

        .dt-axiom-button:hover {
            background: var(--secondaryStroke)/0.8 !important;
        }

        .dt-axiom-button i {
            font-size: 18px;
        }

        .dt-axiom-button span {
            font-size: 14px;
            font-weight: bold;
            white-space: nowrap;
        }

        .dt-axiom-button .arrow {
            font-size: 18px;
        }

        /* Notification styles */
        .dt-notification-container {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            z-index: 99999;
            pointer-events: none;
            padding-top: 10px;
        }

        .dt-notification {
            background: #18191b;
            border: 1px solid var(--secondaryStroke);
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            border-radius: 8px;
            pointer-events: auto;
            display: flex;
            align-items: center;
            padding: 16px;
            height: 52px;
            gap: 16px;
            margin-bottom: 10px;
            transform: translateY(-100px);
            opacity: 0;
            transition: transform 0.3s ease-out, opacity 0.3s ease-out;
        }

        .dt-notification.show {
            transform: translateY(0);
            opacity: 1;
        }

        .dt-notification-close button {
            width: 24px;
            height: 24px;
            border: 1px solid transparent;
            border-radius: 4px;
            padding: 3px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 500;
            background: none;
            cursor: pointer;
            color: var(--textTertiary);
        }

        .dt-notification-close button:hover {
            background: var(--primaryStroke)/0.6;
        }

        .dt-notification-close i {
            font-size: 20px;
        }
    `;

    // Add CSS to the page
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    // Create notification container
    const notificationContainer = document.createElement('div');
    notificationContainer.className = 'dt-notification-container';
    document.body.appendChild(notificationContainer);

    // Notification function
    function showNotification(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `dt-notification animate-enter bg-backgroundTertiary border border-secondaryStroke shadow-lg rounded-[8px] sm:rounded-[4px] pointer-events-auto flex items-center p-[16px] h-[52px] gap-[16px]`;

        // Set icon based on type
        let iconClass, iconColor;
        switch(type) {
            case 'success':
                iconClass = 'ri-checkbox-circle-fill';
                iconColor = 'text-increase';
                break;
            case 'warning':
                iconClass = 'ri-error-warning-fill';
                iconColor = 'text-warning';
                break;
            case 'error':
                iconClass = 'ri-close-circle-fill';
                iconColor = 'text-decrease';
                break;
            default:
                iconClass = 'ri-information-fill';
                iconColor = 'text-textSecondary';
        }

        notification.innerHTML = `
            <div class="">
                <div class="flex items-center gap-[8px]">
                    <div class="flex items-center justify-center w-[20px] h-[20px]">
                        <i class="${iconClass} ${iconColor} text-[16px]"></i>
                    </div>
                    <div class="text-[14px] leading-[20px] font-normal text-textPrimary">${message}</div>
                </div>
            </div>
            <div class="flex">
                <button class="w-[24px] h-[24px] border border-transparent rounded-[4px] p-3 flex items-center justify-center text-sm font-medium hover:bg-primaryStroke/60">
                    <i class="ri-close-line text-textTertiary text-[20px]"></i>
                </button>
            </div>
        `;

        const closeButton = notification.querySelector('button');
        closeButton.addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        });

        notificationContainer.appendChild(notification);

        // Trigger animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // Auto-remove if duration is set
        if (duration > 0) {
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, duration);
        }

        return notification;
    }

    // Create UI elements
    const overlay = document.createElement('div');
    overlay.className = 'dt-overlay';

    const panel = document.createElement('div');
    panel.className = 'dt-panel';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'dt-close-btn';
    closeBtn.innerHTML = '&times;';
    closeBtn.title = 'Close';

    const title = document.createElement('h3');
    title.className = 'dt-title';
    title.textContent = 'Tracked Users Management';

    // Create tabs
    const tabs = document.createElement('div');
    tabs.className = 'dt-tabs';

    const manageTab = document.createElement('div');
    manageTab.className = 'dt-tab active';
    manageTab.textContent = 'Manage';
    manageTab.dataset.tab = 'manage';

    const importExportTab = document.createElement('div');
    importExportTab.className = 'dt-tab';
    importExportTab.textContent = 'Import/Export';
    importExportTab.dataset.tab = 'import-export';

    tabs.appendChild(manageTab);
    tabs.appendChild(importExportTab);

    // Create tab contents
    const tabContents = document.createElement('div');
    tabContents.className = 'dt-tab-contents';

    // Manage tab content
    const manageContent = document.createElement('div');
    manageContent.className = 'dt-tab-content active';
    manageContent.id = 'manage-tab';

    const inputGroup = document.createElement('div');
    inputGroup.className = 'dt-input-group';

    const input = document.createElement('input');
    input.className = 'dt-input';
    input.type = 'text';
    input.placeholder = 'Enter username (e.g., elonmusk)';

    const addBtn = document.createElement('button');
    addBtn.className = 'dt-btn dt-btn-primary';
    addBtn.textContent = 'Add';

    const list = document.createElement('div');
    list.className = 'dt-list';

    inputGroup.appendChild(input);
    inputGroup.appendChild(addBtn);

    manageContent.appendChild(inputGroup);
    manageContent.appendChild(list);

    // Import/Export tab content
    const importExportContent = document.createElement('div');
    importExportContent.className = 'dt-tab-content';
    importExportContent.id = 'import-export-tab';

    const importExportContainer = document.createElement('div');
    importExportContainer.className = 'dt-import-export';

    const jsonTextarea = document.createElement('textarea');
    jsonTextarea.className = 'dt-textarea';
    jsonTextarea.placeholder = 'Paste JSON array or comma-separated usernames here...';

    const formatHint = document.createElement('div');
    formatHint.className = 'dt-format-hint';
    formatHint.textContent = 'Formats accepted: [{"h":"username"},...] or "user1", "user2"';

    const importBtn = document.createElement('button');
    importBtn.className = 'dt-btn dt-btn-success';
    importBtn.textContent = 'Import';

    const exportSimpleBtn = document.createElement('button');
    exportSimpleBtn.className = 'dt-btn';
    exportSimpleBtn.textContent = 'Export as List';

    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'dt-input-group';
    buttonGroup.style.marginTop = '10px';

    buttonGroup.appendChild(importBtn);
    buttonGroup.appendChild(exportSimpleBtn);

    importExportContainer.appendChild(formatHint);
    importExportContainer.appendChild(jsonTextarea);
    importExportContainer.appendChild(buttonGroup);
    importExportContent.appendChild(importExportContainer);

    tabContents.appendChild(manageContent);
    tabContents.appendChild(importExportContent);

    const footer = document.createElement('div');
    footer.className = 'dt-footer';
    footer.textContent = 'DarkTeam - t.me/darkteam_crypto';

    // Assemble UI
    panel.appendChild(closeBtn);
    panel.appendChild(title);
    panel.appendChild(tabs);
    panel.appendChild(tabContents);
    panel.appendChild(footer);

    document.body.appendChild(overlay);
    document.body.appendChild(panel);

    // Create the button for Axiom UI
    const createAxiomButton = () => {
        if (document.querySelector('.dt-axiom-button')) {
            return null;
        }

        const buttonContainer = document.createElement('span');
        buttonContainer.className = 'contents';

        const button = document.createElement('button');
        button.className = 'dt-axiom-button';
        button.innerHTML = `
            <div class="relative"><i class="ri-user-search-line"></i></div>
            <div class="whitespace-nowrap flex flex-row gap-[4px] justify-start items-center">
                <span class="text-[14px] font-bold">User-Tracker</span>
            </div>
        `;

        button.addEventListener('click', (e) => {
            e.stopPropagation();
            togglePanel(true);
        });

        buttonContainer.appendChild(button);
        return buttonContainer;
    };

    const waitForElement = () => {
        let timeoutId;
        const targetSelector = '.flex.flex-row.gap-4.items-center';
        const buttonClass = 'dt-axiom-button';

        const observer = new MutationObserver((mutations) => {
            if (timeoutId) return;

            timeoutId = setTimeout(() => {
                const target = document.querySelector(targetSelector);
                if (target && !target.querySelector(`.${buttonClass}`)) {
                    const button = createAxiomButton();
                    button && target.insertBefore(button, target.firstChild);
                }
                timeoutId = null;
            }, 200);
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: false,
            characterData: false
        });
    };

    waitForElement();

    // Tab switching
    tabs.addEventListener('click', (e) => {
        const tab = e.target.closest('.dt-tab');
        if (!tab) return;

        // Update active tab
        document.querySelectorAll('.dt-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Show corresponding content
        const tabId = `${tab.dataset.tab}-tab`;
        document.querySelectorAll('.dt-tab-content').forEach(c => c.classList.remove('active'));
        document.getElementById(tabId).classList.add('active');
    });

    // Toggle panel visibility
    function togglePanel(show) {
        if (show) {
            panel.classList.add('visible');
            overlay.classList.add('visible');
            document.body.style.overflow = 'hidden';
            input.focus();
        } else {
            panel.classList.remove('visible');
            overlay.classList.remove('visible');
            document.body.style.overflow = '';
        }
    }

    // Close panel when clicking outside
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            togglePanel(false);
        }
    });

    // Fix close button
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePanel(false);
    });

    // Load and display users
    function loadUsers() {
        list.innerHTML = '';
        const users = GM_getValue('targetUsernames', []);

        users.forEach(username => {
            const item = document.createElement('div');
            item.className = 'dt-list-item';

            const nameSpan = document.createElement('span');
            nameSpan.textContent = username;

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'dt-delete-btn';
            deleteBtn.textContent = 'Delete';

            deleteBtn.addEventListener('click', () => {
                const updatedUsers = users.filter(u => u !== username);
                GM_setValue('targetUsernames', updatedUsers);
                loadUsers();
                showNotification(`User "${username}" removed`, 'success');
            });

            item.appendChild(nameSpan);
            item.appendChild(deleteBtn);
            list.appendChild(item);
        });
    }

    // Add new user
    addBtn.addEventListener('click', () => {
        const username = input.value.trim();
        if (username) {
            const users = GM_getValue('targetUsernames', []);
            if (!users.includes(username)) {
                users.push(username);
                GM_setValue('targetUsernames', users);
                loadUsers();
                input.value = '';
                showNotification(`User "${username}" added to tracking`, 'success');
            } else {
                showNotification(`User "${username}" is already being tracked`, 'warning');
            }
        }
    });

    // Also allow adding with Enter key
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addBtn.click();
        }
    });

    // Import users from JSON or comma-separated list
    importBtn.addEventListener('click', () => {
        const inputText = jsonTextarea.value.trim();
        if (!inputText) return;

        let usernames = [];

        try {
            // Try to parse as JSON array
            if (inputText.startsWith('[')) {
                const jsonData = JSON.parse(inputText);
                usernames = jsonData.map(item => {
                    if (typeof item === 'string') return item;
                    if (typeof item === 'object' && item.h) return item.h;
                    return null;
                }).filter(Boolean);
            }
            // Try to parse as comma-separated list
            else if (inputText.includes('"') || inputText.includes(',')) {
                // Clean and split the input
                usernames = inputText.split(',')
                    .map(name => name.trim().replace(/^["']|["']$/g, ''))
                    .filter(name => name.length > 0);
            }
            // Fallback to line-separated list
            else {
                usernames = inputText.split('\n')
                    .map(name => name.trim())
                    .filter(name => name.length > 0);
            }

            if (usernames.length > 0) {
                const currentUsers = GM_getValue('targetUsernames', []);
                const newUsers = [...new Set([...currentUsers, ...usernames])]; // Remove duplicates
                GM_setValue('targetUsernames', newUsers);
                loadUsers();
                jsonTextarea.value = '';

                showNotification(`Imported ${usernames.length} users successfully`, 'success');

                // Switch back to manage tab
                document.querySelectorAll('.dt-tab').forEach(t => t.classList.remove('active'));
                manageTab.classList.add('active');
                document.querySelectorAll('.dt-tab-content').forEach(c => c.classList.remove('active'));
                manageContent.classList.add('active');
            } else {
                showNotification('No valid usernames found in input', 'warning');
            }
        } catch (e) {
            showNotification('Error parsing input: ' + e.message, 'error');
        }
    });

    // Export users as simple list
    exportSimpleBtn.addEventListener('click', () => {
        const users = GM_getValue('targetUsernames', []);
        const quotedUsers = users.map(username => `"${username}"`);
        jsonTextarea.value = quotedUsers.join(', ');

        // Copy to clipboard
        GM_setClipboard(quotedUsers.join(', '));
        showNotification('User list copied to clipboard', 'success');
        exportSimpleBtn.textContent = 'Copied!';
        setTimeout(() => {
            exportSimpleBtn.textContent = 'Export as List';
        }, 2000);
    });

    // Initial load
    loadUsers();

    function highlightPlume(username, twitterLinkElement) {
        let container = twitterLinkElement;
        while (container && !container.querySelector('svg, i')) {
            container = container.parentElement;
            if (!container || container === document.body) return;
        }

        if (container && !container.hasAttribute(MARKER_ATTR)) {
            const plumeIcon = container.querySelector('svg, i');
            if (plumeIcon) {
                plumeIcon.style.color = "red";
                plumeIcon.style.fill = "red";
                plumeIcon.style.fontSize = "1.5em";
                plumeIcon.style.width = "1.5em";
                plumeIcon.style.height = "1.5em";
                container.setAttribute(MARKER_ATTR, "true");
                console.log(`Found ${username} !`);
                //showNotification(`Found tracked user: ${username}`, 'info');
            }
        }
    }

    function checkForTargetLinks() {
        const twitterLinks = document.querySelectorAll('a[href^="https://x.com/"], a[href^="https://twitter.com/"], a[href^="https://truthsocial.com/"]');
        const targetUsernames = GM_getValue('targetUsernames', []);

        for (const link of twitterLinks) {
            for (const username of targetUsernames) {
                const regex = new RegExp(`/${username.replace('@', '')}/`, 'i');
                if (regex.test(link.href)) {
                    highlightPlume(username, link);
                }
            }
        }
    }

    setInterval(checkForTargetLinks, 1000);

    const observer = new MutationObserver(() => checkForTargetLinks());
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    checkForTargetLinks();
})();

// https://t.me/darkteam_crypto - @autoruncrypto
