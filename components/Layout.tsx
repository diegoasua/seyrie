import React, { useState } from 'react';
import { FaSearch } from 'react-icons/fa';
import { RiScissors2Fill } from 'react-icons/ri';
import { TbPointer } from 'react-icons/tb';


interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const [videoUrl, setVideoUrl] = useState('https://www.w3schools.com/html/mov_bbb.mp4');
    const [isExporting, setIsExporting] = useState(false);

    const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();

        if (event.dataTransfer.items && event.dataTransfer.items.length > 0) {
            const file = event.dataTransfer.items[0].getAsFile();
            const url = URL.createObjectURL(file);
            setVideoUrl(url);
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
                            className={`px-8 py-4 font-semibold hover:bg-gray-200 rounded-md border border-indigo-500 text-xl ${isExporting ? 'text-indigo-500 bg-white' : 'text-white bg-indigo-500'}`}
                            onClick={handleClickStory}
                        >
                            Story
                        </button>
                        <button
                            className={`px-6 py-4 font-semibold hover:bg-gray-200 rounded-md border border-indigo-500 text-xl ${isExporting ? 'text-white bg-indigo-500' : 'text-indigo-500 bg-white'}`}
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
                        <video
                            className="w-full h-auto max-h-full rounded-md shadow-lg"
                            controls
                            src={videoUrl}
                            type="video/mp4"
                        >
                            Your browser does not support the video tag.
                        </video>
                    </div>
                    {/* remove invisible to show */}
                    <div className={`flex items-center justify-center p-4 py-14 ${isExporting ? '' : 'invisible'}`}>
                        <nav className="flex flex-col space-y-4">
                            <button className="px-8 py-4 font-semibold text-indigo-500 bg-white hover:bg-gray-200 rounded-md border border-indigo-500 text-xl">
                                Export as MP4
                            </button>
                            <button className="px-6 py-4 font-semibold text-indigo-500 bg-white hover:bg-gray-200 rounded-md border border-indigo-500 text-xl">
                                Export to Premiere
                            </button>
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
