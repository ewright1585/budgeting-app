import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyD0eK7WYuW_ehj3TkfJi9CwtZHv8ak6t9w",
    authDomain: "life-2025.firebaseapp.com",
    projectId: "life-2025",
    storageBucket: "life-2025.firebasestorage.app",
    messagingSenderId: "749264712893",
    appId: "1:749264712893:web:68b69f70359257bb3433d4"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  query,
  where,
  signInWithEmailAndPassword,
  onAuthStateChanged
};


