import type { IOServer } from "./types.js";
import type { Room } from "../rooms/Room.js";

export function broadcastRoomUpdate(io: IOServer, room: Room): void {
  io.to(room.code).emit("room_update", {
    players: room.getPublicPlayers(),
    settings: room.settings,
    hostPlayerId: room.hostPlayerId,
  });
}
