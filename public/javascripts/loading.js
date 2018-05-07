'use strict';

setTimeout(checkRoom, 1500);

socket.on('room status', function(status) {
  if (status) {
    // Display room
  } else {
    // Display message and redirect back to lobby
    window.location = '/room/error';
  }
});

// Checks if room has already been deleted
function checkRoom() {
  socket.emit('check room');
}