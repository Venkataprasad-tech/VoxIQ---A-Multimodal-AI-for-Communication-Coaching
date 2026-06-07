import numpy as np

LEFT_EYE = [33, 160, 158, 133, 153, 144]
RIGHT_EYE = [362, 385, 387, 263, 373, 380]

UPPER_LIP = 13
LOWER_LIP = 14


def euclidean(p1, p2):
    return np.linalg.norm(np.array(p1) - np.array(p2))


def eye_aspect_ratio(eye_pts):
    A = euclidean(eye_pts[1], eye_pts[5])
    B = euclidean(eye_pts[2], eye_pts[4])
    C = euclidean(eye_pts[0], eye_pts[3])

    if C == 0:
        return 0

    return (A + B) / (2.0 * C)


def compute_ear(landmarks):
    left_eye = [landmarks[i] for i in LEFT_EYE]
    right_eye = [landmarks[i] for i in RIGHT_EYE]

    left_ear = eye_aspect_ratio(left_eye)
    right_ear = eye_aspect_ratio(right_eye)

    return (left_ear + right_ear) / 2


def lip_distance(landmarks):
    return euclidean(landmarks[UPPER_LIP], landmarks[LOWER_LIP])


def eye_focus_score(landmarks, frame_width):
    left_eye_center = np.mean([landmarks[i] for i in LEFT_EYE], axis=0)
    right_eye_center = np.mean([landmarks[i] for i in RIGHT_EYE], axis=0)

    gaze_x = (left_eye_center[0] + right_eye_center[0]) / 2
    center_x = frame_width / 2

    deviation = abs(gaze_x - center_x)
    return max(0, 1 - deviation / center_x)
