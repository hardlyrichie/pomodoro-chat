'use strict';

let loading = document.querySelector('.loading');

// Wait to check if refreshed
setTimeout(checkRoom, 1500);

socket.on('room status', function(status) {
  if (status) {
    // Display room
    loading.remove();
    textChat.classList.remove('display-none');
  } else {
    // Display message and redirect back to lobby
    window.location = '/room/error?reason=room_deleted';
  }
});

// Checks if room has already been deleted
function checkRoom() {
  socket.emit('check room');
}