// VideoDropArea.tsx

import React, { DragEvent, useRef } from 'react';

interface VideoDropAreaProps {
    onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
    onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
    videoUrls: string[];
    thumbnails: string[][];
    selectedVideoIndex: number | null;
    setSelectedVideoIndex: (index: number | null) => void;
    setVideoUrl: (url: string) => void;
    rulerMarks: number[];
    formatSeconds: (seconds: number) => string;
}

const VideoDropArea: React.FC<VideoDropAreaProps> = ({ onDrop, onDragOver, videoUrls, thumbnails, selectedVideoIndex, setSelectedVideoIndex, setVideoUrl, rulerMarks, formatSeconds }) => {
    const dragItem = useRef<{ index: number }>();
    const dragNode = useRef<Element>();

    const handleDragStart = (e: DragEvent, index: number) => {
        dragItem.current = { index };
        dragNode.current = e.target as Element;

        setTimeout(() => {
            if (dragNode.current) dragNode.current.addEventListener('dragend', handleDragEnd);
        }, 0);
    }

    const handleDragEnd = () => {
        if (dragNode.current) {
            dragNode.current.removeEventListener('dragend', handleDragEnd);
            dragNode.current = null;
            dragItem.current = undefined;
        }
    }

    const handleDragEnter = (e: DragEvent, targetIdx: number) => {
        if (dragItem.current && targetIdx !== dragItem.current.index) {
            const newVideoUrls = [...videoUrls];
            const newThumbnails = [...thumbnails];

            newVideoUrls.splice(targetIdx, 0, newVideoUrls.splice(dragItem.current.index, 1)[0]);
            newThumbnails.splice(targetIdx, 0, newThumbnails.splice(dragItem.current.index, 1)[0]);

            setSelectedVideoIndex(targetIdx);
            setVideoUrl(newVideoUrls[0]);
        }
    }

    return (
        <div className="text-center text-2xl font-bold text-gray-500 mb-2 bg-gray-400 relative" style={{ backgroundColor: '#ededed' }} onDrop={onDrop} onDragOver={onDragOver}>
            {videoUrls.length === 0 && "Drop a video to start editing"}
            <div className="absolute top-0 left-0 bottom-0 w-16 bg-gray-300 flex items-center justify-top flex-col" style={{ backgroundColor: '#ededed' }}>
            </div>
            <div className="w-full overflow-x-auto hide-scrollbar justify-top flex flex-col px-32">
                <div className="flex mb-5">
                    {rulerMarks.map((mark, index) => (
                        <div key={mark} className="flex flex-col" style={{ minWidth: index === 0 ? '0px' : '80px' }}>
                            <div className="border-r-2 items-right" style={{ height: index % 10 === 0 ? '20px' : '10px', borderColor: '#848484' }} />
                            {index === 0 ? <span className="text-xs text-left -translate-x-4" style={{ color: '#848484' }}>{formatSeconds(mark)}</span> : null}
                            {index % 10 === 0 && index !== 0 ? <span className="text-xs text-right px-16" style={{ color: '#848484' }}>{formatSeconds(mark)}</span> : null}
                        </div>
                    ))}
                </div>
                {videoUrls.map((videoUrl, index) => {
                    return (
                        <div key={index}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragEnter={(e) => handleDragEnter(e, index)}
                            className={`thumbnails flex my-1 rounded-l-lg cursor-pointer relative ${selectedVideoIndex === index ? 'border-4' : ''}`}
                            style={selectedVideoIndex === index ? { borderColor: '#848484' } : {}}
                            onClick={() => {
                                // Only change the displayed video for the first track
                                if (index === 0) {
                                    setVideoUrl(videoUrl);
                                }
                                setSelectedVideoIndex(index);
                            }}>
                            {thumbnails[index]?.map((thumbnail, tIndex) => (
                                <img key={tIndex} src={thumbnail} alt={`Thumbnail ${tIndex + 1}`} className="w-20 h-12 object-cover" />
                            ))}
                        </div>
                    );
                })}

            </div>
        </div>
    );
}

export default VideoDropArea;


