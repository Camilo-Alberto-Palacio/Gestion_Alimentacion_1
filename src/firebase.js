import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Reemplaza esta configuración con la tuya desde la consola de Firebase
const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "tu-proyecto.firebaseapp.com",
    projectId: "tu-proyecto",
    storageBucket: "tu-proyecto.appspot.com",
    messagingSenderId: "TUS_DATOS",
    appId: "TUS_DATOS"
};

// const app = initializeApp(firebaseConfig);
// export const auth = getAuth(app);
// export const provider = new GoogleAuthProvider();
// export const db = getFirestore(app);
// export { signInWithPopup };

// Archivo mockeado hasta que se configure Firebase
export const auth = {};
export const provider = {};
export const db = {};
export const signInWithPopup = async () => { };
