'use strict';

// ----------USERLIST------------
let userlist = document.querySelector('.userlist ul');

socket.on('get room userlist', function(room) {
  userlist.innerHTML = '';

  for (let user of room.users) {
    let item = document.createElement('li');
    item.textContent = user; 
    item.className = user;
    userlist.append(item);
  }
});

socket.on('update room userlist', function(name) {
  let item = document.createElement('li');
  item.textContent = name;
  item.className = name; 
  userlist.append(item);

  updateMessage(name, 'joined');
});

socket.on('delete room user', function(name) {
  let userItem = userlist.querySelector(`li[class=${name}]`);
  if (userItem) {
    userItem.remove();    
  }

  updateMessage(name, 'left');
});

// ---------Message Form--------------
let messageForm = document.querySelector('.form--message');
let chat = document.querySelector('.chat');
let messagebox = document.querySelector('#messagebox');

messageForm.onsubmit = function(event) {
  event.preventDefault();
  
  socket.emit('message', messagebox.value);
  messagebox.value = '';
}

socket.on('message', function(user, message, messageType) {
  // Your message: blue, Other messages: default(grey)
  let color = messageType ? 'blue' : 'grey';

  chat.insertAdjacentHTML('beforeend', `<li style='color:${color};'>${user} ${message}</li>`);  
});

// New user joined message
function updateMessage(name, message) {
  chat.insertAdjacentHTML('beforeend', `<li style='color:green;'>${name} has ${message} the room</li>`);    
}

// User typing message
let debounceType = debounce(() => socket.emit('typing'), 1000); 
messagebox.oninput = function() {
  debounceType();
};

let start, typingMessage, removeMessage;

socket.on('currently typing', function(name) {
  console.log("Currently Typing");
  if (!start) {
    start = Date.now();
  }

  // TODO place the message elsewhere and fade in animation

  if (!typingMessage) {
    typingMessage = document.createElement('li');
    typingMessage.style.color = 'green';
    typingMessage.textContent = `${name} is typing ...`;

    removeMessage = setTimeout(() => {
      typingMessage.remove();
      start = null;
      typingMessage = null; 
      removeMessage = null;
    }, 2000);
  }
  
  // If 2 seconds pass without new type event, remove typing message
  if (Date.now() - start < 2000) {
    clearTimeout(removeMessage);

    // Reset timer
    removeMessage = setTimeout(() => {
      typingMessage.remove();
      start = null;
      typingMessage = null; 
      removeMessage = null;      
    }, 2000);
  } 

  chat.append(typingMessage);
});

// Debounce decorator
function debounce(f, ms) {

  let isCooldown = false;

  return function() {
    if (isCooldown) return;

    f.apply(this, arguments);

    isCooldown = true;

    setTimeout(() => isCooldown = false, ms);
  };

}