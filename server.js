const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

let onlineUsers = [];

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('setup', (userId) => {
    socket.join(userId);
    if (!onlineUsers.some(u => u.userId === userId)) {
      onlineUsers.push({ userId, socketId: socket.id });
    }
    io.emit('get online users', onlineUsers);
  });

  socket.on('join chat', (roomId) => socket.join(roomId));

  socket.on('new message', (msg) => {
    socket.to(msg.chat._id).emit('message received', msg);
  });

  socket.on('typing', (room) => socket.to(room).emit('typing', room));
  socket.on('stop typing', (room) => socket.to(room).emit('stop typing', room));

  // Admin: Block/Unblock User
  socket.on('block user', ({ userId, blockedUserId }) => {
    socket.to(blockedUserId).emit('user blocked', { by: userId });
  });
  socket.on('unblock user', ({ userId, blockedUserId }) => {
    socket.to(blockedUserId).emit('user unblocked', { by: userId });
  });

  socket.on('disconnect', () => {
    onlineUsers = onlineUsers.filter(u => u.socketId !== socket.id);
    io.emit('get online users', onlineUsers);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
