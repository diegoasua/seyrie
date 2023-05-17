import axios from 'axios';
import { getDownloadURL, getStorage, ref, uploadBytesResumable, UploadTask } from 'firebase/storage';
import React, { useEffect, useRef, useState } from 'react';
import { FaSearch } from 'react-icons/fa';
import { app } from '../firebase';


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


const Layout: React.FC<LayoutProps> = ({ children }) => {
    const [videoUrl, setVideoUrl] = useState('');
    const [videoNameDisplay, setVideoNameDisplay] = useState('altman_lex.mp4');
    const [captionUrl, setCaptionUrl] = useState('');
    const [isExporting, setIsExporting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadTask, setUploadTask] = useState<UploadTask | null>(null);
    const currentCaptionUrl = useRef<string | null>(null);
    const [userInput, setUserInput] = useState('');
    const [output, setOutput] = useState('');



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
        // start of call
        // axios.post('https://auto-cut-myxlwik5bq-uw.a.run.app/process_video', { filename: 'IMG_0887.mov' }, {
        //     headers: {
        //         'Content-Type': 'application/json'
        //     },
        //     withCredentials: true
        // })
        //     .then(response => {
        //         console.log(response.data);
        //     })
        //     .catch(error => {
        //         console.error('Error:', error);
        //     });

        if (event.dataTransfer.items && event.dataTransfer.items.length > 0) {
            const file = event.dataTransfer.items[0].getAsFile();

            if (file) { // Check if file is not null
                const url = URL.createObjectURL(file);
                setVideoUrl(url); // Set local URL immediately

                // Upload to Firebase Storage
                const storage = getStorage(app);
                const storageRef = ref(storage, 'uploads/' + file.name);

                setIsUploading(true); // Start uploading

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
                        setIsUploading(false); // Stop uploading
                        setUploadProgress(0); // Reset progress
                        setUploadTask(null); // Clear upload task
                    },
                    async () => {
                        // Handle successful uploads on complete
                        console.log('Uploaded ', file.name);
                        setVideoNameDisplay(file.name);
                        setIsUploading(false);
                        setUploadProgress(0);
                        setUploadTask(null);
                        handleProcessedVideo();
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
                        responseType: 'blob', // important
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
        }, 35000); // 35000 milliseconds = 35 seconds
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
    return (
        <div className="min-h-screen flex flex-col bg-white">
            <header className="bg-white">
                <div className="mx-auto py-8 px-4">
                    <nav className="flex space-x-4">
                        <button
                            className={`px-8 py-4 font-semibold rounded-md border border-indigo-500 text-xl ${isExporting ? 'text-indigo-500 bg-white' : 'text-white bg-indigo-500'}`}
                            onClick={handleClickStory}
                        >
                            Story
                        </button>
                        <button
                            className={`px-6 py-4 font-semibold rounded-md border border-indigo-500 text-xl ${isExporting ? 'text-white bg-indigo-500' : 'text-indigo-500 bg-white'}`}
                            onClick={handleClickExport}
                        >
                            Export
                        </button>
                    </nav>
                </div>
            </header>
            <main className="flex flex-col flex-grow">
                <div className="flex-grow grid grid-cols-[2fr,5fr,2fr]">
                    <div className="flex items-start flex-col p-4">
                        <h2 className="text-xl font-semibold mb-4">Seyrie</h2>
                        <div className="relative">
                            <FaSearch
                                onClick={handleSearch}
                                className="absolute top-2.5 left-2 text-gray-400 cursor-pointer"
                            />
                            <input
                                type="text"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                className="pl-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                                placeholder="What do you need help with?"
                            />
                            <h4 className="text-lg font-bold mt-6">Try one of these commands</h4>
                            <p className="mt-4">Cut out silences and filler words</p>
                            <p className="mt-4">Add captions</p>
                            <div className="mt-4">
                                <p>{output}</p>
                            </div>

                        </div>
                    </div>
                    <div>
                        <div className="flex items-start justify-center p-4 py-14">
                            <video className="w-full h-auto max-h-full rounded-md shadow-lg" controls src={videoUrl}>
                                {captionUrl && <track kind="captions"
                                    src={captionUrl}
                                    srcLang="en"
                                    label="English"
                                    default />}
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    </div>
                    <div className={`flex items-center justify-center p-4 py-14 ${isExporting || isUploading ? '' : 'invisible'}`}>
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
                <div className="items-center justify-center h-32 flex items-start bg-gray-200 relative" onDrop={onDrop} onDragOver={onDragOver}>
                    <div className="text-center text-4xl font-bold text-gray-500">Drop a video to start editing</div>
                    {/* <div className="absolute top-0 left-0 bottom-0 w-8 bg-gray-300 border-r-2 border-t-2 border-black flex items-center justify-top flex-col">
                        <TbPointer className="mt-4 mb-2" />
                        <RiScissors2Fill />
                    </div> */}
                </div>
            </main>
        </div>
    );
};

export default Layout;
