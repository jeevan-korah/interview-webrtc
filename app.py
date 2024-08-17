# app.py

from flask import Flask, request
import base64
from io import BytesIO
from PIL import Image

app = Flask(__name__)

@app.route('/receive_frame', methods=['POST'])
def receive_frame():
    frame_data = request.form['frame']  # Base64-encoded image
    frame_data = frame_data.split(",")[1]  # Remove the data URL prefix

    # Decode the image
    image = Image.open(BytesIO(base64.b64decode(frame_data)))

    # Process the image (e.g., save or analyze)
    image.save('received_frame.png')  # Example of saving the frame

    return "Frame received", 200

if __name__ == '__main__':
    app.run(port=5000)
