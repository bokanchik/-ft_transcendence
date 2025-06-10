import { io, Socket } from "socket.io-client";

const URL = 'http://localhost:3001';

const socket: Socket = io(URL, {
    transports: ['websocket'],
    autoConnect: false,
});

export default socket;