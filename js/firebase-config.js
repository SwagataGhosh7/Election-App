// TODO: Replace with actual Firebase config
const firebaseConfig = {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

let app, auth, db;
let mockAuthCallback = null;

try {
    if (firebaseConfig.apiKey !== "YOUR_FIREBASE_API_KEY") {
        app = firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        db = firebase.firestore();
    } else {
        console.warn("Firebase is not configured. Mocking authentication for demo purposes.");
    }
} catch (error) {
    console.error("Error initializing Firebase:", error);
}

// Global Auth Wrapper Functions
window.loginUser = async (email, password) => {
    if (auth) {
        return await auth.signInWithEmailAndPassword(email, password);
    }
    // Mock login
    const user = { email, uid: "mock-uid-123" };
    if (mockAuthCallback) mockAuthCallback(user);
    return { user };
};

window.registerUser = async (email, password) => {
    if (auth) {
        return await auth.createUserWithEmailAndPassword(email, password);
    }
    // Mock register
    const user = { email, uid: "mock-uid-123" };
    if (mockAuthCallback) mockAuthCallback(user);
    return { user };
};

window.logoutUser = async () => {
    if (auth) {
        return await auth.signOut();
    }
    if (mockAuthCallback) mockAuthCallback(null);
    return true;
};

window.listenToAuthStatus = (callback) => {
    if (auth) {
        auth.onAuthStateChanged(callback);
    } else {
        mockAuthCallback = callback;
        // Mock default state: not logged in
        setTimeout(() => callback(null), 500);
    }
};

// Global DB Wrapper Functions
window.saveUserProgress = async (userId, data) => {
    if (db) {
        await db.collection("users").doc(userId).set(data, { merge: true });
    } else {
        console.log("Mock saved data:", data);
    }
};

window.getUserProgress = async (userId) => {
    if (db) {
        const docSnap = await db.collection("users").doc(userId).get();
        if (docSnap.exists) {
            return docSnap.data();
        }
    }
    // Mock data
    return { topicsCompleted: 0, level: "Beginner", history: [] };
};
