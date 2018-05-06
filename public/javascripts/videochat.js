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
let pc = {};
let localStream;
let SIGNAL_ROOM = `${roomId}_signal`;
let remoteVideo = {};

callButton.onclick = function() {
  callButton.disabled = 'true';
  displayVideo()
  .then(() => {
    console.log('Starting call');
    socket.emit('start call')
  });
};

// hangupButton.onclick = function() {
//   endCall();

//   socket.emit('end call', SIGNAL_ROOM);
// };

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

socket.on('end call', endCall);

socket.on('start signaling', (id) => startSignaling(true, id));

// Signaling messages
socket.on('signaling_message', function(data) {
  console.log('Signal recieved: ' + data.type);

  // Setup the RTC Peer Connection object
  if (!pc[data.id])
    startSignaling(false, data.id);

  let message = JSON.parse(data.message);
  if (message.sdp) {
    let desc = message.sdp;

    // if we get an offer, we need to reply with an answer
    if (desc.type == 'offer') {
      console.log('Received Offer');
      pc[data.id].setRemoteDescription(desc)
        .then(() => pc[data.id].createAnswer()) // create answer based off of offer and send it
        .then((answer) => pc[data.id].setLocalDescription(answer))
        .then(() => {
          socket.emit('signal', { type: 'SPD', message: JSON.stringify({ sdp: pc[data.id].localDescription }), id: data.id });
        })
        .catch(logError);
    } else if (desc.type == 'answer') {
      console.log('recieved answer');
      pc[data.id].setRemoteDescription(desc).catch(logError);
    } else {
      console.error('Unsupported SDP type.' + JSON.stringify(desc));
    }
  } else {
    console.log('add remote ice candidate');
    pc[data.id].addIceCandidate(message.candidate).catch(logError);
  }
});

// Initiates signaling process
function startSignaling(isInitiator, id) {
  console.log('staring signaling...');

  pc[id] = new RTCPeerConnection(configuration);

  // send any ice candidates to the other peer
  pc[id].onicecandidate = function(event) {
    if (event.candidate) {
      socket.emit('signal', { type: 'ice candidate', message: JSON.stringify({ candidate: event.candidate }), id: id });      
    } 
    console.log('completed that ice candidate');
  };

  // only initiator generates an offer
  if (isInitiator) {
    let isNegotiating = false;
    
    // triggered when need SDP offer, trigger offer generation
    pc[id].onnegotiationneeded = function() {
      if (isNegotiating) {
        console.log('Skip nested negotiations');
        return;
      }
      isNegotiating = true;

      console.log('on negotiation called');

      pc[id].createOffer().then(offer => { console.log('setting localdescription after creating offer'); return pc[id].setLocalDescription(offer); })
        .then(() =>  {
          // send offer to other peer
          socket.emit('signal', { type: 'SDP', message: JSON.stringify({ sdp: pc[id].localDescription }), id: id });
        })
        .catch(logError);
    };
  }

  // once remote track arrives, show it in the remote video element
  pc[id].ontrack = function(event) {
    console.log("Peer Connection Object: " + JSON.stringify(pc));

    if (remoteVideo[id] && !remoteVideo[id].srcObject) {
      // Create new remote video
      remoteVideo[id].srcObject = event.streams[0];    
      document.querySelector('.videochat').append(remoteVideo[id]);
    }
    

    // don't set srcObject again if it is already set
    // if (!remoteVideo.srcObject)
    //   remoteVideo.srcObject = event.streams[0];
  };

  console.count("Add local stream");
  pc[id].addTrack(localStream.getAudioTracks()[0], localStream)
  pc[id].addTrack(localStream.getVideoTracks()[0], localStream)

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
  pc.close();
  pc = null;
}

function logError(err) {
  console.error(err.name + ': ' + err.message);
}