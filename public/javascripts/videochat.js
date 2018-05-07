'use strict';

let localVideo = document.querySelector('.videochat__localVideo'); 
// let remoteVideo = document.querySelector('.videochat__remoteVideo');
let callButton = document.querySelector('.videochat__call');
let hangupButton = document.querySelector('.videochat__hangup');

let constraints = {
  audio: true,
  video: true
};
let configuration = {
  iceServers: [{
    urls: 'stun:stun.l.google.com:19302'
  }]
};
let pcs = {}, remoteVideo = {};
let localStream;
let SIGNAL_ROOM = `${roomId}_signal`;

callButton.onclick = function() {
  callButton.disabled = 'true';
  displayVideo()
  .then(() => {
    console.log('Starting call');
    socket.emit('start call', SIGNAL_ROOM);
  });
};

hangupButton.onclick = function() {
  endCall();

  socket.emit('end stream', SIGNAL_ROOM, socket.id);
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
  };
});

socket.on('end stream', (id) => endStream(id));

socket.on('start signaling', (id) => startSignaling(true, id));

// Signaling messages
socket.on('signaling_message', function(data) {
  console.log('Signal recieved: ' + data.type);

  // Setup the RTC Peer Connection object
  if (!pcs[data.id])
    startSignaling(false, data.id);

  let message = JSON.parse(data.message);
  if (message.sdp) {
    let desc = message.sdp;

    // if we get an offer, we need to reply with an answer
    if (desc.type == 'offer') {
      console.log('Received Offer');
      pcs[data.id].setRemoteDescription(desc)
        .then(() => pcs[data.id].createAnswer()) // create answer based off of offer and send it
        .then((answer) => pcs[data.id].setLocalDescription(answer))
        .then(() => {
          socket.emit('signal', { type: 'SPD', message: JSON.stringify({ sdp: pcs[data.id].localDescription }), id: data.id });
        })
        .catch(logError);
    } else if (desc.type == 'answer') {
      console.log('recieved answer');
      pcs[data.id].setRemoteDescription(desc).catch(logError);
    } else {
      console.error('Unsupported SDP type.' + JSON.stringify(desc));
    }
  } else {
    console.log('add remote ice candidate');
    pcs[data.id].addIceCandidate(message.candidate).catch(logError);
  }
});

// Initiates signaling process
function startSignaling(isInitiator, id) {
  console.log('staring signaling...');

  pcs[id] = new RTCPeerConnection(configuration);

  console.log("Peer Connection Object Start Signalling: " + JSON.stringify(pcs));

  // send any ice candidates to the other peer
  pcs[id].onicecandidate = function(event) {
    if (event.candidate) {
      socket.emit('signal', { type: 'ice candidate', message: JSON.stringify({ candidate: event.candidate }), id: id });      
    } 
    console.log('completed that ice candidate');
  };

  // only initiator generates an offer
  if (isInitiator) {
    let isNegotiating = false;
    
    // triggered when need SDP offer, trigger offer generation
    pcs[id].onnegotiationneeded = function() {
      if (isNegotiating) {
        console.log('Skip nested negotiations');
        return;
      }
      isNegotiating = true;

      console.log('on negotiation called');

      pcs[id].createOffer().then(offer => { console.log('setting localdescription after creating offer'); return pcs[id].setLocalDescription(offer); })
        .then(() =>  {
          // send offer to other peer
          socket.emit('signal', { type: 'SDP', message: JSON.stringify({ sdp: pcs[id].localDescription }), id: id });
        })
        .catch(logError);
    };
  }

  // once remote track arrives, show it in the remote video element
  pcs[id].ontrack = function(event) {
    // don't set srcObject again if it is already set    
    if (remoteVideo[id] && !remoteVideo[id].srcObject) {
      // Create new remote video
      remoteVideo[id].srcObject = event.streams[0];    
      document.querySelector('.videochat').append(remoteVideo[id]);
    }
  };

  console.count("Add local stream");
  pcs[id].addTrack(localStream.getAudioTracks()[0], localStream)
  pcs[id].addTrack(localStream.getVideoTracks()[0], localStream)

  remoteVideo[id] = document.createElement('video');
  remoteVideo[id].autoplay = 'true';
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

function endCall() {
  console.log('Ending call');
  for (let pc of Object.values(pcs)) {
    pc.close();
  }
  pcs = null;
}

function endStream(id) {
  console.log('Ending stream: ' + id);
  pcs[id].close();
}

function logError(err) {
  console.error(err.name + ': ' + err.message);
}