import { Server } from "socket.io";
import { Meeting } from "./models/meetings.model.js";
import { User } from "./models/user.model.js";

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
    socket.on("join-call", async (path, username, token) => {
      if (!path) {
        return;
      }

      let isHost = false;

      try {
        const meetingCode = path.replace(/^\/room\//, '').replace(/^\/meet\//, '').replace(/^\/join\//, '').replace(/^\/meeting\//, '');
        const meeting = await Meeting.findOne({ meetingCode });
        
        if (!meeting || !meeting.isActive) {
            socket.emit("join-error", "Invalid or expired meeting link.");
            return;
        }

        if (token) {
            const user = await User.findOne({ token });
            if (user && meeting.user_id && meeting.user_id.toString() === user._id.toString()) {
                isHost = true;
            }
        }
      } catch (err) {
        console.error("Socket meeting validation error:", err);
      }

      // Convert paths to a canonical room path for sockets to group properly regardless of URL route
      const roomKey = path.replace(/^\/join\//, '/meeting/').replace(/^\/room\//, '/meeting/');

      if (!connections[roomKey]) {
        connections[roomKey] = [];
      }

      // Add socket if not exists
      const existing = connections[roomKey].find(c => c.socketId === socket.id);
      const finalUsername = username || "Participant";
      if (!existing) {
        connections[roomKey].push({ socketId: socket.id, username: finalUsername, isHost });
      }

      timeOnline[socket.id] = new Date();

      connections[roomKey].forEach((peer) => {
        io.to(peer.socketId).emit("user-joined", socket.id, connections[roomKey], finalUsername);
      });
    });

    socket.on("request-join", (path, username) => {
      const roomKey = path.replace(/^\/join\//, '/meeting/').replace(/^\/room\//, '/meeting/');
      const hostPeer = connections[roomKey]?.find(p => p.isHost);
      if (hostPeer) {
        io.to(hostPeer.socketId).emit("join-request", { socketId: socket.id, username, path: roomKey });
      } else {
        socket.emit("join-error", "Host is not in the meeting yet. Please wait.");
      }
    });

    socket.on("admit-user", (targetSocketId, path, username) => {
      const roomKey = path.replace(/^\/join\//, '/meeting/').replace(/^\/room\//, '/meeting/');
      const hostPeer = connections[roomKey]?.find(p => p.socketId === socket.id && p.isHost);
      if (hostPeer) {
        io.to(targetSocketId).emit("join-approved");
      }
    });

    socket.on("reject-user", (targetSocketId, path) => {
      const roomKey = path.replace(/^\/join\//, '/meeting/').replace(/^\/room\//, '/meeting/');
      const hostPeer = connections[roomKey]?.find(p => p.socketId === socket.id && p.isHost);
      if (hostPeer) {
        io.to(targetSocketId).emit("join-rejected");
      }
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
        io.to(targetSocketId).emit("force-mute");
      }
    });

    socket.on("remove-participant", (targetSocketId) => {
      const roomKey = findRoomBySocketId(socket.id);
      if (roomKey) {
        io.to(targetSocketId).emit("force-remove");
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
