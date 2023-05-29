// import { getVideoMetadata } from "@remotion/media-utils";
// import { Player } from "@remotion/player";
import axios from 'axios';
import { getDownloadURL, getStorage, ref, uploadBytesResumable, UploadTask } from 'firebase/storage';
import React, { useEffect, useRef, useState } from 'react';
import { FaSearch } from 'react-icons/fa';
// import { delayRender } from "remotion";
import { app } from '../firebase';
// import { BaseComposition } from "../remotion/MyComp";
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import Image from 'next/image';
import logo from '../public/logo.svg';
import ProtectedRoute from './ProtectedRoute';
import VideoDropArea from './VideoTimeline';



interface Notification {
    title: string;
    body: string;
}

interface RulerProps {
    totalSeconds: number;
}

interface Payload {
    notification: Notification;
}

interface Messaging {
    getToken: () => Promise<string>;
    onMessage: (callback: (payload: Payload) => void) => () => void;
}

// let messaging: Messaging | undefined;

// const { getMessaging } = require('firebase/messaging');

interface LayoutProps {
    children: React.ReactNode;
}

const transcribeVideo = async (videoName: string) => {
    try {
        const response = await axios.post('https://us-central1-potent-pursuit-386804.cloudfunctions.net/transcribeVideo', {
            videoName: videoName
        });

        console.log(response.data);
    } catch (error) {
        console.error('Error:', error);
    }
};

function formatSeconds(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const [videoUrl, setVideoUrl] = useState('');
    const [videoNameDisplay, setVideoNameDisplay] = useState('');
    const [captionUrl, setCaptionUrl] = useState('');
    const [isExporting, setIsExporting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadTask, setUploadTask] = useState<UploadTask | null>(null);
    const currentCaptionUrl = useRef<string | null>(null);
    const [userInput, setUserInput] = useState('');
    const [output, setOutput] = useState('');
    // const [handle] = useState(() => delayRender());
    const [duration, setDuration] = useState(1);
    const [isProcessing, setIsProcessing] = useState(false);
    const [fcmToken, setfcmToken] = useState('');
    const videoRef = useRef<HTMLVideoElement>(null);
    const [rulerMarks, setRulerMarks] = useState<number[]>([]);
    const [videoUrls, setVideoUrls] = useState<string[]>([]);
    const [thumbnails, setThumbnails] = useState<string[][]>([]);
    const [selectedVideoIndex, setSelectedVideoIndex] = useState<number | null>(null);


    // useEffect(() => {
    //     getVideoMetadata(
    //         "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
    //     )
    //         .then(({ durationInSeconds }) => {
    //             setDuration(Math.round(durationInSeconds * 30));
    //             continueRender(handle);
    //         })
    //         .catch((err) => {
    //             console.log(`Error fetching metadata: ${err}`);
    //         });
    // }, [handle]);

    useEffect(() => {
        // Calculate the length of the longest video
        const longestVideoLength = Math.max(...thumbnails.map(t => t.length));

        // The total length is the length of the longest video
        setRulerMarks(Array.from({ length: longestVideoLength }, (_, i) => i));
    }, [thumbnails]);



    async function requestPermissionAndGetToken(messaging: any) {
        // FIXME: Why is there a getMessaging call here?
        // const messaging = getMessaging();
        try {
            let token = await getToken(messaging, { vapidKey: 'BIBLfYN7Dd-yL87JiNhxR0O1hK7bvP0AMfq7Ind-2gYav_DUA7dKAS805a86LNvV8_incEA37-RwbYL8in2uygw' });
            console.log("Registration token:", token);
            setfcmToken(token);
        } catch (error) {
            console.error('Error getting messaging token', error);
        }
    }


    const handleClickSilentTrim = async () => {
        // await requestPermissionAndGetToken();
        setIsProcessing(true);
        try {
            console.log("About to send:", fcmToken);

            axios.post(
                'https://auto-cut-myxlwik5bq-uw.a.run.app/process_video',
                { filename: videoNameDisplay, fcmToken: fcmToken },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    withCredentials: true
                }
            ).then(response => {
                console.log(response.data);
            }).catch(error => {
                console.error(error);
            });
        } catch (error) {
            console.error('Error:', error);
        }
    }

    const deleteVideoTrack = () => {
        // ensure a track is selected
        if (selectedVideoIndex !== null) {
            // filter out the selected track
            const newVideoUrls = videoUrls.filter((_, index) => index !== selectedVideoIndex);
            const newThumbnails = thumbnails.filter((_, index) => index !== selectedVideoIndex);

            // update state
            setVideoUrls(newVideoUrls);
            setThumbnails(newThumbnails);

            // If videoUrl was pointing to the deleted video, reset it
            if (videoUrls[selectedVideoIndex] === videoUrl) {
                setVideoUrl('');
            }

            // if there's still at least one video track, select the first one
            if (newVideoUrls.length > 0) {
                setSelectedVideoIndex(0);
                setVideoUrl(newVideoUrls[0]);
            } else {
                // else, reset selectedVideoIndex
                setSelectedVideoIndex(null);
            }
        }
    }


    useEffect(() => {
        const handleDelete = (event: KeyboardEvent) => {
            if (event.key === 'Delete' || event.key === 'Backspace') {
                deleteVideoTrack();
            }
        };

        window.addEventListener('keydown', handleDelete);

        // Clean up function
        return () => {
            window.removeEventListener('keydown', handleDelete);
        };
    }, [selectedVideoIndex, videoUrls, thumbnails, videoUrl]); // added videoUrl to the dependency array


    // useEffect(() => {
    //     if (typeof window !== 'undefined') {
    //         const { getToken, onMessage } = require('firebase/messaging');

    //         requestPermissionAndGetToken();

    //         onMessage(messaging as Messaging, (payload: Payload) => {
    //             console.log('Message received:', payload);
    //             console.log('Notification title:', payload.notification.title);
    //             console.log('Notification body:', payload.notification.body);
    //             handleProcessedVideo();
    //             setIsProcessing(false);
    //         });
    //     }
    // }, []);

    // FIXME: FCM not received
    useEffect(() => {
        let messaging = getMessaging(app);
        // this sets a state token that is passed into backend calls so that they can send FCM push messages
        requestPermissionAndGetToken(messaging);

        onMessage(messaging, (payload) => {
            console.log('Message received:', payload);
            handleProcessedVideo();
            setIsProcessing(false);
        });
    }, []);

    // TODO: Handle background notifications
    // onBackgroundMessage(messaging, (payload) => {
    // console.log('Received background message ', payload);
    // Customize notification here
    // const notificationTitle = 'Background Message Title';
    // const notificationOptions = {
    //     body: 'Background Message body.',
    //     icon: '/firebase-logo.png'
    // };

    // self.registration.showNotification(notificationTitle, notificationOptions);
    // });

    useEffect(() => {
        return () => {
            if (currentCaptionUrl.current) {
                URL.revokeObjectURL(currentCaptionUrl.current);
            }
        };
    }, []);

    const onDrop = async (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        if (event.dataTransfer.items && event.dataTransfer.items.length > 0) {
            const file = event.dataTransfer.items[0].getAsFile();

            if (file) {
                const url = URL.createObjectURL(file);
                setVideoUrls(prev => [...prev, url]);

                // Display the video only if it's the first track
                if (videoUrls.length === 0) {
                    setVideoUrl(url);
                }

                // Create a new video element for processing
                const processingVideoElement = document.createElement('video');

                processingVideoElement.src = url;

                await new Promise(resolve => {
                    processingVideoElement.onloadedmetadata = resolve;
                });

                const { duration } = processingVideoElement;

                // Initialize an array to hold the thumbnails
                const newThumbnails: string[] = [];

                // Create a canvas to draw the video frames onto
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');

                for (let i = 0; i < duration; i++) {
                    // Seek to the current second
                    processingVideoElement.currentTime = i;

                    // Wait for the video to seek to the correct time
                    await new Promise(resolve => {
                        processingVideoElement.onseeked = resolve;
                    });

                    // Draw the current frame onto the canvas
                    if (context) {
                        context.drawImage(processingVideoElement, 0, 0, canvas.width, canvas.height);
                    }

                    // Convert the canvas to a data URL and add it to the thumbnails array
                    newThumbnails.push(canvas.toDataURL('image/jpeg'));
                }

                // Update the state
                setThumbnails(prev => [...prev, newThumbnails]);

                // upload video to cloud
                const storage = getStorage(app);
                const storageRef = ref(storage, 'uploads/' + file.name);

                setIsUploading(true);

                const uploadTask = uploadBytesResumable(storageRef, file);
                setUploadTask(uploadTask);


                uploadTask.on('state_changed',
                    (snapshot) => {
                        // Observe state change events such as progress, pause, and resume
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        console.log('Upload is ' + progress + '% done');
                        setUploadProgress(progress);
                    },
                    (error) => {
                        // Handle unsuccessful uploads
                        if (error.code === 'storage/canceled') {
                            console.log('Upload cancelled by user');
                        } else {
                            console.error('Error uploading file: ', error);
                        }
                        setIsUploading(false);
                        setUploadProgress(0);
                        setUploadTask(null);
                    },
                    async () => {
                        console.log('Uploaded ', file.name);
                        setVideoNameDisplay(file.name);
                        setIsUploading(false);
                        setUploadProgress(0);
                        setUploadTask(null);
                        // handleProcessedVideo();
                        // transcribeVideo('altman_example_short.mp4');
                    }
                );
            } else {
                console.error('Error: File is null');
            }
        }
    };

    const handleProcessedVideo = async () => {
        const storage = getStorage(app);

        setTimeout(async () => {
            let videoName = "processed_" + videoNameDisplay;

            const videoRef = ref(storage, 'uploads/' + videoName);

            try {
                const url = await getDownloadURL(videoRef);
                setVideoUrl(url);

                let captionName = "captions.vtt";
                const captionRef = ref(storage, 'uploads/' + captionName);

                try {
                    const captionUrl = await getDownloadURL(captionRef);
                    axios({
                        url: captionUrl,
                        method: 'GET',
                        responseType: 'blob',
                    }).then((response) => {
                        const localUrl = URL.createObjectURL(new Blob([response.data]));
                        if (currentCaptionUrl.current) {
                            URL.revokeObjectURL(currentCaptionUrl.current);
                        }
                        currentCaptionUrl.current = localUrl;
                        setCaptionUrl(localUrl);
                    }).catch((error) => {
                        console.error('Error fetching caption: ', error);
                        setCaptionUrl("");
                    });
                } catch (captionError) {
                    console.error('Error fetching caption: ', captionError);
                    setCaptionUrl("");
                }
            } catch (error) {
                console.error('Error fetching video: ', error);
            }
        }, 35000);
    };

    const handleSearch = async () => {
        try {
            const response = await axios.post('https://us-central1-potent-pursuit-386804.cloudfunctions.net/callOpenAI', {
                systemPrompt: 'You are a natural language assistant in a video editor. You are given natural language instructions from the user and have to choose which tools to apply to the video based on that. The possible tools are: auto-cut and auto-caption. You will reply only with numbers and tool names, indicating the order in which tools have to be applied, nothing more. For example. User input: my video is too long. Output: 1. auto-cut',
                userInput,
            });

            const data = response.data;
            setOutput(data);
        } catch (error) {
            console.error(error);
        }
    };

    const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
    };
    const handleClickStory = () => {
        setIsExporting(false);
    }
    const handleClickExport = () => {
        setIsExporting(true);
    }

    const Ruler = ({ totalSeconds }: RulerProps) => {
        let timeLabels = [];
        for (let i = 0; i < totalSeconds; i++) {
            timeLabels.push(
                <div key={i} className="w-20 h-12 flex justify-center items-center border-r-2 border-gray-300">
                    {i % 10 === 0 ? (
                        <span className="text-sm">{new Date(i * 1000).toISOString().substr(14, 5)}</span>
                    ) : null}
                </div>
            )
        }
        return <div className="flex overflow-x-auto hide-scrollbar">{timeLabels}</div>
    }

    return (
        <div className="min-h-screen flex flex-col bg-white">
            <header className="bg-white">
                <div className="mx-auto py-2 px-6">
                    <nav className="flex space-x-4">
                        <div className="flex items-center px-4 py-4">
                            <Image src={logo} alt="Logo" width={40} height={100} />
                        </div>
                        <button
                            className={`px-8 py-4 rounded-2xl text-xl ${isExporting ? 'text-blue-600 bg-white' : 'text-white bg-blue-600'}`}
                            onClick={handleClickStory}
                        >
                            Story
                        </button>
                        <button
                            className={`px-4 py-4 rounded-md text-lg`}
                        >
                            Graphics
                        </button>
                        <button
                            className={`px-4 py-4rounded-md text-lg`}
                        >
                            Sounds
                        </button>
                        <button
                            className={`px-4 py-4 rounded-md text-lg`}
                        >
                            Colors
                        </button>
                        <button
                            className={`px-4 py-4 rounded-md text-lg hidden`}
                            onClick={handleClickExport}
                        >
                            Export
                        </button>
                    </nav>
                </div>
            </header>
            <main className="">
                <div className="flex-grow grid grid-cols-[2fr,5fr,2fr]">
                    <div className="flex items-start flex-col px-8">
                        <div className="flex items-star py-6">
                            <h2 className="text-lg font-semibold px-4">Seyrie</h2>
                            <h2 className="text-lg px-6">Transcript</h2>
                            <h2 className="text-lg px-6">Assets</h2>
                        </div>
                        <div className="relative">
                            <FaSearch
                                onClick={handleSearch}
                                className="absolute top-2.5 left-2 text-gray-400 cursor-pointer"
                            />
                            <input
                                type="text"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                className="pl-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-4 focus:ring-indigo-500 w-full"
                                placeholder="What do you need help with?"
                            />
                            <h4 className="text-lg font-bold mt-6">Try one of these commands</h4>
                            <p className="mt-4 cursor-pointer" onClick={handleClickSilentTrim}>
                                {isProcessing ? 'Processing...' : 'Cut out silences and filler words'}
                            </p>
                            <p className="mt-4">Add captions</p>
                            <div className="mt-4">
                                <p>{output}</p>
                            </div>

                        </div>
                    </div>
                    <div>
                        <div className="flex items-start justify-center p-4 py-20">
                            <video
                                ref={videoRef}
                                className="w-full max-w-lg h-auto max-h-full rounded-md shadow-lg"
                                controls
                                src={videoUrl}>
                                {captionUrl &&
                                    <track
                                        kind="captions"
                                        src={captionUrl}
                                        srcLang="en"
                                        label="English"
                                        default
                                    />
                                }
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    </div>

                    <div className={`flex items-center justify-center p-4 py-14 ${isExporting || isUploading || isProcessing ? '' : 'invisible'}`}>
                        <nav className="flex flex-col space-y-4">
                            {isUploading
                                ? (
                                    <div className="flex flex-col items-center justify-center space-y-4">
                                        <div className="w-full text-center font-bold text-indigo-500">
                                            Uploading video...
                                        </div>
                                        <div className="w-full pt-1 flex-grow">
                                            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-200">
                                                <div style={{ width: `${uploadProgress}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500"></div>
                                            </div>
                                        </div>
                                        <button onClick={() => { if (uploadTask) uploadTask.cancel(); }} className="px-4 py-2 font-semibold text-red-500 bg-white hover:bg-gray-200 rounded-md border border-red-500">
                                            Cancel Upload
                                        </button>
                                        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-indigo-500"></div>
                                    </div>
                                )
                                : isProcessing
                                    ? (
                                        <div className="flex flex-col items-center justify-center space-y-4">
                                            <div className="w-full text-center font-bold text-indigo-500">
                                                Processing...
                                            </div>
                                            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-indigo-500"></div>
                                        </div>
                                    )
                                    : (
                                        <>
                                            <button className={`px-8 py-4 font-semibold text-indigo-500 bg-white hover:bg-gray-200 rounded-md border border-indigo-500 text-xl ${isExporting ? '' : 'hidden'}`}>
                                                Export as MP4
                                            </button>
                                            <button className={`px-6 py-4 font-semibold text-indigo-500 bg-white hover:bg-gray-200 rounded-md border border-indigo-500 text-xl ${isExporting ? '' : 'hidden'}`}>
                                                Export to Premiere
                                            </button>
                                        </>
                                    )
                            }
                        </nav>
                    </div>

                </div>
                {/* TODO: make timeline extend until bottom of the page */}
                <VideoDropArea
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    videoUrls={videoUrls}
                    thumbnails={thumbnails}
                    selectedVideoIndex={selectedVideoIndex}
                    setSelectedVideoIndex={setSelectedVideoIndex}
                    setVideoUrl={setVideoUrl}
                    rulerMarks={rulerMarks}
                    formatSeconds={formatSeconds}
                />
            </main >
        </div >
    );
};

const ProtectedLayout: React.FC<LayoutProps> = (props) => (
    <ProtectedRoute>
        <Layout {...props} />
    </ProtectedRoute>
);

export default ProtectedLayout;
