import { Socket } from "socket.io-client"

const socket: typeof Socket = io('http://localhost:3001', {
    transports: ['websocket'],
    autoConnect: false,
});

export default socket;