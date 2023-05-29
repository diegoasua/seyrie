import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import React, { useEffect, useState } from 'react';


interface DroppableAreaProps {
    id: string;
    children: React.ReactNode;
}

const DroppableArea: React.FC<DroppableAreaProps> = ({ id, children }) => {
    const { setNodeRef } = useDroppable({
        id,
    });

    return (
        <div ref={setNodeRef}>
            {children}
        </div>
    );
}

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

const DraggableVideo: React.FC<{ id: string, videoUrl: string, thumbnails: string[], index: number, selectedVideoIndex: number | null, setVideoUrl: (url: string) => void, setSelectedVideoIndex: (index: number | null) => void }> = ({ id, videoUrl, thumbnails = [], index, selectedVideoIndex, setVideoUrl, setSelectedVideoIndex }) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={`thumbnails flex my-1 rounded-l-lg cursor-pointer relative ${selectedVideoIndex === index ? 'border-4' : ''}`}
            style={{
                ...transform ? { transform: CSS.Translate.toString(transform) } : {},
                ...(selectedVideoIndex === index ? { borderColor: '#848484' } : {})
            }}
            onClick={() => {
                // Only change the displayed video for the first track
                if (index === 0) {
                    setVideoUrl(videoUrl);
                }
                setSelectedVideoIndex(index);
            }}>
            {thumbnails && thumbnails.map((thumbnail, tIndex) => (
                <img key={tIndex} src={thumbnail} alt={`Thumbnail ${tIndex + 1}`} className="w-20 h-12 object-cover" />
            ))}
        </div>
    )

}

const VideoDropArea: React.FC<VideoDropAreaProps> = ({ onDrop, onDragOver, videoUrls, thumbnails, selectedVideoIndex, setSelectedVideoIndex, setVideoUrl, rulerMarks, formatSeconds }) => {
    const [draggingItemId, setDraggingItemId] = useState<string | null>(null);

    // Initialize videos state
    const [videos, setVideos] = useState(videoUrls.map((url, index) => ({ id: index.toString(), url, thumbnails: thumbnails[index] })));

    useEffect(() => {
        setVideos(videoUrls.map((url, index) => ({ id: index.toString(), url, thumbnails: thumbnails[index] })));
    }, [videoUrls, thumbnails]);

    const handleDragStart = (event: DragStartEvent) => {
        setDraggingItemId(event.active.id.toString());
    };


    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setDraggingItemId(null);

        // If the item is dropped over a droppable area
        if (over) {
            const activeItem = videos.find(video => video.id === active.id);
            const overIndex = videos.findIndex(video => video.id === over.id);

            // Reorder videos
            if (activeItem && overIndex !== -1) {
                const updatedVideos = [...videos];
                updatedVideos.splice(overIndex, 0, updatedVideos.splice(updatedVideos.findIndex(video => video.id === active.id), 1)[0]);
                setVideos(updatedVideos);
            }
        }
    };

    return (
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
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
                    {videos.map((video, index) => {
                        return (
                            <DroppableArea key={video.id} id={video.id}>
                                <DraggableVideo id={video.id} videoUrl={video.url} thumbnails={video.thumbnails} index={index} selectedVideoIndex={selectedVideoIndex} setVideoUrl={setVideoUrl} setSelectedVideoIndex={setSelectedVideoIndex} />
                            </DroppableArea>
                        );
                    })}
                    <DragOverlay>
                        {draggingItemId ? (
                            <DraggableVideo id={draggingItemId} videoUrl={videoUrls[draggingItemId]} thumbnails={thumbnails[draggingItemId]} index={draggingItemId} selectedVideoIndex={selectedVideoIndex} setVideoUrl={setVideoUrl} setSelectedVideoIndex={setSelectedVideoIndex} />
                        ) : null}
                    </DragOverlay>
                </div>
            </div>
        </DndContext>
    );
}

export default VideoDropArea;
