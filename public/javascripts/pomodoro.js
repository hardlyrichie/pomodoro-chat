'use strict';

let pomodoro = document.querySelector('.pomodoro');
let timer = document.querySelector('.pomodoro__timer');
let ring = document.querySelector('.ring');

pomodoro.onclick = function(event) {
  let action = event.target.dataset.action;

  if (!action) return;

  socket.emit('pomodoro', action);
};


socket.on('setTime', function(time) {
  timer.textContent = time;

  if (time == '00:00') {
    ring.currentTime = 0;
    ring.play();
  }
});