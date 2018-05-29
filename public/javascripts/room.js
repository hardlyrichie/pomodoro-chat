'use strict';

socket.emit('join room', roomId);

// ----------USERLIST------------
let userlist = document.querySelector('.userlist > ul');

socket.on('get room userlist', function(room) {
  console.log('displaying room userlist');

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
let chatBox = document.querySelector('.chatBox');
let chat = document.querySelector('.chat');
let chatInput = document.querySelector('.chatBox__input');

chatBox.onsubmit = function(event) {
  event.preventDefault();
  
  socket.emit('message', chatInput.value);
  // End is typing message
  socket.emit('typing', true);  
  chatInput.value = '';
}

socket.on('message', function(user, message, id) {
  let date = moment().calendar();  

  let atBottom = (chat.scrollTop + chat.clientHeight) >= chat.scrollHeight;

  if (chat.lastElementChild && chat.lastElementChild.className == id) {
    chat.lastElementChild.innerHTML = `${chat.lastElementChild.innerHTML}<br><span style='padding: 1rem; display: inline-block;'>${message}</span>`;    
  } else {
    chat.insertAdjacentHTML('beforeend', `<li class=${id}><h4>${user}&emsp;</h4>${date}<br><span style='padding: 1rem; display: inline-block;'>${message}</span></li>`);    
  }

  // Message Flash Icon in video call state
  if (messageArea.classList.contains('hiddenMessage') && !messageArea.classList.contains('showMessage')) {
    showChat.classList.add('notification');
  } else {
    // TODO Alert Sound
  }

  // Check overflow
  if (chat.scrollHeight > chat.clientHeight && atBottom) {
    console.log('OVERFLOW!');
    scrollDown();    
  }
});

// New user joined message
function updateMessage(name, message) {
  chat.insertAdjacentHTML('beforeend', `<li style='color:green;'>${name} has ${message} the room</li>`);    
}

// User typing message
let debounceType = debounce(() => socket.emit('typing'), 1000); 
chatInput.oninput = function() {
  debounceType();
};

let startTyping, typingMessage, removeMessage;

socket.on('currently typing', function(name, end) {
  console.log("Currently Typing");
  if (!startTyping) {
    startTyping = window.performance.now();
  }

  if (end) {
    clearTimeout(removeMessage);
    remove();
    return;
  }

  if (!typingMessage) {
    typingMessage = document.createElement('p');
    typingMessage.className = 'typing';
    typingMessage.textContent = `${name} is typing ...`;
    chatBox.append(typingMessage);  

    removeMessage = setTimeout(remove, 2000);
  }
  
  // If 2 seconds pass without new type event, remove typing message
  if (window.performance.now() - startTyping < 2000) {
    clearTimeout(removeMessage);

    // Reset timer
    removeMessage = setTimeout(remove, 2000);
  }
  
  function remove() {
    if (typingMessage)
      typingMessage.remove();
    startTyping = null;
    typingMessage = null; 
    removeMessage = null;
  }
});

function scrollDown() {
  if (chat.scrollTop + chat.clientHeight >= chat.scrollHeight) return;

  console.log('Current Scroll: ' + chat.scrollTop + ' client height: ' + chat.clientHeight + ' scroll Height' + chat.scrollHeight);
  chat.scrollBy(0, 5);
  setTimeout(scrollDown, 10);
}

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

socket.on('missing room', function() {
  window.location = '/room/error?reason=room_deleted';
});