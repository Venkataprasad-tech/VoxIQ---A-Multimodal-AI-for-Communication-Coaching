# Makes emotion_tutor/ a Python package.
# Enables imports like:

# from emotion_tutor.emotion_model import predict_emotion  # Used in video_analysis.py
# from emotion_tutor.face_detection import detect_face    # Used in emotion_model.py
# Without it, these imports fail with ModuleNotFoundError: No module named 'emotion_tutor'.
# Current content: Empty (which is fine for simple packages).