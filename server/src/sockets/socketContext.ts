import { roomStore } from "../rooms/RoomStore.js";
import type { Room } from "../rooms/Room.js";
import type { Player } from "../rooms/Player.js";
import type { IOSocket } from "./types.js";

export function currentRoomAndPlayer(socket: IOSocket): { room?: Room; player?: Player } {
  const { roomCode, playerId } = socket.data;
  if (!roomCode || !playerId) return {};
  const room = roomStore.get(roomCode);
  const player = room?.players.get(playerId);
  return { room, player };
}
