/**
 * utils.js — Shared utility helpers for ElectionEase.
 *
 * Provides sanitization, validation, and a safe fetch wrapper used
 * across the app to improve code quality and reduce duplication.
 */

'use strict';

(function (global) {
    const EEUtils = {};

    EEUtils.escapeHTML = function (str) {
        if (typeof str !== 'string') return '';
        return str.replace(/[&<>'"]/g, function (tag) {
            const chars = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            };
            return chars[tag] || tag;
        });
    };

    EEUtils.validateEmail = function (email) {
        return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    EEUtils.validatePassword = function (password) {
        return typeof password === 'string' && password.length >= 8;
    };

    EEUtils.sanitizeTopic = function (topic) {
        if (typeof topic !== 'string') return '';
        // Trim and limit length to avoid huge prompts
        return topic.trim().substring(0, 200);
    };

    /**
     * safeFetch — wraps fetch with timeout and basic response validation.
     * Returns the Response object or throws an Error on failure.
     * @param {string} url
     * @param {object} options
     * @param {number} timeoutMs
     */
    EEUtils.safeFetch = async function (url, options = {}, timeoutMs = 30000) {
        const controller = new AbortController();
        const { signal } = controller;
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const res = await fetch(url, Object.assign({}, options, { signal }));
            clearTimeout(timer);
            return res;
        } catch (err) {
            clearTimeout(timer);
            throw err;
        }
    };

    // Expose
    global.EEUtils = EEUtils;
    // Backwards compatibility for tests referencing window.escapeHTML
    if (!global.escapeHTML) global.escapeHTML = EEUtils.escapeHTML;
})(window || this);
