const functions = require('firebase-functions');
const admin = require('firebase-admin');
const transcribeVideo = require('./transcribeVideo');
const chatgpt = require('./callOpenAI');

admin.initializeApp();

exports.transcribeVideo = functions.runWith({ memory: '4GB', timeoutSeconds: 540 })
    .https.onRequest(transcribeVideo.transcribeVideo);

exports.callOpenAI = functions.https.onRequest(chatgpt.callOpenAI);
