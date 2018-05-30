'use strict';

let pomodoro = document.querySelector('.pomodoro');
let start = document.querySelector('[data-action=start]');
let stop = document.querySelector('[data-action=stop]');
let reset = document.querySelector('[data-action=reset]');
let breakButtons = document.querySelector('.pomodoro__break-buttons');
let label = document.querySelector('.pomodoro__label');
let timer = document.querySelector('.pomodoro__timer');
let alarm = document.querySelector('.alarm');

pomodoro.onclick = function(event) {
  let action = event.target.dataset.action;

  if (!action) return;

  if (action === 'start' && start.textContent === 'New Session?') {
    socket.emit('pomodoro', action, 'new');
  }

  socket.emit('pomodoro', action);
};


socket.on('setTime', function(time) {
  timer.textContent = time;

  if (time == '00:00') {
    alarm.currentTime = 0;
    alarm.play();

    // Disable start and reset button when break buttons are visible
    if (!breakButtons.classList.contains('visibility-hidden')) {
      start.disabled = true;
      stop.disabled = true;
    }
    // Disable reset when options are visible
    reset.disabled = true;
  }

  // Show 5 seconds countdown animation
});

socket.on('toggle break', function() {
  toggleBreakButtons();
});

socket.on('display label', function(type) {
  label.textContent = type.toUpperCase();
});

socket.on('change start text', function(text) {
  start.textContent = text;
});

socket.on('renable buttons', function() {
  start.disabled = false;
  stop.disabled = false;
  reset.disabled = false;
});

function toggleBreakButtons() {
  breakButtons.classList.toggle('visibility-hidden');
}