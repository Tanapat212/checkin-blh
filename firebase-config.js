import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCSDe0i8lQMtXvoa8cm4gN7CWkAKBrLoMQ",
  authDomain: "cheked-std-blh2.firebaseapp.com",
  projectId: "cheked-std-blh2",
  storageBucket: "cheked-std-blh2.appspot.com",
  messagingSenderId: "580419199399",
  appId: "1:580419199399:web:378c617388fb179478d682",
  measurementId: "G-277ZEH2D3P"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
