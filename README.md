# Video Conference App for Interviews
![demo](https://github.com/user-attachments/assets/728cc753-5b0a-4aa1-a1d9-8fac64bfcb44)

This is a web-based application designed for conducting interviews with advanced features like real-time gaze tracking, AI-powered interviewer assistance, and cheating detection. The app supports a two-participant video call, with an interviewee and an interviewer.

**You will need to download the Gaze Tracking Model from "github.com/antoinelame/GazeTracking". Add the "gaze_tracking" folder into the root folder.**

## Features

- **Real-time Video Call**: Supports high-quality video and audio communication between two participants.
- **Gaze Tracking**: Tracks the interviewee's gaze during the interview, providing real-time data to the interviewer.
- **Cheating Detection**: Analyzes gaze data to detect discrepancies and potential cheating behavior.
- **AI-Assisted Interviewer**: Utilizes AI to assist the interviewer by providing real-time data and monitoring the interview based on predefined guidelines.
- **Screensharing**: Forces the remote user to share their full screen, with automatic reactivation if they exit full-screen mode.
- **Heatmap Generation**: Creates a heatmap showing the areas of the screen the interviewee focused on during the interview.

## Problems Faced

- Connection between the python model and JS is not robust.
- Screensharing functionality causing lot of bugs (disabled).
- As of right now, the call can support max of 2 peers (adding more peers can cause instabilty as webRTC is a peer-to-peer protocol). For supporting more peers, an intermediatory virtual machine is required.

## Ongoing/ Need to Implement
- Authentication and calibration pages at start
- Media device selection
- Responsive Design
- UX friendly alerts
- Session Expiry
- Load Balancing and Optimized Video Streaming
- Detailed Analytics (Gaze Tracking)
- File Sharing
- Call Recording
- Breakout Rooms: Interviewee can connect to different departments in a single call
  
