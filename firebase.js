import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyD71ZhYGXxRRwu82KXsi7rYm3026hNytt8",
    authDomain: "potent-pursuit-386804.firebaseapp.com",
    projectId: "potent-pursuit-386804",
    storageBucket: "potent-pursuit-386804.appspot.com",
    messagingSenderId: "1056168951876",
    appId: "1:1056168951876:web:61baa74320640ae8077c11",
    measurementId: "G-G3GSH3Y3SK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

export default app;
