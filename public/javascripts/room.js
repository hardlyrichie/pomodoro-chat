'use strict';

// ----------USERLIST------------
let userlist = document.querySelector('.userlist ul');

socket.on('get room userlist', function(room) {
  userlist.innerHTML = '';

  for (let user of room.users) {
    let item = document.createElement('li');
    item.textContent = user; 
    userlist.append(item);
  }
});

socket.on('update room userlist', function(name) {
  let item = document.createElement('li');
  item.textContent = name; 
  userlist.append(item);
});
