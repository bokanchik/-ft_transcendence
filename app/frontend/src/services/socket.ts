import { io, Socket } from "socket.io-client"
// import { Socket } from "socket.io-client";

// const socket: typeof Socket = io({
const socket: Socket = io({
  path: "/socket-client/",
  autoConnect: false,
});

export default socket;
