import cv2
import numpy as np
from collections import deque
from tensorflow.keras.models import load_model
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "emotion_model")

EMOTIONS = [
    "angry",
    "contempt",
    "disgust",
    "fear",
    "happy",
    "neutrality",
    "sad",
    "surprise"
]

emotion_buffer = deque(maxlen=7)
CONFIDENCE_THRESHOLD = 0.55

print("Loading emotion model...")
model = load_model(MODEL_PATH)
print("Emotion model loaded")


def preprocess_face(face_img):
    gray = cv2.cvtColor(face_img, cv2.COLOR_BGR2GRAY)
    gray = cv2.resize(gray, (48, 48))
    gray = gray.astype("float32") / 255.0
    gray = np.expand_dims(gray, axis=-1)
    gray = np.expand_dims(gray, axis=0)
    return gray


def predict_emotion(face_img):

    if face_img is None or face_img.size == 0:
        return "unknown"

    try:
        input_tensor = preprocess_face(face_img)

        preds = model.predict(input_tensor, verbose=0)[0]
        confidence = np.max(preds)
        emotion_idx = np.argmax(preds)

        if confidence < CONFIDENCE_THRESHOLD:
            emotion = "Neutral"
        else:
            emotion = EMOTIONS[emotion_idx]

        emotion_buffer.append(emotion)
        stable_emotion = max(set(emotion_buffer), key=emotion_buffer.count)

        return stable_emotion

    except Exception as e:
        print("Emotion prediction error:", e)
        return "unknown"
