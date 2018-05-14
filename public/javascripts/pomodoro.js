'use strict';

let pomodoro = document.querySelector('.pomodoro');
let breakButtons = document.querySelector('.pomodoro__break-buttons');
let label = document.querySelector('.pomodoro__label');
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

socket.on('toggle break', function() {
  toggleBreakButtons();
});

socket.on('display label', function(type) {
  label.textContent = type.toUpperCase();
});

function toggleBreakButtons() {
  breakButtons.classList.toggle('visibility-hidden');
}