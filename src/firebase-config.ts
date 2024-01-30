// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// You can comment out getAnalytics if you're not using it currently
// import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

// Export the app variable for use in other parts of the application
export { app };

// Comment out or remove the analytics if not in use
// const analytics = getAnalytics(app);
