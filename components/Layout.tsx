import { getStorage, ref, uploadBytesResumable } from 'firebase/storage';
import React, { useState } from 'react';
import { FaSearch } from 'react-icons/fa';
import { RiScissors2Fill } from 'react-icons/ri';
import { TbPointer } from 'react-icons/tb';
import app from '../firebase';


interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const [videoUrl, setVideoUrl] = useState('https://www.w3schools.com/html/mov_bbb.mp4');
    const [isExporting, setIsExporting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const onDrop = async (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();

        if (event.dataTransfer.items && event.dataTransfer.items.length > 0) {
            const file = event.dataTransfer.items[0].getAsFile();

            if (file) { // Check if file is not null
                const url = URL.createObjectURL(file);
                setVideoUrl(url);

                // Upload to Firebase Storage
                const storage = getStorage(app);
                const storageRef = ref(storage, 'uploads/' + file.name);

                setIsUploading(true); // Start uploading

                const uploadTask = uploadBytesResumable(storageRef, file);

                uploadTask.on('state_changed',
                    (snapshot) => {
                        // Observe state change events such as progress, pause, and resume
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        console.log('Upload is ' + progress + '% done');
                        setUploadProgress(progress);
                    },
                    (error) => {
                        // Handle unsuccessful uploads
                        console.error('Error uploading file: ', error);
                    },
                    () => {
                        // Handle successful uploads on complete
                        console.log('Uploaded ', file.name);
                        setIsUploading(false); // Stop uploading
                        setUploadProgress(0); // Reset progress
                    }
                );
            } else {
                console.error('Error: File is null');
            }
        }
    };


    const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
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
                                onClick={() => console.log("Command search clicked")}
                                className="absolute top-2.5 left-2 text-gray-400 cursor-pointer"
                            />
                            <input
                                type="text"
                                className="pl-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder=""
                            />
                        </div>
                    </div>
                    <div className="flex items-start justify-center p-4 py-14">
                        <video className="w-full h-auto max-h-full rounded-md shadow-lg" controls>
                            <source src={videoUrl} type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>
                    </div>
                    <div className={`flex items-center justify-center p-4 py-14 ${isExporting || isUploading ? '' : 'invisible'}`}>
                        <nav className="flex flex-col space-y-4">
                            {isUploading
                                ? (
                                    <>
                                        <div className="relative pt-1">
                                            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-200">
                                                <div style={{ width: `${uploadProgress}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500"></div>
                                            </div>
                                        </div>
                                        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-indigo-500"></div>
                                    </>
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
                    <div className="absolute top-0 left-0 bottom-0 w-8 bg-gray-300 border-r-2 border-t-2 border-black flex items-center justify-top flex-col">
                        <TbPointer className="mt-4 mb-2" />
                        <RiScissors2Fill />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Layout;
