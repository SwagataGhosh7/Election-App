import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// TODO: Replace with actual Firebase config
// Make sure to add this project in Firebase Console and enable Authentication (Email/Password) and Firestore Database
const firebaseConfig = {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase only if API key is provided
let app, auth, db;

try {
    if (firebaseConfig.apiKey !== "YOUR_FIREBASE_API_KEY") {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
    } else {
        console.warn("Firebase is not configured. Mocking authentication for demo purposes.");
    }
} catch (error) {
    console.error("Error initializing Firebase:", error);
}

// Auth Wrapper Functions (Fallback to mock if not configured)
export const loginUser = async (email, password) => {
    if (auth) {
        return await signInWithEmailAndPassword(auth, email, password);
    }
    // Mock login
    return { user: { email, uid: "mock-uid-123" } };
};

export const registerUser = async (email, password) => {
    if (auth) {
        return await createUserWithEmailAndPassword(auth, email, password);
    }
    // Mock register
    return { user: { email, uid: "mock-uid-123" } };
};

export const logoutUser = async () => {
    if (auth) {
        return await signOut(auth);
    }
    return true;
};

export const listenToAuthStatus = (callback) => {
    if (auth) {
        onAuthStateChanged(auth, callback);
    } else {
        // Mock default state: not logged in
        setTimeout(() => callback(null), 500);
    }
};

// DB Wrapper Functions
export const saveUserProgress = async (userId, data) => {
    if (db) {
        await setDoc(doc(db, "users", userId), data, { merge: true });
    } else {
        console.log("Mock saved data:", data);
    }
};

export const getUserProgress = async (userId) => {
    if (db) {
        const docSnap = await getDoc(doc(db, "users", userId));
        if (docSnap.exists()) {
            return docSnap.data();
        }
    }
    // Mock data
    return { topicsCompleted: 0, level: "Beginner", history: [] };
};
