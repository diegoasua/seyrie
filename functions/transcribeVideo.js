const functions = require('firebase-functions');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const ffmpeg = require('fluent-ffmpeg');
const axios = require('axios');
const FormData = require('form-data');
const { Storage } = require('@google-cloud/storage');
const fs = require('fs');
const path = require('path');
const cors = require('cors')({ origin: true });
const admin = require('firebase-admin');


const openaiApiKey = functions.config().openai.key;

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

exports.transcribeVideo = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        const videoName = req.body.videoName;
        const nameWithoutExtension = videoName.substring(0, videoName.lastIndexOf('.'));
        const folderName = 'uploads';
        const tmpPath = '/tmp';

        // 1. Download the video file to the tmp folder in the cloud function
        const bucket = admin.storage().bucket();
        await bucket.file(`${folderName}/${videoName}`).download({
            destination: `${tmpPath}/${videoName}`,
        });

        // 2. Extract audio from the video
        const audioPath = `${tmpPath}/audio.wav`;
        await new Promise((resolve, reject) => {
            ffmpeg(`${tmpPath}/${videoName}`)
                .output(audioPath)
                .on('end', resolve)
                .on('error', reject)
                .run();
        });

        // 3. Transcribe the audio
        const url = "https://api.openai.com/v1/audio/transcriptions";
        const headers = {
            "Authorization": `Bearer ${openaiApiKey}`,
        };
        const formData = new FormData();
        formData.append('model', 'whisper-1');
        formData.append('response_format', 'vtt');
        formData.append('file', fs.createReadStream(audioPath));

        let srtData;
        await axios({
            method: 'post',
            url,
            headers: headers,
            data: formData,
        }).then(function (response) {
            srtData = response.data; // handle the srt data
        });

        // 4. Save srt file to Firebase Storage
        const srtFilePath = `${tmpPath}/captions.vtt`;
        fs.writeFileSync(srtFilePath, srtData);
        await bucket.upload(srtFilePath, {
            destination: `${folderName}/captions.vtt`
        });

        // 5. Add captions to video
        // const outputVideoName = videoName.startsWith('processed_') ? videoName : `processed_${videoName}`;
        // const outputVideoPath = `${tmpPath}/${outputVideoName}`;
        // await new Promise((resolve, reject) => {
        //     ffmpeg(`${tmpPath}/${videoName}`)
        //         .outputOptions(`-vf subtitles=${srtFilePath}`)
        //         .output(outputVideoPath)
        //         .on('end', resolve)
        //         .on('error', reject)
        //         .run();
        // });

        // 6. Upload processed video back to Firebase Storage
        // await bucket.upload(outputVideoPath, {
        //     destination: `${folderName}/${outputVideoName}`
        // });

        res.send('Transcription process completed.');
    });
});
