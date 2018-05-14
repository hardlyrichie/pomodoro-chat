'use strict';

module.exports = function(io, signal_room, breakLength, length) {
  // closure stores reference to setInterval (so not to have circular references and prevent memory leaks)
  let interval;

  class Countdown {
    constructor(length) {
      this._timeLeft; // in seconds
      this._length = length;   

      console.log('Initialize ' + signal_room + ' countdown');
    }
  
    get length() {
      return this._length;
    }
  
    set length(length) {
      this._length = length;
    }

    // return timeLeft formatted
    get timeLeft() {
      let [minutes, seconds] = this.formatTime(this._timeLeft);
      
      return `${minutes}:${seconds}`;
    }

    get isCounting() {
      return interval ? true : false;
    }
  
    start() {
      this._timeLeft ? this.countdown(this._timeLeft) : this.countdown(this._length * 60); // converts length from minutes to seconds
    }
  
    stop() {
      clearInterval(interval);    
    }
  
    reset() {
      this.clearTimer();
      
      io.in(signal_room).emit('setTime', `${this._length < 10 ? "0" + this._length : this._length}:00`);
    }

    short() {
      this._length = breakLength.short;
      this.break();
    }

    long() {
      this._length = breakLength.long;
      this.break();      
    }

    skip() {
      this._length = length;
      this.break();
    }

    // Start or skip break
    break() {
      this.clearTimer();
      this.start();
    }
  
    clearTimer() {
      if (interval) {
        clearInterval(interval);
        interval = null;
        this._timeLeft = null;
      }
    }
  
    // time in seconds
    countdown(time) {
      let endTime = Date.now() + time * 1000;
      this.displayTime(endTime);

      // store countdown timer in intervals
      interval = setInterval(() => {  
        this.displayTime(endTime);
      }, 1000);
    }
  
    displayTime(endTime) {
      // convert to seconds and floors to int
      this._timeLeft = ((endTime - Date.now() + 100) / 1000) | 0;

      let [minutes, seconds] = this.formatTime(this._timeLeft);
      
      io.in(signal_room).emit('setTime', `${minutes}:${seconds}`)
      
      if (this._timeLeft <= 0 && interval) {
        clearInterval(interval);
        interval = null;
        this._timeLeft = null;
      }
    }

    formatTime(time) {
      let minutes =  time / 60 | 0;
      let seconds =  time % 60 | 0;
      
      minutes = minutes < 10 ? "0" + minutes : minutes;
      seconds = seconds < 10 ? "0" + seconds : seconds;

      return [minutes, seconds];
    }
  }

  return new Countdown(length);
}
