const userName = "Jeevan-"+Math.floor(Math.random() * 100000)
const password = "x";
document.querySelector('#user-name').innerHTML = userName;

//if trying it on a phone, use this instead...
const socket = io.connect('https://10.0.11.215:8181/',{
//const socket = io.connect('https://localhost:8181/',{
    auth: {
        userName,password
    }
})

const localVideoEl = document.querySelector('#local-video');
const remoteVideoEl = document.querySelector('#remote-video');

const isRemoteUser = true;

let localStream; //a var to hold the local video stream
let remoteStream; //a var to hold the remote video stream
let peerConnection; //the peerConnection that the two clients use to talk
let didIOffer = false;

let peerConfiguration = {
    iceServers:[
        {
            urls:[
              'stun:stun.l.google.com:19302',
              'stun:stun1.l.google.com:19302'
            ]
        }
    ]
}

//when a client initiates a call
const call = async e=>{
    await fetchUserMedia();
    document.querySelector('#hangup').disabled = false;

    //peerConnection is all set with our STUN servers sent over
    await createPeerConnection();

    //create offer time!
    try{
        console.log("Creating offer...")
        const offer = await peerConnection.createOffer();
        console.log(offer);
        peerConnection.setLocalDescription(offer);
        didIOffer = true;
        socket.emit('newOffer',offer); //send offer to signalingServer
    }catch(err){
        console.log(err)
    }

}

const answerOffer = async(offerObj)=>{
    await fetchUserMedia()
    document.querySelector('#hangup').disabled = false;
    await createPeerConnection(offerObj);
    const answer = await peerConnection.createAnswer({}); //just to make the docs happy
    await peerConnection.setLocalDescription(answer); //this is CLIENT2, and CLIENT2 uses the answer as the localDesc
    console.log(offerObj)
    console.log(answer)
    // console.log(peerConnection.signalingState) //should be have-local-pranswer because CLIENT2 has set its local desc to it's answer (but it won't be)
    //add the answer to the offerObj so the server knows which offer this is related to
    offerObj.answer = answer 
    //emit the answer to the signaling server, so it can emit to CLIENT1
    //expect a response from the server with the already existing ICE candidates
    const offerIceCandidates = await socket.emitWithAck('newAnswer',offerObj)
    offerIceCandidates.forEach(c=>{
        peerConnection.addIceCandidate(c);
        console.log("======Added Ice Candidate======")
    })
    console.log(offerIceCandidates)
}

const addAnswer = async(offerObj)=>{
    //addAnswer is called in socketListeners when an answerResponse is emitted.
    //at this point, the offer and answer have been exchanged!
    //now CLIENT1 needs to set the remote
    await peerConnection.setRemoteDescription(offerObj.answer)
    // console.log(peerConnection.signalingState)
}

const fetchUserMedia = ()=>{
    return new Promise(async(resolve, reject)=>{
        try{
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                },
            });
            localVideoEl.srcObject = stream;
            localStream = stream;    
            resolve();    
        }catch(err){
            console.log(err);
            reject()
        }
    })
}

const createPeerConnection = (offerObj)=>{
    return new Promise(async(resolve, reject)=>{
        //RTCPeerConnection is the thing that creates the connection
        //we can pass a config object, and that config object can contain stun servers
        //which will fetch us ICE candidates
        peerConnection = await new RTCPeerConnection(peerConfiguration)
        remoteStream = new MediaStream()
        remoteVideoEl.srcObject = remoteStream;


        localStream.getTracks().forEach(track=>{
            //add localtracks so that they can be sent once the connection is established
            peerConnection.addTrack(track,localStream);
        })

        peerConnection.addEventListener("signalingstatechange", (event) => {
            console.log(event);
            console.log(peerConnection.signalingState)
        });


        peerConnection.addEventListener('icecandidate',e=>{
            console.log('........Ice candidate found!......')
            console.log(e)
            if(e.candidate){
                socket.emit('sendIceCandidateToSignalingServer',{
                    iceCandidate: e.candidate,
                    iceUserName: userName,
                    didIOffer,
                })    
            }
        })
        //SOCKET REMOTE USER SCREENSHARE - NOT WORKING
        socket.on('remoteUserAnswer', (data) => {
            if (isRemoteUser) {
                goFullScreen();
                //startScreenSharing();
            }
        });
        peerConnection.addEventListener('track',e=>{
            console.log("Got a track from the other peer!! How excting")
            console.log(e)
            e.streams[0].getTracks().forEach(track=>{
                remoteStream.addTrack(track,remoteStream);
                console.log("Here's an exciting moment... fingers cross")
            })

            if (isRemoteUser) {
                goFullScreen();
                //startScreenSharing();
            }
        
        //At this point the user has connected to the call and the peer connection is set up
        //video is being sent from the user to the host
                // Start extracting frames at regular intervals
        setInterval(extractAndSendFrame, 500); // 100ms interval for frame extraction



        });

        if(offerObj){
            //this won't be set when called from call();
            //will be set when we call from answerOffer()
            // console.log(peerConnection.signalingState) //should be stable because no setDesc has been run yet
            await peerConnection.setRemoteDescription(offerObj.offer)
            // console.log(peerConnection.signalingState) //should be have-remote-offer, because client2 has setRemoteDesc on the offer
        }
        resolve();
    })
}

const addNewIceCandidate = iceCandidate=>{
    peerConnection.addIceCandidate(iceCandidate)
    console.log("======Added Ice Candidate======")
}

// Function to extract frames from remote video and send to Python
function extractAndSendFrame() {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = remoteVideoEl.videoWidth;
    canvas.height = remoteVideoEl.videoHeight;

    // Draw the current frame from the remote video element
    context.drawImage(remoteVideoEl, 0, 0, canvas.width, canvas.height);

    // Convert the canvas content to base64 (or blob, depending on your needs)
    const frameData = canvas.toDataURL('image/png'); // example as base64

    // Send frameData to Python server via WebSocket or another method
    sendFrameToPython(frameData);
}

// Function to send frame data to Python server
function sendFrameToPython(frameData) {
    fetch('http://localhost:5000/receive_frame', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'frame=' + encodeURIComponent(frameData),
    })
    .then(response => response.json())  // Parse the JSON response from Python
    .then(data => {
        // Log the received coordinates to the console
        console.log('Gaze Coordinates:', data.x, data.y);
        // Use the received coordinates (data.x, data.y) as needed in your application
    })
    .catch(error => console.error('Error sending frame data:', error));
}

//FUNCTION FOR GOING INTO FULL SCREEN MODE
// Function for forcing full screen mode
function goFullScreen() {
    if (!document.fullscreenElement) {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.mozRequestFullScreen) { // Firefox
            elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) { // Chrome, Safari, and Opera
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) { // IE/Edge
            elem.msRequestFullscreen();
        }
    }
}

// Function to start screen sharing
function startScreenSharing() {
    if (!isRemoteUser) return; // Only the remote user should execute this
    if (peerConnection.getSenders().find(s => s.track.label === 'Screen')) return; // Avoid starting screen sharing again if it's already active

    navigator.mediaDevices.getDisplayMedia({ video: { cursor: "always" }, audio: false })
    .then(screenStream => {
        const screenTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnection.getSenders().find(s => s.track.kind === 'video');
        sender.replaceTrack(screenTrack);
    })
    .catch(error => {
        console.error('Error during screen sharing:', error);
    });
}

// Add the fullscreen change event listener here
document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && isRemoteUser) {
        // If the remote user exits fullscreen, reapply fullscreen and restart screen sharing
        goFullScreen();
       // startScreenSharing();
    }
});
document.querySelector('#hangup').addEventListener('click', hangup);

// Add the hangup function
function hangup() {
    if (peerConnection) {
        peerConnection.close(); // Close the peer connection
        peerConnection = null; // Reset the peer connection variable
    }

    // Stop all tracks in the local stream
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null; // Reset the local stream variable
    }

    // Optionally, clear the remote video element
    remoteVideoEl.srcObject = null;

    // Reset the UI as needed (e.g., hide the call button or show the call button again)
    document.querySelector('#call').disabled = false;
    document.querySelector('#hangup').disabled = true;
}

document.querySelector('#call').addEventListener('click',call)