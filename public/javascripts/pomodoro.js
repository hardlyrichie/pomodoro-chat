'use strict';

let pomodoro = document.querySelector('.pomodoro');
let timer = document.querySelector('.pomodoro__timer');
let ring = document.querySelector('.ring');

// class Pomodoro {
//   constructor(pomo) {
//     this._pomo = pomo;
//     pomo.onclick = this.onClick.bind(this);
//   }

//   start() {
//     socket.emit('pomodoro', 'start');
//   }

//   stop() {
//     socket.emit('pomodoro', 'stop'); 
//   }

//   reset() {
//     socket.emit('pomodoro', 'reset'); 
//   }

//   short() {
//     socket.emit('pomodoro', 'short');
//   }

//   long() {
//     socket.emit('pomodoro', 'long');
//   }

//   skip() {
//     socket.emit('pomodoro', 'skip');
//   }

//   onClick(event) {
//     let action = event.target.dataset.action;
//     if (!action) return;
    
//     this[action]();
//   }
// }

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