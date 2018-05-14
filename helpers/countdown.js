'use strict';

module.exports = function(io, signal_room, settings) {
  // closure stores reference to setInterval (so not to have circular references and prevent memory leaks)
  let interval;

  class Countdown {
    constructor() {
      this._timeLeft; // in seconds
      this._length = settings.session; // length of session or break in minutes
      this._showBreak = false;

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
      return this.buildTime(this.formatTime(this._timeLeft));
    }

    get isCounting() {
      return interval ? true : false;
    }

    get showBreak() {
      return this._showBreak;
    }
  
    set showBreak(showBreak) {
      this._showBreak = showBreak;
    }

    get type() {
      return this._length === settings.session ? 'session' : 'break';
    }
  
    start() {
      // Start new session after break
      if (arguments[0] === 'new') {
        this.length = settings.session;
        io.in(signal_room).emit('change start text', 'Start');
      }

      this._timeLeft ? this.countdown(this._timeLeft) : this.countdown(this._length * 60); // converts length from minutes to seconds  
    }
  
    stop() {
      clearInterval(interval);
      interval = null;    
    }
  
    reset() {
      this.clearTimer();
      
      // Resets timer in clients
      let time = this.buildTime(this.formatTime(this._length * 60));
      io.in(signal_room).emit('setTime', time);
    }

    short() {
      this._length = settings.short;
      this.break();
    }

    long() {
      this._length = settings.long;
      this.break();      
    }

    skip() {
      this._length = settings.session;
      this.break();
    }

    // Start or skip break
    break() {
      this.clearTimer();
      this.start();
      
      // Tell clients to hide break buttons
      io.in(signal_room).emit('toggle break');
      this._showBreak = false;
    }
  
    clearTimer() {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }

      this._timeLeft = null;
    }
  
    // time in seconds
    countdown(length) {
      // Don't start if already counting down
      if (interval) return;

      // Find the endTime from current time and this._length(converted to milliseconds from seconds)
      let endTime = Date.now() + length * 1000;
      this.displayTime(endTime);

      // store countdown timer in intervals
      interval = setInterval(() => {  
        this.displayTime(endTime);
      }, 1000);

      // Display pomodoro label (type of countdown next to timer: session or break)
      io.in(signal_room).emit('display label', this.type);   

      // Counting down means buttons should be clickable, Re-enable buttons
      io.in(signal_room).emit('renable buttons');
    }
  
    // endTime in milliseconds
    displayTime(endTime) {
      // convert to seconds and floors to int
      this._timeLeft = ((endTime - Date.now() + 100) / 1000) | 0;

      let time = this.buildTime(this.formatTime(this._timeLeft));

      if (this._timeLeft <= 0 && interval) {
        clearInterval(interval);
        interval = null;
        this._timeLeft = null;

        // Display break options if pomo session just ended
        if (this._length === settings.session) {
          io.in(signal_room).emit('toggle break');
          this._showBreak = true;        
        } else {
          // New pomo session
          io.in(signal_room).emit('change start text', 'New Session?');
        }
      }
      
      io.in(signal_room).emit('setTime', time);
    }

    // time in seconds
    formatTime(time) {
      let minutes =  time / 60 | 0;
      let seconds =  time % 60 | 0;
      
      minutes = minutes < 10 ? "0" + minutes : minutes;
      seconds = seconds < 10 ? "0" + seconds : seconds;

      return [minutes, seconds];
    }

    buildTime([minutes, seconds]) {
      return `${minutes}:${seconds}`;
    }
  }

  return new Countdown();
}
