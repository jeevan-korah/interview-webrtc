"""
Demonstration of the GazeTracking library.
Check the README.md for complete documentation.
"""

import cv2
from gaze_tracking import GazeTracking

gaze = GazeTracking()
webcam = cv2.VideoCapture(0)

while True:
    _, frame = webcam.read()
    gaze.refresh(frame)
    frame = gaze.annotated_frame()
    left_pupil = gaze.pupil_left_coords()
    right_pupil = gaze.pupil_right_coords()

    
   
   
webcam.release()
cv2.destroyAllWindows()
