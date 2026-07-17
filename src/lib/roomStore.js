// -----------------------------------------------------------------------
// Shared persistence layer using Socket.IO for real-time multiplayer.
//
// This implementation uses Socket.IO to communicate with a Node.js server
// that stores room data in memory and broadcasts updates to all connected
// clients in real-time.
// -----------------------------------------------------------------------

import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.PROD ? window.location.origin : 'http://localhost:3150';
let socket = null;
let roomUpdateCallback = null;

// Initialize socket connection
export function initSocket() {
  if (socket) return socket;
  
  socket = io(SOCKET_URL, {
    transports: ['polling', 'websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity,
  });

  socket.on('connect', () => {
    console.log('Connected to server');
  });

  socket.on('connect_error', (error) => {
    console.error('Socket.IO connection error:', error);
  });

  socket.on('disconnect', (reason) => {
    console.log('Disconnected from server:', reason);
  });

  socket.on('roomUpdated', (data) => {
    if (roomUpdateCallback) {
      roomUpdateCallback(data);
    }
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from server');
  });

  return socket;
}

// Set callback for room updates from other clients
export function onRoomUpdate(callback) {
  roomUpdateCallback = callback;
}

// Join a room to receive updates
export function joinRoom(code) {
  if (!socket) initSocket();
  socket.emit('joinRoom', code);
}

// Leave a room
export function leaveRoom(code) {
  if (!socket) return;
  socket.emit('leaveRoom', code);
}

export function emptyRoom() {
  return { revealed: false, createdAt: Date.now(), players: {}, sharedUrl: "" };
}

export async function loadRoom(code) {
  return new Promise((resolve) => {
    if (!socket) initSocket();
    socket.emit('getRoom', code, (data) => {
      resolve(data);
    });
  });
}

export async function saveRoom(code, data) {
  return new Promise((resolve) => {
    if (!socket) initSocket();
    socket.emit('updateRoom', { roomCode: code, data }, (updatedData) => {
      resolve(updatedData);
    });
  });
}

// Reads the latest state, applies a pure transformation, saves.
// All actions (vote, reveal, rename...) go through this
// single function to maintain a consistent write path.
export async function updateRoom(code, mutate) {
  const current = (await loadRoom(code)) || emptyRoom();
  const next = mutate(current);
  await saveRoom(code, next);
  return next;
}
