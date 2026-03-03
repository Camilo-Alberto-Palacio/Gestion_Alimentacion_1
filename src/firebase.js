import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBiDdq6aBlEcoxk3TpYcGc0F7cmKNIP_9M",
    authDomain: "gestor-alimentacion.firebaseapp.com",
    projectId: "gestor-alimentacion",
    storageBucket: "gestor-alimentacion.firebasestorage.app",
    messagingSenderId: "215724356022",
    appId: "1:215724356022:web:e969dfa119c2cc41e91117",
    measurementId: "G-GJ0W1HCZW8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
export { signInWithPopup };
