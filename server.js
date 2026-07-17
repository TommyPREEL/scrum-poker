import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: true,
    credentials: true
  },
  transports: ['polling', 'websocket'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000
});

// In-memory storage for rooms
const rooms = new Map();

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'dist', 'index.html'));
  });
}

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Get room data
  socket.on('getRoom', (roomCode, callback) => {
    const room = rooms.get(roomCode);
    callback(room || null);
  });

  // Update room data
  socket.on('updateRoom', ({ roomCode, data }, callback) => {
    rooms.set(roomCode, data);
    // Broadcast to all clients in this room except sender
    socket.to(roomCode).emit('roomUpdated', data);
    callback(data);
  });

  // Join a room
  socket.on('joinRoom', (roomCode) => {
    socket.join(roomCode);
    console.log(`Socket ${socket.id} joined room ${roomCode}`);
  });

  // Leave a room
  socket.on('leaveRoom', (roomCode) => {
    socket.leave(roomCode);
    console.log(`Socket ${socket.id} left room ${roomCode}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3150;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
