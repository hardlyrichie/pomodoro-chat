'use strict';

// ------------Nickname Form---------------
let nicknameForm = document.querySelector('#nickname-form');
let nickname;

if (nicknameForm) {
  // Hide lobby and create room form before entering nickname
  let lobby = document.querySelector('.lobby');
  let createRoomForm = document.querySelector('.form--create-room');
  lobby.style.display = 'none';

  nicknameForm.onsubmit = function(event) {
    event.preventDefault();
    nickname = document.querySelector('#nickname').value;
    socket.emit('join', nickname);
    this.remove();

    // Show lobby upon entering nickname
    lobby.style.display = 'block';  
  };
}

// ------------Create Room Form--------------
let createRoom = document.querySelector('.btn-lobby--create-room');

createRoom.onclick = function(event) {
  // Display form when create room button clicked
  let popup = document.querySelector('.popup');
  popup.style.opacity = 1;
  popup.style.visibility = 'visible'; 

  let popupContent = popup.querySelector('.popup__content');
  popupContent.style.transform = 'translate(-50%, -50%) scale(1)';

  // Default room name
  let roomName = document.querySelector('#room_name');
  if (nickname) {
    roomName.value = `${nickname}'s room`;
  } else {
    socket.emit('get nickname', function(nickname) {
      roomName.value = `${nickname}'s room`;
    });
  }
  

  // Hide form when cancel
  let cancelFormButton = document.querySelector('.btn--neg');
  cancelFormButton.onclick = function(event) {
    popup.style.opacity = 0;
    popup.style.visibility = 'hidden';
    popupContent.style.transform = '';
  }
};

// ------------Refresh--------------
let refreshButton = document.querySelector('.btn-lobby--refresh');

refreshButton.onclick = function(event) {
  socket.emit('refresh');
}

// ----------USERLIST------------
let userlist = document.querySelector('.lobby__userlist ul');

socket.on('get userlist', function(users) {
  userlist.innerHTML = '';

  for (let user in users) {
    let item = document.createElement('li');
    item.textContent = users[user];
    item.className = users[user];  
    userlist.append(item);
  }
});

socket.on('update userlist', function(name) {
  let item = document.createElement('li');
  item.textContent = name;
  item.className = name; 
  userlist.append(item);
});

socket.on('delete user', function(name) {
  let userItem = userlist.querySelector(`li.${name}`);
  if (userItem) {
    userItem.remove();    
  }
});

// ----------ROOMLIST-------------
let roomlist = document.querySelector('.lobby__roomlist ul');

socket.on('get roomlist', function(rooms) {
  roomlist.innerHTML = '';

  for (let room in rooms) {
    roomlist.insertAdjacentHTML('beforeend', `<li id=${room}><a href='/room/${room}'>${rooms[room].name}</a></li>`);
  }
});

socket.on('update roomlist', function(id, name) {
  roomlist.insertAdjacentHTML('beforeend', `<li id=${id}><a href='/room/${id}'>${name}</a></li>`);
});

socket.on('delete room', function(id) {
  let roomItem = document.getElementById(id);
  if (roomItem) {
    roomItem.remove();
  }
});

socket.on('update room userlist', function(roomId, count) {
  let roomItem = document.getElementById(id);
  if (!roomItem) return;

  // TODO finish implementaion

});