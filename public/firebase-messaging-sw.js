import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging/sw";

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
const firebaseConfig = {
    apiKey: "AIzaSyD71ZhYGXxRRwu82KXsi7rYm3026hNytt8",
    authDomain: "potent-pursuit-386804.firebaseapp.com",
    projectId: "potent-pursuit-386804",
    storageBucket: "potent-pursuit-386804.appspot.com",
    messagingSenderId: "1056168951876",
    appId: "1:1056168951876:web:61baa74320640ae8077c11",
    measurementId: "G-G3GSH3Y3SK"
};

// Initialize the Firebase app in the service worker.
const firebaseApp = initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
// FIXME: Confusing. Having to start its own app instance and getMessaging instance?
const messaging = getMessaging(firebaseApp);

// Consider passing messaging to layout so it can use it instead of its own getMessaging

// requestPermissionAndGetToken(messaging);

// onMessage(messaging, (payload) => {
//     console.log('Message received:', payload);
//     handleProcessedVideo();
//     setIsProcessing(false);
// });

// Consider also using onMessage here to test print a notification to console
