from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
from io import BytesIO
from PIL import Image
import numpy as np
import cv2
from gaze_tracking import GazeTracking

app = Flask(__name__)
CORS(app)

gaze = GazeTracking()

def convert_to_python_types(data):
    if isinstance(data, (list, tuple)):
        return [convert_to_python_types(item) for item in data]
    elif isinstance(data, dict):
        return {key: convert_to_python_types(value) for key, value in data.items()}
    elif isinstance(data, np.int32):
        return int(data)
    elif isinstance(data, np.float32):
        return float(data)
    else:
        return data

@app.route('/receive_frame', methods=['POST'])
def receive_frame():
    frame_data = request.form['frame']  # Base64-encoded image
    frame_data = frame_data.split(",")[1]  # Remove the data URL prefix

    # Decode the image
    image = Image.open(BytesIO(base64.b64decode(frame_data)))
    image = image.convert('RGB')  # Ensure image is in RGB format
    image_np = np.array(image)    # Convert image to numpy array

    # Process the image (e.g., save or analyze)
    cv2.imwrite('received_frame.png', image_np)  # Save as PNG using OpenCV

    gaze.refresh(image_np)        # Pass numpy array to gaze tracker
    image = gaze.annotated_frame()
    left_pupil = list(gaze.pupil_left_coords())
    right_pupil = list(gaze.pupil_right_coords())

    # Convert numpy types to Python types
    gaze_coordinates = {'x': convert_to_python_types(left_pupil), 'y': convert_to_python_types(right_pupil)}

    # Return the gaze coordinates as a JSON response
    return jsonify(gaze_coordinates), 200

if __name__ == '__main__':
    app.run(port=5000)