import { Socket } from "socket.io-client";

const socket: typeof Socket = io({

  path: "/socket-client/",
  autoConnect: false,
});

export default socket;

// import { io } from "socket.io-client";

// const socket = io("/socket-client/", {
//   autoConnect: false,
// });

// export default socket;