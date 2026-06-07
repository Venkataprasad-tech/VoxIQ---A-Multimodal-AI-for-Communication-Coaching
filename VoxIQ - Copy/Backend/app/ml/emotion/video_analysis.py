import time
from collections import defaultdict, deque

from .video_input import get_video_capture
from .landmarks import get_landmarks
from .features import eye_aspect_ratio, LEFT_EYE, RIGHT_EYE
from .face_detection import detect_face
from .emotion_model import predict_emotion

EAR_THRESHOLD = 0.25
CONSEC_FRAMES = 2


def analyze_video(video_path):
    cap, fps = get_video_capture(video_path)
    if fps == 0:
        fps = 25

    frame_count = 0
    blink_count = 0
    eye_closed_frames = 0

    emotion_durations = defaultdict(float)
    emotion_changes = deque()
    last_emotion = None
    last_time = None

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frame_count += 1

        # -------- BLINK (MediaPipe) --------
        landmarks = get_landmarks(frame)

        if landmarks:
            left_eye = [landmarks[i] for i in LEFT_EYE]
            right_eye = [landmarks[i] for i in RIGHT_EYE]

            ear = (eye_aspect_ratio(left_eye) + eye_aspect_ratio(right_eye)) / 2

            if ear < EAR_THRESHOLD:
                eye_closed_frames += 1
            else:
                if eye_closed_frames >= CONSEC_FRAMES:
                    blink_count += 1
                eye_closed_frames = 0

        # -------- EMOTION (CNN) --------
        face = detect_face(frame)
        if face is not None and face.size > 0:
            emotion = predict_emotion(face)

            now = time.time()
            if last_emotion:
                emotion_durations[last_emotion] += now - last_time

            if emotion != last_emotion:
                emotion_changes.append(now)

            last_emotion = emotion
            last_time = now

            while emotion_changes and now - emotion_changes[0] > 60:
                emotion_changes.popleft()

    cap.release()

    dominant_emotion = (
        max(emotion_durations, key=emotion_durations.get)
        if emotion_durations else "unknown"
    )

    return {
        "frames_processed": frame_count,
        "blink_count": blink_count,
        "dominant_emotion": dominant_emotion,
        "emotion_duration_seconds": {
            k: round(v, 1) for k, v in emotion_durations.items()
        },
        "emotion_changes_1min": len(emotion_changes),
        "clumsy_behavior": blink_count < 5 or len(emotion_changes) > 3
    }
