# Collaborative Whiteboard

A real-time collaborative whiteboard application built with the MERN stack (MongoDB, Express.js, React.js, Node.js) and Socket.io.

---

## Setup Instructions

### Prerequisites
- Node.js (v16+ recommended)
- npm
- MongoDB (local or cloud instance)

### 1. Clone the repository
```bash
# Clone the repo and enter the directory
$ git clone <your-repo-url>
$ cd whiteboard
```

### 2. Start MongoDB
- Make sure MongoDB is running locally (`mongodb://localhost:27017/whiteboard`)
- On Windows: `net start MongoDB` or run `mongod`

### 3. Install backend dependencies
```bash
$ cd server
$ npm install
```

### 4. Install frontend dependencies
```bash
$ cd ../client
$ npm install
```

### 5. (Optional) Set up proxy for development
Add to `client/package.json`:
```json
"proxy": "http://localhost:5000"
```

### 6. Start the backend server
```bash
$ cd ../server
$ node server.js
```

### 7. Start the frontend React app
```bash
$ cd ../client
$ npm start
```

- Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## API Documentation

### REST Endpoints

#### `POST /api/rooms/join`
- **Body:** `{ roomId: string }`
- **Response:** `{ roomId, drawingData }`
- **Description:** Join or create a room. Returns current drawing data.

#### `GET /api/rooms/:roomId`
- **Response:** `{ roomId, drawingData }`
- **Description:** Get room info and all drawing data.

### Socket.io Events

#### Client → Server
- `join-room` `{ roomId }` — Join a room
- `leave-room` `{ roomId }` — Leave a room
- `draw-start` `{ roomId, point, color, width }` — Start a stroke
- `draw-move` `{ roomId, point }` — Continue stroke
- `draw-end` `{ roomId }` — End stroke
- `clear-canvas` `{ roomId }` — Clear the canvas
- `cursor-move` `{ roomId, x, y, color }` — Update cursor position

#### Server → Client
- `draw-start` `{ socketId, point, color, width }` — Another user started a stroke
- `draw-move` `{ socketId, point }` — Another user is drawing
- `draw-end` `{ socketId }` — Another user ended a stroke
- `clear-canvas` — Canvas was cleared
- `cursor-move` `{ socketId, x, y, color }` — Another user's cursor position
- `user-count` `{ roomId, count }` — Number of active users in the room

---

## Architecture Overview

### High-Level Design

```
[ React Frontend ] ←→ [ Express + Socket.io Backend ] ←→ [ MongoDB ]
```

- **Frontend:** React.js app with HTML5 Canvas for drawing, Socket.io-client for real-time sync, REST for room join/load.
- **Backend:** Node.js/Express REST API, Socket.io for real-time events, Mongoose for MongoDB persistence.
- **Database:** MongoDB stores rooms and drawing commands for persistence.

### Data Flow
- User joins/creates a room (REST API)
- Drawing/cursor actions are sent via Socket.io and broadcast to all users in the room
- Drawing actions are persisted in MongoDB for room history
- New users replay drawing history on join

---

## Deployment Guide

### 1. Environment Variables
- Set `MONGODB_URI` in `server/server.js` for production (e.g., MongoDB Atlas)
- Optionally set `PORT` for backend

### 2. Build the frontend
```bash
$ cd client
$ npm run build
```
- This creates a `client/build` folder with static files.

### 3. Serve frontend from backend (optional)
- Copy or move the `build` folder to the backend and serve with Express:
```js
const path = require('path');
app.use(express.static(path.join(__dirname, '../client/build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});
```

### 4. Start the backend server
```bash
$ cd server
$ NODE_ENV=production node server.js
```

### 5. Deploy to your preferred platform
- **VPS/VM:** Use PM2 or systemd to keep the server running
- **Cloud:** Deploy to Heroku, Render, Railway, or similar (set up environment variables)
- **MongoDB Atlas:** Use a cloud MongoDB URI

---

## License
MIT 