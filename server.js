const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

let onlineUsers = [];

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('setup', (userId) => {
    socket.join(userId);
    if (!onlineUsers.some(user => user.userId === userId)) {
      onlineUsers.push({ userId, socketId: socket.id });
    }
    io.emit('get online users', onlineUsers);
  });

  socket.on('join chat', (roomId) => {
    socket.join(roomId);
  });

  socket.on('new message', (newMessage) => {
    const chat = newMessage.chat;
    if (!chat.users) return;
    chat.users.forEach(user => {
      if (user._id === newMessage.sender._id) return;
      socket.to(user._id).emit('message received', newMessage);
    });
  });

  // Typing Indicator
  socket.on('typing', (room) => socket.to(room).emit('typing', room));
  socket.on('stop typing', (room) => socket.to(room).emit('stop typing', room));

  socket.on('disconnect', () => {
    onlineUsers = onlineUsers.filter(user => user.socketId !== socket.id);
    io.emit('get online users', onlineUsers);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
