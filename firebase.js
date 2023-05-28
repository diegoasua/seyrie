import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyD71ZhYGXxRRwu82KXsi7rYm3026hNytt8",
    authDomain: "potent-pursuit-386804.firebaseapp.com",
    projectId: "potent-pursuit-386804",
    storageBucket: "potent-pursuit-386804.appspot.com",
    messagingSenderId: "1056168951876",
    appId: "1:1056168951876:web:61baa74320640ae8077c11",
    measurementId: "G-G3GSH3Y3SK"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };
