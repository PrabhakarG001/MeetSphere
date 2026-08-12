# 🌐 MeetSphere — Real-Time Video Conferencing & Collaboration Platform

![MeetSphere Banner](https://img.shields.io/badge/MeetSphere-Video%20Conferencing-6366f1?style=for-the-badge&logo=react)
![License](https://img.shields.io/badge/License-ISC-blue?style=for-the-badge)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![NodeJS](https://img.shields.io/badge/Node.js-v18+-339933?style=for-the-badge&logo=nodedotjs)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20%2F%20Local-47A248?style=for-the-badge&logo=mongodb)
![Socket.io](https://img.shields.io/badge/Socket.IO-v4-010101?style=for-the-badge&logo=socketdotio)

**MeetSphere** is a feature-packed, high-performance real-time video conferencing application designed to provide seamless peer-to-peer video calls, instant messaging, screen sharing, and meeting management. Built with modern WebRTC, Socket.IO, React 19, Vite, Express 5, and MongoDB, MeetSphere enables users to host and join meetings with ease.

---

## 🚀 Key Features

- 📹 **Peer-to-Peer Video & Audio Calls**: Low-latency HD video and audio communication powered by WebRTC signaling.
- 💬 **In-Meeting Live Chat**: Instant messaging within meeting rooms using Socket.IO channels.
- 🖥️ **Screen Sharing**: Easily broadcast presentation slides or window capture to all participants.
- ⚙️ **Pre-Join Media Check**: Preview your camera feed, test microphone levels, and configure devices before jumping into a meeting.
- 🔑 **Flexible Authentication**:
  - Traditional username & password signup/login (with bcrypt password encryption).
  - 1-Click Google Authentication via Firebase Auth.
  - Quick **Guest Access** mode for joining calls without account registration.
- 📜 **Meeting History & Activity Logs**: Track previous meeting join records with timestamps and manage your call history.
- 🛡️ **Resilient Backend Infrastructure**: Automatic database connection retry logic, stateful connection monitoring, and automated server health endpoints (`/health`).

---

## 🛠️ Tech Stack

### Frontend
- **Framework & Tooling**: [React 19](https://react.dev/), [Vite](https://vitejs.dev/)
- **Routing**: [React Router v7](https://reactrouter.com/)
- **Styling & UI**: [Tailwind CSS v4](https://tailwindcss.com/), [Material-UI (MUI)](https://mui.com/), [Emotion](https://emotion.sh/), [Lucide Icons](https://lucide.dev/)
- **Real-Time Client**: [Socket.io-client](https://socket.io/), WebRTC API
- **Auth Integration**: Firebase Auth (Google Sign-In)
- **HTTP Client**: [Axios](https://axios-http.com/)

### Backend
- **Runtime Environment**: [Node.js](https://nodejs.org/) (ES Modules)
- **Web Server Framework**: [Express.js v5](https://expressjs.com/)
- **Real-Time Signaling Server**: [Socket.IO](https://socket.io/)
- **Database & ODM**: [MongoDB](https://www.mongodb.com/) & [Mongoose](https://mongoosejs.com/)
- **Security**: `bcrypt` (password hashing), Node `crypto` module (token generation), `cors` middleware

---

## 📁 Project Structure

```
MeetSphere/
├── backend/
│   ├── src/
│   │   ├── app.js                   # Express server entry point & DB connection logic
│   │   └── controllers/
│   │       ├── socketManager.js     # Socket.IO handlers & WebRTC signaling room logic
│   │       ├── user.controller.js   # User auth, registration & history handlers
│   │       ├── models/
│   │       │   ├── user.model.js    # User database schema
│   │       │   └── meetings.model.js# Meeting activity logs database schema
│   │       └── routes/
│   │           ├── users.routes.js  # User auth API routes
│   │           └── meeting.routes.js# Meeting history API routes
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── assets/                  # App images & icons
│   │   ├── components/              # Reusable UI components & Video Call logic
│   │   │   └── Video/               # VideoMeet & PreJoin components
│   │   ├── contexts/                # AuthContext for session management
│   │   ├── pages/                   # Landing, Auth, Signup, Home, History, AccountSelection
│   │   ├── firebase.js              # Firebase authentication config
│   │   ├── App.jsx                  # Application Routing setup
│   │   └── main.jsx                 # React root component initialization
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
└── README.md                        # Project documentation
```

---

## ⚙️ How It Works

1. **Signaling & WebSockets**: When a user creates or joins a meeting room, a Socket.IO connection is established with the backend `socketManager`. The server maps participants to a unique meeting room code.
2. **WebRTC P2P Connection**: Participants exchange SDP offers, answers, and ICE candidates via Socket.IO signals to establish direct Peer-to-Peer media streams.
3. **Authentication Flow**:
   - **Local Auth**: User registration hashes passwords using `bcrypt`. Successful login generates a session token.
   - **Google Auth**: Handled through Firebase SDK on the client; user credentials sync with MongoDB via the `/google_login` endpoint.
4. **Meeting History**: When authenticated users enter a meeting, their token and meeting code are recorded in MongoDB to populate their personal history page.

---

## 📥 Installation & Setup Guide

### Prerequisites
Make sure you have installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/) running locally or a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) connection URI.

---

### 1. Clone the Repository
```bash
git clone https://github.com/PrabhakarG001/MeetSphere.git
cd MeetSphere
```

---

### 2. Configure Backend

Navigate to the `backend/` directory:
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory (optional defaults are provided in code):
```env
PORT=8000
MONGODB_URI=mongodb://127.0.0.1:27017/meetsphere
```

Start the backend development server:
```bash
npm run dev
```
*(The backend server will run on `http://localhost:8000`)*

---

### 3. Configure Frontend

Open a new terminal window and navigate to the `frontend/` directory:
```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` directory:
```env
VITE_BACKEND_URL=http://localhost:8000
```

Start the frontend development server:
```bash
npm run dev
```
*(The frontend application will run on `http://localhost:5173`)*

---

## 🔌 API Endpoints Summary

### User Routes (`/api/v1/users` or `/users`)
- `POST /register` — Register a new account.
- `POST /login` — Authenticate and receive a session token.
- `POST /google_login` — Authenticate via Google OAuth / Firebase.

### Meeting Routes (`/api/v1/meetings`)
- `POST /add_to_activity` — Save meeting entry to user history.
- `GET /get_all_activity` — Retrieve past meeting history for the user.
- `POST /delete_activity` — Remove a meeting log entry from history.

### System Routes
- `GET /health` — Health check endpoint returning backend & database connection status.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!  
Feel free to check the repository issues or submit a pull request.

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).
