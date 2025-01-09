// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBKW9Y1UOBsvupX4hJtijyb-HoJgekv__4",
  authDomain: "thibaudiere.firebaseapp.com",
  projectId: "thibaudiere",
  storageBucket: "thibaudiere.firebasestorage.app",
  messagingSenderId: "599315698487",
  appId: "1:599315698487:web:a8e38e40b085f7c0ab80b2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);