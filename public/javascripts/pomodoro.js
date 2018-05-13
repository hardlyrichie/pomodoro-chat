'use strict';

let pomodoro = document.querySelector('.pomodoro');
let timer = document.querySelector('.pomodoro__timer');
let ring = document.querySelector('.ring');

class Pomodoro {
  constructor(pomo) {
    this._pomo = pomo;
    pomo.onclick = this.onClick.bind(this);
  }

  start() {
    socket.emit('pomodoro', 'start');
  }

  stop() {
    socket.emit('pomodoro', 'stop'); 
  }

  reset() {
    socket.emit('pomodoro', 'reset'); 
  }

  onClick(event) {
    let action = event.target.dataset.action;
    if (!action) return;
      
    if (action == 'short' || action == 'long' || action == 'skip') {
      let interval = action == 'short' ? 5 : (action == 'long' ? 15 : 25);

      socket.emit('pomodoro', 'break', interval)
    } else {
      this[action]();
    }
  }
}

new Pomodoro(pomodoro);

socket.on('setTime', function(time) {
  timer.textContent = time;

  if (time == '00:00') {
    ring.currentTime = 0;
    ring.play();
  }
});