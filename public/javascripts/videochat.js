'use strict';

let localVideo = document.querySelector('.videochat__localVideo'); 
let remoteVideo = document.querySelector('.videochat__remoteVideo');
let callButton = document.querySelector('.videochat__call');

let constraints = {
  audio: true,
  video: true
};
let configuration = {
  iceServers: [{
    urls: 'stun:stun.l.google.com:19302'
  }]
};
let pc;
let localStream;
let SIGNAL_ROOM = `${roomId}_signal`;

// TODO Change callButton text for any new client that enters the room when call already started
callButton.onclick = function() {
  callButton.disabled = 'true';
  displayVideo()
  .then(() => {
    console.log('Starting call');
    socket.emit('start call', SIGNAL_ROOM)
  });
};

// Join video call
socket.on('call started', function() {
  console.log('call started');
  callButton.innerText = 'Join Call';
  callButton.onclick = function() {
    console.log('join call');   
    callButton.disabled = 'true';
    // wait for displayVideo before join call
    displayVideo()
      .then(() => {
        console.log('Signaling Join Call');
        socket.emit('join call', SIGNAL_ROOM); 
      });
    // socket.emit('join call', SIGNAL_ROOM); 
    
  };
});

socket.on('start signaling', () => startSignaling(true));

// Signaling messages
socket.on('signaling_message', function(data) {
  console.log('Signal recieved: ' + data.type);

  // Setup the RTC Peer Connection object
  if (!pc)
    startSignaling(false);

  let message = JSON.parse(data.message);
  if (message.sdp) {
    let desc = message.sdp;

    // if we get an offer, we need to reply with an answer
    if (desc.type == 'offer') {
      console.log('Received Offer');
      pc.setRemoteDescription(desc)
        .then(() => pc.createAnswer()) // create answer based off of offer and send it
        .then((answer) => pc.setLocalDescription(answer))
        .then(() => {
          socket.emit('signal', { type: 'SPD', message: JSON.stringify({ sdp: pc.localDescription }), room: SIGNAL_ROOM });
        })
        .catch(logError);
    } else if (desc.type == 'answer') {
      console.log('recieved answer');
      pc.setRemoteDescription(desc).catch(logError);
    } else {
      console.error('Unsupported SDP type.' + JSON.stringify(desc));
    }
  } else {
    console.log('add remote ice candidate');
    pc.addIceCandidate(message.candidate).catch(logError);
  }
});

// Initiates signaling process
function startSignaling(isInitiator) {
  console.log('staring signaling...');

  pc = new RTCPeerConnection(configuration);

  // send any ice candidates to the other peer
  pc.onicecandidate = function(event) {
    if (event.candidate) {
      socket.emit('signal', { type: 'ice candidate', message: JSON.stringify({ candidate: event.candidate }), room: SIGNAL_ROOM });      
    } 
    console.log('completed that ice candidate');
  };

  // only initiator generates an offer
  if (isInitiator) {
    let isNegotiating = false;
    
    // triggered when need SDP offer, trigger offer generation
    pc.onnegotiationneeded = function() {
      if (isNegotiating) {
        console.log('Skip nested negotiations');
        return;
      }
      isNegotiating = true;

      console.log('on negotiation called');

      pc.createOffer().then(offer => { console.log('setting localdescription after creating offer'); return pc.setLocalDescription(offer); })
        .then(() =>  {
          // send offer to other peer
          socket.emit('signal', { type: 'SDP', message: JSON.stringify({ sdp: pc.localDescription }), room: SIGNAL_ROOM });
        })
        .catch(logError);
    };
  }

  // once remote track arrives, show it in the remote video element
  pc.ontrack = function(event) {
    // don't set srcObject again if it is already set
    if (!remoteVideo.srcObject)
      remoteVideo.srcObject = event.streams[0];
  };

  console.count("Add local stream");
  pc.addTrack(localStream.getAudioTracks()[0], localStream)
  pc.addTrack(localStream.getVideoTracks()[0], localStream)
}

function displayVideo() {
  if (hasGetUserMedia()) {
    // get local stream, show it in localVideo element and add it to peerconnection object to be sent to peer
    return navigator.mediaDevices.getUserMedia(constraints)
      .then(onSuccess).catch(logError);
  } else {
    console.error('getUserMedia() is not supported by your browser');
  }
}

function hasGetUserMedia() {
  // Feature detection and convert to boolean
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
}

function onSuccess(stream) {
  localVideo.srcObject = stream;
  localStream = stream;
}

function logError(err) {
  console.error(err.name + ': ' + err.message);
}