'use strict';

let nicknameForm = document.querySelector('form');

nicknameForm.onsubmit = function(event) {
  event.preventDefault();
  socket.emit('join', document.querySelector('#nickname').value);
  this.remove();
};

socket.on('update-userlist', function(users) {
  let list = document.querySelector('.userlist ul');
  list.innerHTML = '';
  
  for (let user in users) {
    let item = document.createElement('li');
    item.textContent = users[user]; 
    list.append(item);
  }
});