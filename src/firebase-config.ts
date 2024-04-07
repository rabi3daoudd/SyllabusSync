// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage'; // Add this import

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD6tPDSiUISiRkI9LRY66Y0NS2Ehz-p4OU",
  authDomain: "syllabussync-f18b0.firebaseapp.com",
  projectId: "syllabussync-f18b0",
  storageBucket: "syllabussync-f18b0.appspot.com",
  messagingSenderId: "236164385767",
  appId: "1:236164385767:web:199ad4bbbaefdae043cb42",
  measurementId: "G-2HK1RJR7R7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); // Initialize Storage with the Firebase app

// Export the variables for use in other parts of the application
export { app, auth, db, storage }; // Add storage to the export statement