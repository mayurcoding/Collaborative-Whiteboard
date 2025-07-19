const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const Room = require('./models/Room');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/whiteboard', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const io = new Server(server, {
  cors: {
    origin: '*', // For development, allow all origins
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/rooms', require('./routes/rooms'));

// Track users in rooms
const roomUserCounts = {};

// Socket.io events
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    roomUserCounts[roomId] = (roomUserCounts[roomId] || 0) + 1;
    io.to(roomId).emit('user-count', { roomId, count: roomUserCounts[roomId] });
    console.log(`Socket ${socket.id} joined room ${roomId}`);
    // Optionally emit user count or presence here
  });

  socket.on('leave-room', (roomId) => {
    socket.leave(roomId);
    if (roomUserCounts[roomId]) {
      roomUserCounts[roomId]--;
      if (roomUserCounts[roomId] < 0) roomUserCounts[roomId] = 0;
      io.to(roomId).emit('user-count', { roomId, count: roomUserCounts[roomId] });
    }
    console.log(`Socket ${socket.id} left room ${roomId}`);
  });

  // Drawing events
  socket.on('draw-start', async ({ roomId, point, color, width }) => {
    socket.to(roomId).emit('draw-start', { socketId: socket.id, point, color, width });
    // Save to DB
    try {
      await Room.findOneAndUpdate(
        { roomId },
        {
          $push: {
            drawingData: {
              type: 'stroke',
              data: { points: [point], color, width },
              timestamp: new Date(),
            },
          },
          $set: { lastActivity: new Date() },
        }
      );
    } catch {}
  });

  socket.on('draw-move', async ({ roomId, point }) => {
    socket.to(roomId).emit('draw-move', { socketId: socket.id, point });
    // Append point to last stroke
    try {
      const room = await Room.findOne({ roomId });
      if (room && room.drawingData.length > 0) {
        const last = room.drawingData[room.drawingData.length - 1];
        if (last.type === 'stroke') {
          last.data.points.push(point);
          room.lastActivity = new Date();
          await room.save();
        }
      }
    } catch {}
  });

  socket.on('draw-end', ({ roomId }) => {
    socket.to(roomId).emit('draw-end', { socketId: socket.id });
  });

  // Cursor tracking
  socket.on('cursor-move', ({ roomId, x, y, color }) => {
    socket.to(roomId).emit('cursor-move', { socketId: socket.id, x, y, color });
  });

  // Clear canvas event
  socket.on('clear-canvas', async ({ roomId }) => {
    socket.to(roomId).emit('clear-canvas');
    // Save clear command
    try {
      await Room.findOneAndUpdate(
        { roomId },
        {
          $push: {
            drawingData: {
              type: 'clear',
              data: {},
              timestamp: new Date(),
            },
          },
          $set: { lastActivity: new Date() },
        }
      );
    } catch {}
  });

  // Drawing events will be handled here

  socket.on('disconnecting', () => {
    for (const roomId of socket.rooms) {
      if (roomId !== socket.id && roomUserCounts[roomId]) {
        roomUserCounts[roomId]--;
        if (roomUserCounts[roomId] < 0) roomUserCounts[roomId] = 0;
        io.to(roomId).emit('user-count', { roomId, count: roomUserCounts[roomId] });
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});

// API routes will be added here

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 