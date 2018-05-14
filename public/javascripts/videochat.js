'use strict';

let pcs = {}, remoteVideo = {};
let localStream;
let SIGNAL_ROOM = `${roomId}_signal`;
let startCall = true;

let constraints = {
  audio: true,
  video: true
};
let configuration = {
  iceServers: [{
    urls: 'stun:stun.l.google.com:19302'
  }]
};

showChat.onclick = function() {
  showChat.classList.remove('notification');
  videoChat.classList.toggle('shrinkVideo');
  messageArea.classList.toggle('showMessage');
};

callButton.onclick = function() { 
  changeDisplay();

  // wait for displayVideo before call
  displayVideo()
  .then(() => {
    if (startCall) {
      console.log('Starting call');
      socket.emit('start call', SIGNAL_ROOM);
    } else {
      console.log('Signaling Join Call');
      socket.emit('join call', SIGNAL_ROOM); 
    }
  });
};

hangupButton.onclick = function() {
  changeDisplay();
  endCall();

  socket.emit('end stream');
};

// Join video call
socket.on('call started', function() {
  console.log('call started');
  callButton.innerText = 'Join Call';
  startCall = false;
});

// Everyone left call, can initiate call
socket.on('can start call', function() {
  console.log('Can start call');
  callButton.innerHTML = '<i class=ion-ios-telephone></i>';
  startCall = true;
});

function changeDisplay() {
  // Change display
  messageArea.classList.toggle('hiddenMessage');
  textChat.classList.toggle('visibility-hidden'); 
  videoChat.classList.toggle('display-none');  
}

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
      videoArea.append(remoteVideo[id]);
    }
  };

  console.count("Add local stream");
  pcs[id].addTrack(localStream.getAudioTracks()[0], localStream)
  pcs[id].addTrack(localStream.getVideoTracks()[0], localStream)

  remoteVideo[id] = document.createElement('video');
  remoteVideo[id].className = 'videoArea__remoteVideo';
  remoteVideo[id].autoplay = true;

  // remoteVideo[id].muted = true;
}

function displayVideo() {
  if (hasGetUserMedia()) {
    // get local stream, show it in localVideo element and add it to peerconnection object to be sent to peer
    return navigator.mediaDevices.getUserMedia(constraints)
      .then(onSuccess).catch(handleGetUserMediaErrors);
  } else {
    console.error('getUserMedia() is not supported by your browser');
    window.location = '/room/error?reason=not_supported'
  }
}

function hasGetUserMedia() {
  // Feature detection and convert to boolean
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
}

function onSuccess(stream) {
  localVideo = document.createElement('video');
  localVideo.classList.add('videoArea__localVideo', 'center');
  localVideo.autoplay = true;
  localVideo.muted = true;
  localVideo.srcObject = stream;
  videoArea.append(localVideo);
  
  localStream = stream;
}

function handleGetUserMediaErrors(err) {
  /* handle the error */
  if (err.name=="NotFoundError" || err.name == "DevicesNotFoundError" ){
    //required track is missing
    window.location = '/room/error?reason=track_missing';
  } else if (err.name=="NotReadableError" || err.name == "TrackStartError" ){
    //webcam or mic are already in use
    window.location = '/room/error?reason=in_use';
  } else if (err.name=="OverconstrainedError" || err.name == "ConstraintNotSatisfiedError" ){
    //constraints can not be satisfied by avb. devices
    window.location = '/room/error?reason=fail_constrains';
  } else if (err.name=="NotAllowedError" || err.name == "PermissionDeniedError" ){
    //permission denied in browser
    // TODO DISPLAY Permisson denied message
  } else if (err.name=="TypeError" || err.name == "TypeError" ){
    //empty constraints object
    window.location = '/room/error?reason=empty_constraints';       
  } else {
     //other errors
    window.location = '/room/error';       
  }
}

function endCall() {
  console.log('Ending call');
  for (let pc of Object.values(pcs)) {
    pc.close();
  }
  pcs = {};
  remoteVideo = {};

  videoArea.innerHTML = '';
  muteButton.innerHTML = '<i class=ion-android-microphone></i>';
  hideVideoButton.innerHTML = '<i class=ion-eye></i>';

}

function endStream(id) {
  console.log('Ending stream: ' + id);
  pcs[id].close();
  delete pcs[id];
  remoteVideo[id].remove();
  delete remoteVideo[id];
}

function logError(err) {
  console.error(err.name + ': ' + err.message);
}

// ------------Buttons and other stuff--------------
// TODO refactor with browserify

hideVideoButton.onclick = function() {
  console.log('Pausing/Unpausing');
  // Loop through all peer connections and enable/disable the first videotrack of the first stream
  for (let pc of Object.values(pcs)) {
    let streams = pc.getLocalStreams();
    getStream:
    for (let stream of streams) {
      for (let videoTrack of stream.getVideoTracks()) {
        hideVideoButton.innerHTML = videoTrack.enabled ? '<i class=ion-eye-disabled></i>' : '<i class=ion-eye></i>';
        videoTrack.enabled = !videoTrack.enabled;
        break getStream;
      }
    }
  }
};

muteButton.onclick = function() {
  console.log('Muting/Unmuting');
  for (let pc of Object.values(pcs)) {
    let streams = pc.getLocalStreams();
    getStream:

    //something wrong here
    for (let stream of streams) {
      for (let audioTrack of stream.getAudioTracks()) {
        muteButton.innerHTML = audioTrack.enabled ? '<i class=ion-android-microphone-off></i>' : '<i class=ion-android-microphone></i>';
        audioTrack.enabled = !audioTrack.enabled;
        break getStream;        
      }
    }
  }
};

// socket.on('update inCall count', function(count) {
//   // Limit video call to 5 clients
//   if (count > 5) {
//     console.log('disabling button');
//     callButton.disabled = true;
//   } else {
//     console.log('not disabling button');    
//     callButton.disabled = false;
//   }

//   let countDisplay = document.querySelector('.inCall');
//   countDisplay.innerHTML = `<strong>${count}</strong>`; 
// });