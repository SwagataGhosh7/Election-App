import { loginUser, registerUser, logoutUser, listenToAuthStatus, getUserProgress, saveUserProgress } from './firebase-config.js';
import { getGeminiResponse } from './gemini-api.js';
import { showSection, appendMessage, showTypingIndicator, removeTypingIndicator } from './ui.js';

// App State
let currentUser = null;
let userProgress = null;
let currentTopic = "";
let chatHistory = [];

// DOM Elements
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const logoutBtn = document.getElementById('logout-btn');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const authError = document.getElementById('auth-error');

const userDisplayName = document.getElementById('user-display-name');
const topicsCompleted = document.getElementById('topics-completed');
const currentLevel = document.getElementById('current-level');

const topicInput = document.getElementById('topic-input');
const startLearningBtn = document.getElementById('start-learning-btn');
const backToDashboardBtn = document.getElementById('back-to-dashboard-btn');

const currentTopicTitle = document.getElementById('current-topic-title');
const sessionLevel = document.getElementById('session-level');
const chatContainer = document.getElementById('chat-container');
const userResponse = document.getElementById('user-response');
const sendMsgBtn = document.getElementById('send-msg-btn');

// Auth Flow
listenToAuthStatus(async (user) => {
    if (user) {
        currentUser = user;
        userDisplayName.textContent = user.email.split('@')[0];
        
        // Fetch progress
        userProgress = await getUserProgress(user.uid);
        topicsCompleted.textContent = userProgress.topicsCompleted || 0;
        currentLevel.textContent = userProgress.level || "Beginner";
        
        showSection('dashboard-section');
    } else {
        currentUser = null;
        userProgress = null;
        showSection('auth-section');
    }
});

loginBtn.addEventListener('click', async () => {
    try {
        authError.textContent = "";
        await loginUser(emailInput.value, passwordInput.value);
    } catch (error) {
        authError.textContent = error.message;
    }
});

signupBtn.addEventListener('click', async () => {
    try {
        authError.textContent = "";
        await registerUser(emailInput.value, passwordInput.value);
    } catch (error) {
        authError.textContent = error.message;
    }
});

logoutBtn.addEventListener('click', async () => {
    await logoutUser();
});

// Learning Flow
startLearningBtn.addEventListener('click', async () => {
    const topic = topicInput.value.trim();
    if (!topic) return;

    currentTopic = topic;
    currentTopicTitle.textContent = topic;
    sessionLevel.textContent = userProgress.level || "Beginner";
    
    // Reset Chat
    chatContainer.innerHTML = '';
    chatHistory = [];
    userResponse.value = '';

    showSection('learning-section');

    // Initial greeting from AI
    showTypingIndicator('chat-container');
    const response = await getGeminiResponse(currentTopic, userProgress.level || "Beginner", null, []);
    removeTypingIndicator();
    
    appendMessage('chat-container', response, 'bot');
    chatHistory.push({ role: 'bot', text: response });
});

backToDashboardBtn.addEventListener('click', () => {
    showSection('dashboard-section');
    // Increment topic if they spent time learning
    if (chatHistory.length > 2 && currentUser) {
        userProgress.topicsCompleted = (userProgress.topicsCompleted || 0) + 1;
        saveUserProgress(currentUser.uid, userProgress);
        topicsCompleted.textContent = userProgress.topicsCompleted;
    }
});

// Chat Interaction
const handleSendMessage = async () => {
    const text = userResponse.value.trim();
    if (!text) return;

    // Add user message to UI
    appendMessage('chat-container', text, 'user');
    userResponse.value = '';
    
    // Show bot thinking
    showTypingIndicator('chat-container');
    
    const response = await getGeminiResponse(currentTopic, userProgress.level || "Beginner", text, chatHistory);
    
    removeTypingIndicator();
    appendMessage('chat-container', response, 'bot');
    
    // Update history
    chatHistory.push({ role: 'user', text });
    chatHistory.push({ role: 'bot', text: response });
};

sendMsgBtn.addEventListener('click', handleSendMessage);
userResponse.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
});
