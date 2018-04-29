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

  joinMessage(name);
});

socket.on('delete room user', function(name) {
  let userItem = userlist.querySelector(`li[class=${name}]`);
  if (userItem) {
    userItem.remove();    
  }
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
function joinMessage(name) {
  chat.insertAdjacentHTML('beforeend', `<li style='color:green;'>${name} has joined the room</li>`);    
}

// User typing message
messagebox.oninput = function() {
  socket.emit('typing');
};

let start, typingMessage;

socket.on('currently typing', function(name) {
  if (!start) {
    start = Date.now();
  }

  // TODO place the message elsewhere and fade in animation

  if (!typingMessage) {
    typingMessage = document.createElement('li');
    typingMessage.style.color = 'green';
    typingMessage.textContent = `${name} is typing ...`;
  }
  
  // If 3 seconds pass without new type event, remove typing message
  let removeMessage = setTimeout(() => typingMessage.remove(), 3000);

  if (Date.now() - start < 3000) {
    clearTimeout(removeMessage);

    // Reset timer
    removeMessage = setTimeout(() => typingMessage.remove(), 3000);
  } else {
    start = null;
    typingMessage = null;
    return;
  }

  chat.append(typingMessage);  
});
