const express = require('express');
const router = express.Router();
const Room = require('../models/Room');

// POST /api/rooms/join
router.post('/join', async (req, res) => {
  const { roomId } = req.body;
  if (!roomId) return res.status(400).json({ error: 'roomId required' });
  try {
    let room = await Room.findOne({ roomId });
    if (!room) {
      room = await Room.create({ roomId });
    }
    room.lastActivity = new Date();
    await room.save();
    res.json({ roomId: room.roomId, drawingData: room.drawingData });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/rooms/:roomId
router.get('/:roomId', async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json({ roomId: room.roomId, drawingData: room.drawingData });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 