
import os
import cv2
import shutil
from fastapi import UploadFile, File, FastAPI
from fastapi.responses import JSONResponse

app = FastAPI()

TEMP_DIR = "temp_videos"
os.makedirs(TEMP_DIR, exist_ok=True)


def get_video_capture(video_path):
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise IOError("❌ Cannot open video")
    fps = cap.get(cv2.CAP_PROP_FPS)
    return cap, fps
