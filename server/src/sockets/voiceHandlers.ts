import type { VoiceSignalPayload } from "@wolf/shared";
import { currentRoomAndPlayer } from "./socketContext.js";
import type { IOServer, IOSocket } from "./types.js";

export function registerVoiceHandlers(io: IOServer, socket: IOSocket): void {
  socket.on("voice_signal", (payload: VoiceSignalPayload) => {
    const { room, player } = currentRoomAndPlayer(socket);
    if (!room || !player) return;

    const target = room.players.get(payload.toPlayerId);
    if (!target || target.isBot) return;

    io.to(target.socketId).emit("voice_signal", { fromPlayerId: player.id, signal: payload.signal });
  });
}
