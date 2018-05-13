'use strict';

module.exports = function(io, signal_room, interval) {
  class Countdown {
    constructor(interval) {
      this._tick;
      this._timeLeft;
      this._interval = interval;
    }
  
    get interval() {
      return this._interval;
    }
  
    set interval(interval) {
      this._interval = interval;
    }
  
    start() {
      this._timeleft ? this.countdown(this._timeleft) : this.countdown(this._interval * 60);
    }
  
    stop() {
      clearInterval(this._tick);    
    }
  
    reset() {
      this.clearTimer();
      
      io.in(signal_room).emit('time', `${this._interval < 10 ? "0" + this._interval : this._interval}:00`);
    }
  
    clearTimer() {
      if (this._tick) {
        clearInterval(this._tick);
        this._tick = null;
        this._timeleft = null;
      }
    }
  
    // time in seconds
    countdown(time) {
      let endTime = Date.now() + time * 1000;
      this.displayTime(endTime);
      this._tick = setInterval(() => {  
        this.displayTime(endTime);
      }, 1000);
    }
  
    displayTime(endTime) {
      // convert to seconds and floors to int
      this._timeleft = ((endTime - Date.now() + 100) / 1000) | 0;
     
      let minutes =  this._timeleft / 60 | 0;
      let seconds =  this._timeleft % 60 | 0;
      
      minutes = minutes < 10 ? "0" + minutes : minutes;
      seconds = seconds < 10 ? "0" + seconds : seconds;
      
      io.in(signal_room).emit('time', `${minutes}:${seconds}`)
      
      if (this._timeleft <= 0 && this._tick) {
        clearInterval(this._tick);
        this._tick = null;
        this._timeleft = null;
      }
    }
  }

  return new Countdown(interval);
}
