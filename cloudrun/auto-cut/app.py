import os
from typing import Dict, List, Tuple

import numpy as np
from flask import Flask, jsonify, request
from flask_cors import CORS
from google.cloud import storage
from moviepy.audio.io.AudioFileClip import AudioFileClip
from moviepy.editor import VideoFileClip, concatenate_videoclips
from moviepy.video.fx.all import speedx
from moviepy.video.io.VideoFileClip import VideoFileClip

MIN_LOUD_DURATION = 2
MAGNITUDE_THRESHOLD_RATIO = 0.01
DURATION_THRESHOLD = 0.5
FAILURE_TOLERANCE_RATIO = 0.1
SPACE_ON_EDGES = 0.1
CUT = ["silent"]


app = Flask(__name__)
CORS(app, origins="https://app.seyrie.com")


def download_blob(bucket_name, source_blob_name, destination_file_name):
    """Downloads a blob from the bucket."""
    storage_client = storage.Client()

    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(source_blob_name)
    blob.download_to_filename(destination_file_name)

    print(f"Blob {source_blob_name} downloaded to {destination_file_name}.")


def upload_blob(bucket_name, source_file_name, destination_blob_name):
    """Uploads a file to the bucket."""
    storage_client = storage.Client()

    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(destination_blob_name)

    blob.upload_from_filename(source_file_name)

    print(f"File {source_file_name} uploaded to {destination_blob_name}.")


class Clip:
    def __init__(
        self, clip_path: str, min_loud_part_duration: int, silence_part_speed: int
    ) -> None:
        self.clip = VideoFileClip(clip_path)
        self.audio = Audio(self.clip.audio)
        self.cut_to_method = {
            "silent": self.jumpcut_silent_parts,
            "voiced": self.jumpcut_voiced_parts,
        }
        self.min_loud_part_duration = min_loud_part_duration
        self.silence_part_speed = silence_part_speed

    def jumpcut(
        self,
        cuts: List[str],
        magnitude_threshold_ratio: float,
        duration_threshold_in_seconds: float,
        failure_tolerance_ratio: float,
        space_on_edges: float,
    ) -> Dict[str, VideoFileClip]:

        intervals_to_cut = self.audio.get_intervals_to_cut(
            magnitude_threshold_ratio,
            duration_threshold_in_seconds,
            failure_tolerance_ratio,
            space_on_edges,
        )
        outputs = {}
        for cut in cuts:
            jumpcutted_clips = self.cut_to_method[cut](intervals_to_cut)
            outputs[cut] = concatenate_videoclips(jumpcutted_clips)

        return outputs

    def jumpcut_silent_parts(
        self, intervals_to_cut: List[Tuple[float, float]]
    ) -> List[VideoFileClip]:
        jumpcutted_clips = []
        previous_stop = 0
        for start, stop in intervals_to_cut:
            clip_before = self.clip.subclip(previous_stop, start)

            if clip_before.duration > self.min_loud_part_duration:
                jumpcutted_clips.append(clip_before)

            if self.silence_part_speed is not None:
                silence_clip = self.clip.subclip(start, stop)
                silence_clip = speedx(
                    silence_clip, self.silence_part_speed
                ).without_audio()
                jumpcutted_clips.append(silence_clip)

            previous_stop = stop

        if previous_stop < self.clip.duration:
            last_clip = self.clip.subclip(previous_stop, self.clip.duration)
            jumpcutted_clips.append(last_clip)
        return jumpcutted_clips

    def jumpcut_voiced_parts(
        self, intervals_to_cut: List[Tuple[float, float]]
    ) -> List[VideoFileClip]:
        jumpcutted_clips = []
        for start, stop in intervals_to_cut:
            if start < stop:
                silence_clip = self.clip.subclip(start, stop)
                jumpcutted_clips.append(silence_clip)
        return jumpcutted_clips


class Audio:
    def __init__(self, audio: AudioFileClip) -> None:
        self.audio = audio
        self.fps = audio.fps

        self.signal = self.audio.to_soundarray()
        if len(self.signal.shape) == 1:
            self.signal = self.signal.reshape(-1, 1)

    def get_intervals_to_cut(
        self,
        magnitude_threshold_ratio: float,
        duration_threshold_in_seconds: float,
        failure_tolerance_ratio: float,
        space_on_edges: float,
    ) -> List[Tuple[float, float]]:
        min_magnitude = min(abs(np.min(self.signal)), np.max(self.signal))
        magnitude_threshold = min_magnitude * magnitude_threshold_ratio
        failure_tolerance = self.fps * failure_tolerance_ratio
        duration_threshold = self.fps * duration_threshold_in_seconds
        silence_counter = 0
        failure_counter = 0

        intervals_to_cut = []
        absolute_signal = np.absolute(self.signal)
        for i, values in enumerate(absolute_signal):
            silence = all([value < magnitude_threshold for value in values])
            silence_counter += silence
            failure_counter += not silence
            if failure_counter >= failure_tolerance:
                if silence_counter >= duration_threshold:
                    interval_end = (i - failure_counter) / self.fps
                    interval_start = interval_end - (silence_counter / self.fps)

                    interval_start += space_on_edges
                    interval_end -= space_on_edges

                    intervals_to_cut.append(
                        (abs(interval_start), interval_end)
                    )  # in seconds
                silence_counter = 0
                failure_counter = 0
        return intervals_to_cut


@app.route("/process_video", methods=["POST"])
def process_video():
    data = request.get_json()
    video_filename = data["filename"]
    input_path = "/tmp/" + video_filename
    output_path = "/tmp/" + "processed_" + video_filename

    download_blob(
        "potent-pursuit-386804.appspot.com", "uploads/" + video_filename, input_path
    )

    cuts = CUT
    codec = None
    bitrate = None
    clip = Clip(str(input_path), MIN_LOUD_DURATION, None)
    outputs = clip.jumpcut(
        cuts,
        MAGNITUDE_THRESHOLD_RATIO,
        DURATION_THRESHOLD,
        FAILURE_TOLERANCE_RATIO,
        SPACE_ON_EDGES,
    )
    for cut_type, jumpcutted_clip in outputs.items():
        jumpcutted_clip.write_videofile(str(output_path), codec=codec, bitrate=bitrate)

    upload_blob(
        "potent-pursuit-386804.appspot.com",
        output_path,
        "uploads/" + "processed_" + video_filename,
    )

    return jsonify({"message": "Video processed successfully"}), 200


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))
