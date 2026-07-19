import { Server } from "socket.io";
import { Meeting } from "./models/meetings.model.js";
import { User } from "./models/user.model.js";

const connections = {};
const messages = {};
const timeOnline = {};
const pendingJoinRequests = {}; // new: to track requests when host isn't there

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
    socket.on("check-role", async (roomId, token) => {
      try {
        const meetingCode = roomId.replace(/^\/room\//, '').replace(/^\/meet\//, '').replace(/^\/join\//, '').replace(/^\/meeting\//, '');
        const meeting = await Meeting.findOne({ meetingCode });
        
        if (!meeting) {
            socket.emit("you-are-participant");
            return;
        }

        if (token) {
            const user = await User.findOne({ token });
            if (user && meeting.user_id && meeting.user_id.toString() === user._id.toString()) {
                socket.emit("you-are-host");
                return;
            }
        }
        
        socket.emit("you-are-participant");
      } catch (err) {
        console.error("Error in check-role:", err);
        socket.emit("you-are-participant");
      }
    });

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

      // If this is the host joining, send them all pending requests for this room
      if (isHost && pendingJoinRequests[roomKey]) {
        pendingJoinRequests[roomKey].forEach(req => {
            io.to(socket.id).emit("join-request", req);
        });
      }
    });

    socket.on("request-join", (path, username) => {
      const roomKey = path.replace(/^\/join\//, '/meeting/').replace(/^\/room\//, '/meeting/');
      const hostPeer = connections[roomKey]?.find(p => p.isHost);
      if (hostPeer) {
        io.to(hostPeer.socketId).emit("join-request", { socketId: socket.id, username, path: roomKey });
      } else {
        if (!pendingJoinRequests[roomKey]) {
            pendingJoinRequests[roomKey] = [];
        }
        // Remove duplicate requests from the same socket
        pendingJoinRequests[roomKey] = pendingJoinRequests[roomKey].filter(req => req.socketId !== socket.id);
        pendingJoinRequests[roomKey].push({ socketId: socket.id, username, path: roomKey });
        
        socket.emit("join-pending", "Waiting for host to start the meeting...");
      }
    });

    socket.on("admit-user", (targetSocketId, path, username) => {
      const roomKey = path.replace(/^\/join\//, '/meeting/').replace(/^\/room\//, '/meeting/');
      const hostPeer = connections[roomKey]?.find(p => p.socketId === socket.id && p.isHost);
      if (hostPeer) {
        io.to(targetSocketId).emit("join-approved");
        if (pendingJoinRequests[roomKey]) {
          pendingJoinRequests[roomKey] = pendingJoinRequests[roomKey].filter(req => req.socketId !== targetSocketId);
        }
      }
    });

    socket.on("reject-user", (targetSocketId, path) => {
      const roomKey = path.replace(/^\/join\//, '/meeting/').replace(/^\/room\//, '/meeting/');
      const hostPeer = connections[roomKey]?.find(p => p.socketId === socket.id && p.isHost);
      if (hostPeer) {
        io.to(targetSocketId).emit("join-rejected");
        if (pendingJoinRequests[roomKey]) {
          pendingJoinRequests[roomKey] = pendingJoinRequests[roomKey].filter(req => req.socketId !== targetSocketId);
        }
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
      // Clear pending requests for this socket across all rooms
      Object.keys(pendingJoinRequests).forEach(roomKey => {
        pendingJoinRequests[roomKey] = pendingJoinRequests[roomKey].filter(req => req.socketId !== socket.id);
        if (pendingJoinRequests[roomKey].length === 0) {
            delete pendingJoinRequests[roomKey];
        }
      });

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
