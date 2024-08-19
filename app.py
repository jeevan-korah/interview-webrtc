# app.py

from flask import Flask, request
import base64
from io import BytesIO
from PIL import Image
import cv2
from gaze_tracking import GazeTracking

app = Flask(__name__)
gaze = GazeTracking()

@app.route('/receive_frame', methods=['POST'])
def receive_frame():
    frame_data = request.form['frame']  # Base64-encoded image
    frame_data = frame_data.split(",")[1]  # Remove the data URL prefix

    # Decode the image

    # Process the image (e.g., save or analyze)
    while True:
        image = Image.open(BytesIO(base64.b64decode(frame_data)))
        _, frame = image
        gaze.refresh(frame)
        frame = gaze.annotated_frame()
        left_pupil = list(gaze.pupil_left_coords())
        right_pupil = list(gaze.pupil_right_coords())
        
    
    gaze_coordinates = {'x':left_pupil, 'y':right_pupil}
    return jasonify(gaze_coordinates)

if __name__ == '__main__':
    app.run(port=5000)
