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

messageForm.onsubmit = function(event) {
  event.preventDefault();
  
  let messagebox = document.querySelector('#messagebox');
  socket.emit('message', messagebox.value);
  messagebox.value = '';
}

socket.on('message', function(user, message, messageType) {
  // Your message: blue, Other messages: default(grey)
  let color = messageType ? 'blue' : 'grey';

  chat.insertAdjacentHTML('beforeend', `<li style='color:${color};'>${user} ${message}</li>`);  
});

function joinMessage(name) {
  chat.insertAdjacentHTML('beforeend', `<li style='color:green;'>${name} has joined the room</li>`);    
}
