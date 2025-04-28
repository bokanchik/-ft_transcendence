import fastify from "./server.js";
import db from "./database/connectDB.js";

let waitingList = [];

export async function waitingRoom(playerId) {
    // add player to waiting list
    waitingList.push(playerId);

    
    // web socket events 
   
  
}