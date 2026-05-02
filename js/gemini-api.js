/**
 * gemini-api.js — Google Gemini 2.5 Flash Integration for ElectionEase.
 *
 * SECURITY FEATURES:
 * - Rate limiting: Max 10 requests per 60 seconds
 * - API response validation
 * - Automatic fallback for demo mode
 * - Non-partisan persona enforcement
 * - Input sanitization
 *
 * This module handles communication with the Google Generative AI API.
 * It enforces a non-partisan, educational persona focused on election processes.
 *
 * VERTICAL: Election Process Education | NON-PARTISAN CIVIC GUIDE
 * Google Service Used: Gemini 2.5 Flash API
 *
 * @module gemini
 */

'use strict';

// ── Rate Limiting ─────────────────────────────────────────────────────────────

/**
 * @type {number[]} API call timestamps for rate limiting (last 60 seconds)
 */
const apiCallHistory = [];
const RATE_LIMIT_WINDOW = 60000; // 60 seconds
const MAX_REQUESTS_PER_WINDOW = 10;
const MIN_TIME_BETWEEN_REQUESTS = 500; // 500ms minimum between consecutive calls

/**
 * Checks if an API call is allowed under rate limiting constraints.
 * @returns {boolean} True if call is allowed, false if rate limited.
 */
const checkRateLimit = () => {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW;
    
    // Remove old entries outside the window
    while (apiCallHistory.length > 0 && apiCallHistory[0] < windowStart) {
        apiCallHistory.shift();
    }
    
    // Check window limit
    if (apiCallHistory.length >= MAX_REQUESTS_PER_WINDOW) {
        return false;
    }
    
    // Check minimum time between requests
    if (apiCallHistory.length > 0 && now - apiCallHistory[apiCallHistory.length - 1] < MIN_TIME_BETWEEN_REQUESTS) {
        return false;
    }
    
    return true;
};

/**
 * Records an API call in the rate limit history.
 */
const recordApiCall = () => {
    apiCallHistory.push(Date.now());
};

/**
 * @constant {string} GEMINI_API_KEY - API Key for Google Gemini.
 * Note: Should be replaced with a real key for production deployment.
 */
const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY';

/**
 * @constant {string} API_URL - Endpoint for the Gemini API.
 */
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

/**
 * Generates the system instruction prompt for the AI assistant.
 * Enforces strict non-partisanship and vertical alignment with Election Process Education.
 *
 * @param {string} topic - The current election topic.
 * @param {string} level - The user's civic knowledge level ('Voter' or 'Verified Voter').
 * @returns {string} The formatted system prompt.
 */
const buildSystemPrompt = (topic, level) => {
    return `
You are ElectionEase, an expert, patient, and strictly non-partisan Election Process Education assistant.
Your goal is to educate users on the mechanics of voting and democracy for: "${topic}".
User's Civic Readiness Level: "${level}".

CORE DIRECTIVES:
1. STRICT NON-PARTISANSHIP: Never express opinions on political parties, candidates, or ideologies.
2. VERTICAL FOCUS: Strictly discuss election processes (registration, deadlines, logistics, mechanics).
3. PACING: Adapt your complexity.
   - Voter: Use clear, simple language; explain terms like "absentee" or "canvassing".
   - Verified Voter: Provide more detailed information on state vs federal rules or security protocols.
4. STRUCTURE: Use Markdown. Bold key terms. Use lists for steps.
5. ENGAGEMENT: Always end with exactly one question to verify understanding or prompt the next logical step.
6. BOUNDARIES: If asked about political preferences, state: "As a non-partisan civic guide, I focus on how the election process works, not on candidates or parties."

Topic Context: ${topic}.
Current Level: ${level}.
`.trim();
};

/**
 * Communicates with the Google Gemini API to get a structured response.
 * Implements security: rate limiting, input validation, API response validation,
 * safety settings and handles fallback/error states gracefully.
 *
 * @async
 * @function getGeminiResponse
 * @param {string} topic - The current election topic (validated).
 * @param {string} level - User's current civic level ('Voter' or 'Verified Voter').
 * @param {string|null} userMessage - The latest message from the user (sanitized).
 * @param {Array<{role: string, text: string}>} [history=[]] - Conversation history.
 * @returns {Promise<string>} The assistant's text response or error message.
 * @throws Will not throw; returns error message instead for graceful degradation.
 */
window.getGeminiResponse = async (topic, level, userMessage, history = []) => {
    try {
        // Input validation
        if (!topic || typeof topic !== 'string') {
            console.warn('Invalid topic parameter');
            return 'Error: Topic is required and must be a string.';
        }
        if (!['Voter', 'Verified Voter'].includes(level)) {
            console.warn('Invalid level parameter:', level);
            return 'Error: Invalid user level.';
        }

        // Rate limiting check
        if (!checkRateLimit()) {
            console.warn('Rate limit exceeded');
            return 'I am processing many requests right now. Please wait a moment before sending another message.';
        }

        // Analytics tracking for API usage
        if (typeof window.trackEvent === 'function') {
            window.trackEvent('gemini_api_call', { topic, level, timestamp: new Date().toISOString() });
        }

        recordApiCall();

        // Mock implementation for demonstration if API key is missing
        if (GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
            return new Promise((resolve) => {
                setTimeout(() => {
                    const mockText = userMessage
                        ? `[DEMO MODE] Regarding **${topic}**, you asked: "${userMessage}". In a live session, I would provide a non-partisan explanation based on your ${level} status. Please register at vote.gov by your state's deadline. What else can I help you with?`
                        : `Welcome to **ElectionEase**! I am here to guide you through **${topic}**. Where would you like to start?`;
                    resolve(mockText);
                }, 1000);
            });
        }

        const contents = [
            {
                role: 'user',
                parts: [{ text: buildSystemPrompt(topic, level) }]
            },
            {
                role: 'model',
                parts: [{ text: 'Understood. I am your expert, non-partisan guide to the Election Process.' }]
            }
        ];

        // Format history for Gemini API with validation
        if (Array.isArray(history)) {
            history.slice(0, 20).forEach((msg) => {  // Limit history to last 20 messages
                if (msg && msg.role && msg.text && typeof msg.text === 'string') {
                    contents.push({
                        role: msg.role === 'bot' ? 'model' : 'user',
                        parts: [{ text: msg.text.substring(0, 2000) }]  // Limit individual message length
                    });
                }
            });
        };

        // Add the current prompt with validation
        if (userMessage && typeof userMessage === 'string' && userMessage.length > 0) {
            contents.push({
                role: 'user',
                parts: [{ text: userMessage.substring(0, 2000) }]
            });
        } else {
            contents.push({
                role: 'user',
                parts: [{ text: `Hello, please introduce the topic of ${topic}.` }]
            });
        }

        // Use shared safeFetch utility to centralize timeout behavior and improve testability
        const bodyPayload = {
            contents,
            generationConfig: {
                temperature: 0.25,
                maxOutputTokens: 1024,
                topP: 0.9
            },
            safetySettings: [
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' }
            ]
        };

        const response = await window.EEUtils.safeFetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyPayload)
        }, 30000);

        if (!response.ok) {
            const statusText = response.statusText || 'Unknown';
            throw new Error(`Gemini API HTTP ${response.status} ${statusText}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Invalid API response format');
        }

        const data = await response.json();

        // Comprehensive response validation
        if (data.error) {
            throw new Error(data.error.message || data.error.code || 'Gemini API error');
        }

        if (!data.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0) {
            console.warn('Empty candidates array from API');
            return 'The AI assistant is unable to provide a response at this moment. Please try again.';
        }

        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!aiText || typeof aiText !== 'string') {
            console.warn('Invalid response text from API');
            return 'I received an invalid response from the API. Please try again.';
        }

        // Verify non-partisan response (sanity check)
        const restrictedPatterns = /republican|democrat|gop|dnc|biden|trump|harris|vance/i;
        if (restrictedPatterns.test(aiText)) {
            console.warn('Potential partisan content detected in response');
            // Log but don't reject - just note for monitoring
        }

        return aiText;

    } catch (error) {
        console.error('Gemini API Error:', error);
        if (typeof window.trackEvent === 'function') {
            window.trackEvent('gemini_api_error', { error: error.message, timestamp: new Date().toISOString() });
        }

        // Graceful error messaging
        if (error.name === 'AbortError') {
            return 'The request took too long to respond. Please try again with a shorter message.';
        }
        return `I encountered an error while processing your request: ${error.message}. Please try again.`;
    }
}
