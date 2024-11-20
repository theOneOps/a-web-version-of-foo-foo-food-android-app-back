const io = require('socket.io-client');

// Remplace par l'adresse IP de ton serveur Socket.IO
const socket = io("http://192.168.1.10:3000");

socket.on('connect', () => {
  console.log('Connected to server');
  
  // Joindre le "room" avec l'email du livreur
  socket.emit('join', 'livreur@example.com');
});

socket.on('orderAssigned', (data) => {
  console.log('Nouvelle commande assignée reçue:', data);
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});
