'use strict';

let nicknameForm = document.querySelector('.form--nickname');

nicknameForm.onsubmit = function(event) {
  event.preventDefault();
  socket.emit('join', document.querySelector('#nickname').value);
  this.remove();
};

let createRoom = document.querySelector('.button--create-room');

createRoom.onclick = function(event) {
  // Display form when create room button clicked
  let createRoomForm = document.querySelector('.form--create-room');
  createRoomForm.style.display = 'block';

  // Create room
  createRoomForm.onsubmit = function(event) {
    socket.emit('create room', createRoomForm.querySelector('#room_name').value);
  };

  // Hide form when cancel
  let cancelFormButton = createRoomForm.querySelector('input[type="button"]');
  cancelFormButton.onclick = function(event) {
    createRoomForm.style.display = 'none';
  }
};

// ----------USERLIST------------
let userlist = document.querySelector('.userlist ul');

socket.on('get userlist', function(users) {
  userlist.innerHTML = '';

  for (let user in users) {
    let item = document.createElement('li');
    item.textContent = users[user].name; 
    userlist.append(item);
  }
});

socket.on('update userlist', function(name) {
  let item = document.createElement('li');
  item.textContent = name; 
  userlist.append(item);
});

// ----------ROOMLIST-------------
let roomlist = document.querySelector('.rooms ul');

socket.on('get roomlist', function(rooms) {
  roomlist.innerHTML = '';

  for (let room of rooms) {
    roomlist.insertAdjacentHTML('beforeend', `<li><a href='/room/${room}'>${room}</a></li>`);
  }
});

socket.on('update roomlist', function(name) {
  roomlist.insertAdjacentHTML('beforeend', `<li><a href='/room/${name}'>${name}</a></li>`);
});