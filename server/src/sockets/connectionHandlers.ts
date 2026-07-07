import { roomStore } from "../rooms/RoomStore.js";
import { broadcastRoomUpdate } from "./roomBroadcast.js";
import type { IOServer, IOSocket } from "./types.js";
import { logger } from "../util/logger.js";

const DISCONNECT_GRACE_MS = 90_000;

export function registerConnectionHandlers(io: IOServer, socket: IOSocket): void {
  socket.on("disconnect", () => {
    const { roomCode, playerId } = socket.data;
    if (!roomCode || !playerId) return;

    const room = roomStore.get(roomCode);
    if (!room) return;
    const player = room.players.get(playerId);
    if (!player || player.socketId !== socket.id) return;

    player.isConnected = false;
    io.to(room.code).emit("player_disconnected", { playerId: player.id });
    broadcastRoomUpdate(io, room);

    player.disconnectGraceTimer = setTimeout(() => {
      const stillThere = room.players.get(playerId);
      if (!stillThere || stillThere.isConnected) return;

      if (room.isInLobby()) {
        room.removePlayer(playerId);
        broadcastRoomUpdate(io, room);
      }
      // Mid-game: leave the player as a disconnected "ghost" — their pending
      // night action / vote simply times out with the rest of the phase.
    }, DISCONNECT_GRACE_MS);

    logger.info(`player ${player.nickname} disconnected from room ${room.code}`);
  });
}
