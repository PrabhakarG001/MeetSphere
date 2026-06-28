import { Server } from "socket.io";

const connections = {};
const messages = {};
const timeOnline = {};

const findRoomBySocketId = (socketId) => {
  return Object.keys(connections).find((roomKey) => connections[roomKey].includes(socketId));
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
    socket.on("join-call", (path) => {
      if (!path) {
        return;
      }

      if (!connections[path]) {
        connections[path] = [];
      }

      if (!connections[path].includes(socket.id)) {
        connections[path].push(socket.id);
      }

      timeOnline[socket.id] = new Date();

      connections[path].forEach((peerSocketId) => {
        io.to(peerSocketId).emit("user-joined", socket.id, connections[path]);
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

      connections[matchingRoom].forEach((peerSocketId) => {
        io.to(peerSocketId).emit("chat-message", data, sender, socket.id);
      });
    });

    socket.on("disconnect", () => {
      const roomKey = findRoomBySocketId(socket.id);
      if (!roomKey) {
        delete timeOnline[socket.id];
        return;
      }

      const connectedAt = timeOnline[socket.id];
      const onlineDurationMs = connectedAt ? Math.abs(new Date() - connectedAt) : 0;

      connections[roomKey] = connections[roomKey].filter((peerSocketId) => peerSocketId !== socket.id);
      delete timeOnline[socket.id];

      connections[roomKey].forEach((peerSocketId) => {
        io.to(peerSocketId).emit("user-left", socket.id, onlineDurationMs);
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
