import { Server } from "socket.io";
import { Meeting } from "./models/meetings.model.js";

const connections = {};
const messages = {};
const timeOnline = {};

const findRoomBySocketId = (socketId) => {
  return Object.keys(connections).find((roomKey) => 
    connections[roomKey].some(peer => peer.socketId === socketId)
  );
};

export const connectToSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      allowedHeaders: ["*"],
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    socket.on("join-call", async (path, username) => {
      if (!path) {
        return;
      }

      try {
        const meetingCode = path.replace(/^\/room\//, '').replace(/^\/meet\//, '');
        const meeting = await Meeting.findOne({ meetingCode });
        
        if (!meeting || !meeting.isActive) {
            socket.emit("join-error", "Invalid or expired meeting link.");
            return;
        }
      } catch (err) {
        console.error("Socket meeting validation error:", err);
      }

      if (!connections[path]) {
        connections[path] = [];
      }

      // Add socket if not exists
      const existing = connections[path].find(c => c.socketId === socket.id);
      const finalUsername = username || "Participant";
      if (!existing) {
        connections[path].push({ socketId: socket.id, username: finalUsername });
      }

      timeOnline[socket.id] = new Date();

      connections[path].forEach((peer) => {
        io.to(peer.socketId).emit("user-joined", socket.id, connections[path], finalUsername);
      });
    });

    socket.on("signal", (toId, payload) => {
      io.to(toId).emit("signal", socket.id, payload);
    });

    socket.on("chat-message", (data, sender) => {
      const matchingRoom = findRoomBySocketId(socket.id);
      if (!matchingRoom) {
        return;
      }

      if (!messages[matchingRoom]) {
        messages[matchingRoom] = [];
      }

      messages[matchingRoom].push({
        sender,
        data,
        "socket-id-sender": socket.id
      });

      connections[matchingRoom].forEach((peer) => {
        io.to(peer.socketId).emit("chat-message", data, sender, socket.id);
      });
    });

    socket.on("toggle-raise-hand", (isRaised) => {
      const roomKey = findRoomBySocketId(socket.id);
      if (roomKey) {
        connections[roomKey].forEach((peer) => {
          io.to(peer.socketId).emit("user-raised-hand", socket.id, isRaised);
        });
      }
    });

    socket.on("send-reaction", (emoji) => {
      const roomKey = findRoomBySocketId(socket.id);
      if (roomKey) {
        connections[roomKey].forEach((peer) => {
          io.to(peer.socketId).emit("user-reaction", socket.id, emoji);
        });
      }
    });

    socket.on("audio-status-change", (isAudioEnabled) => {
      const roomKey = findRoomBySocketId(socket.id);
      if (roomKey) {
        connections[roomKey].forEach((peer) => {
          io.to(peer.socketId).emit("user-audio-status", socket.id, isAudioEnabled);
        });
      }
    });

    socket.on("mute-participant", (targetSocketId) => {
      const roomKey = findRoomBySocketId(socket.id);
      if (roomKey) {
        // Send a message to the target to mute themselves
        io.to(targetSocketId).emit("force-mute");
      }
    });

    socket.on("remove-participant", (targetSocketId) => {
      const roomKey = findRoomBySocketId(socket.id);
      if (roomKey) {
        // Notify the target that they were removed
        io.to(targetSocketId).emit("force-remove");
        
        // Let others know the target was kicked
        connections[roomKey].forEach((peer) => {
          if (peer.socketId !== targetSocketId) {
            io.to(peer.socketId).emit("participant-kicked", targetSocketId);
          }
        });
      }
    });

    socket.on("disconnect", () => {
      const roomKey = findRoomBySocketId(socket.id);
      if (!roomKey) {
        delete timeOnline[socket.id];
        return;
      }

      const connectedAt = timeOnline[socket.id];
      const onlineDurationMs = connectedAt ? Math.abs(new Date() - connectedAt) : 0;

      connections[roomKey] = connections[roomKey].filter((peer) => peer.socketId !== socket.id);
      delete timeOnline[socket.id];

      connections[roomKey].forEach((peer) => {
        io.to(peer.socketId).emit("user-left", socket.id, onlineDurationMs);
      });

      if (connections[roomKey].length === 0) {
        delete connections[roomKey];
        delete messages[roomKey];
      }
    });
  });

  return io;
};

export default connectToSocket;
