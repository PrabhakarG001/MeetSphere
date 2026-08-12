# ⚙️ MeetSphere — Backend Service

This folder contains the Node.js / Express.js backend server and WebRTC / Socket.IO signaling service for **MeetSphere**.

For complete project documentation, tech stack details, architecture, and setup guide, please refer to the [Root README.md](../README.md).

## 🚀 Quick Start (Backend)

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Configuration**:
   Create a `.env` file in this directory (optional):
   ```env
   PORT=8000
   MONGODB_URI=mongodb://127.0.0.1:27017/meetsphere
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```
   The backend server will start on `http://localhost:8000`.

4. **Health Check**:
   Test server and database status at `http://localhost:8000/health`.
