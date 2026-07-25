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

const getCanonicalRoomKey = (path) => {
  if (!path) return '';
  const cleanPath = path.split('?')[0].replace(/\/$/, '');
  return cleanPath.replace(/^\/join\//, '/meeting/').replace(/^\/room\//, '/meeting/');
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

    socket.on("join-call", async (path, username, token, isHostLocally, picture) => {
        if (!path) {
          return;
        }
  
        let isHost = !!isHostLocally;
  
        try {
          const meetingCode = path.replace(/^\/room\//, '').replace(/^\/meet\//, '').replace(/^\/join\//, '').replace(/^\/meeting\//, '');
          const meeting = await Meeting.findOne({ meetingCode });
          
          if (!meeting || !meeting.isActive) {
              if (!isHost) {
                  socket.emit("join-error", "Invalid or expired meeting link.");
                  return;
              }
          }
  
          if (token) {
              const user = await User.findOne({ token });
              if (user && meeting && meeting.user_id && meeting.user_id.toString() === user._id.toString()) {
                  isHost = true;
              }
          }
        } catch (err) {
          console.error("Socket meeting validation error:", err);
        }

      // Convert paths to a canonical room path for sockets to group properly regardless of URL route
      const roomKey = getCanonicalRoomKey(path);

      if (!connections[roomKey]) {
        connections[roomKey] = [];
      }

      // Add socket if not exists
      const existing = connections[roomKey].find(c => c.socketId === socket.id);
      const finalUsername = username || "Participant";
      if (!existing) {
        connections[roomKey].push({ socketId: socket.id, username: finalUsername, isHost, picture });
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

    const handleRequestJoin = (pathArg, usernameArg) => {
      let path = pathArg;
      let username = usernameArg;
      if (typeof pathArg === 'object' && pathArg !== null) {
        path = pathArg.path || pathArg.roomId || pathArg.url || "";
        username = pathArg.userName || pathArg.username || pathArg.name || "Participant";
      }
      const roomKey = getCanonicalRoomKey(path);
      const hostPeer = connections[roomKey]?.find(p => p.isHost);
      const reqObj = { socketId: socket.id, userId: socket.id, username, userName: username, path: roomKey };

      if (hostPeer) {
        io.to(hostPeer.socketId).emit("join-request", reqObj);
      } else {
        if (!pendingJoinRequests[roomKey]) {
            pendingJoinRequests[roomKey] = [];
        }
        pendingJoinRequests[roomKey] = pendingJoinRequests[roomKey].filter(req => req.socketId !== socket.id && req.userId !== socket.id);
        pendingJoinRequests[roomKey].push(reqObj);
        
        socket.emit("join-pending", "Waiting for host to start the meeting...");
      }
    };

    socket.on("request-join", handleRequestJoin);
    socket.on("join-request", handleRequestJoin);

    const handleAdmit = (targetSocketIdOrObj, pathArg) => {
      let targetSocketId = targetSocketIdOrObj;
      let path = pathArg;
      if (typeof targetSocketIdOrObj === 'object' && targetSocketIdOrObj !== null) {
        targetSocketId = targetSocketIdOrObj.targetSocketId || targetSocketIdOrObj.userId || targetSocketIdOrObj.socketId;
        path = targetSocketIdOrObj.path;
      }
      
      io.to(targetSocketId).emit("join-approved");
      io.to(targetSocketId).emit("admitted");

      if (path) {
        const roomKey = getCanonicalRoomKey(path);
        if (pendingJoinRequests[roomKey]) {
          pendingJoinRequests[roomKey] = pendingJoinRequests[roomKey].filter(req => req.socketId !== targetSocketId && req.userId !== targetSocketId);
        }
      } else {
        Object.keys(pendingJoinRequests).forEach(rk => {
          pendingJoinRequests[rk] = pendingJoinRequests[rk].filter(req => req.socketId !== targetSocketId && req.userId !== targetSocketId);
        });
      }
    };

    socket.on("admit-user", handleAdmit);

    const handleDeny = (targetSocketIdOrObj, pathArg) => {
      let targetSocketId = targetSocketIdOrObj;
      let path = pathArg;
      if (typeof targetSocketIdOrObj === 'object' && targetSocketIdOrObj !== null) {
        targetSocketId = targetSocketIdOrObj.targetSocketId || targetSocketIdOrObj.userId || targetSocketIdOrObj.socketId;
        path = targetSocketIdOrObj.path;
      }

      io.to(targetSocketId).emit("join-rejected");
      io.to(targetSocketId).emit("denied");

      if (path) {
        const roomKey = getCanonicalRoomKey(path);
        if (pendingJoinRequests[roomKey]) {
          pendingJoinRequests[roomKey] = pendingJoinRequests[roomKey].filter(req => req.socketId !== targetSocketId && req.userId !== targetSocketId);
        }
      } else {
        Object.keys(pendingJoinRequests).forEach(rk => {
          pendingJoinRequests[rk] = pendingJoinRequests[rk].filter(req => req.socketId !== targetSocketId && req.userId !== targetSocketId);
        });
      }
    };

    socket.on("reject-user", handleDeny);
    socket.on("deny-user", handleDeny);

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
