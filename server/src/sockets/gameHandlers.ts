import { MIN_PLAYERS, GamePhase } from "@wolf/shared";
import type { SubmitNightActionPayload, CastVotePayload, SendChatMessagePayload } from "@wolf/shared";
import { GameEngine, type GameEvents } from "../game/GameEngine.js";
import { sanitizeChatText } from "../util/sanitize.js";
import { broadcastRoomUpdate } from "./roomBroadcast.js";
import { currentRoomAndPlayer } from "./socketContext.js";
import type { IOServer, IOSocket } from "./types.js";
import type { Room } from "../rooms/Room.js";

function makeGameEvents(io: IOServer, room: Room): GameEvents {
  return {
    onRoleAssigned(playerId, payload) {
      const player = room.players.get(playerId);
      if (player) io.to(player.socketId).emit("role_assigned", payload);
    },
    onPhaseChanged(payload) {
      io.to(room.code).emit("phase_changed", payload);
    },
    onNightResult(payload) {
      io.to(room.code).emit("night_result", payload);
    },
    onInvestigationResult(playerId, payload) {
      const player = room.players.get(playerId);
      if (player) io.to(player.socketId).emit("investigation_result", payload);
    },
    onChatMessage(message) {
      io.to(room.code).emit("chat_message", message);
    },
    onVoteUpdate(payload) {
      io.to(room.code).emit("vote_update", payload);
    },
    onVoteResult(payload) {
      io.to(room.code).emit("vote_result", payload);
    },
    onGameOver(payload) {
      io.to(room.code).emit("game_over", payload);
    },
    onRoomUpdate() {
      broadcastRoomUpdate(io, room);
    },
  };
}

function startNewGame(io: IOServer, room: Room): void {
  room.gameEngine = new GameEngine(room, makeGameEvents(io, room));
  io.to(room.code).emit("game_started");
  room.gameEngine.start();
}

export function registerGameHandlers(io: IOServer, socket: IOSocket): void {
  socket.on("start_game", () => {
    const { room, player } = currentRoomAndPlayer(socket);
    if (!room || !player || player.id !== room.hostPlayerId) return;
    if (!room.isInLobby()) return;
    if (room.players.size < MIN_PLAYERS) {
      socket.emit("error", { code: "NOT_ENOUGH_PLAYERS", message: `Need at least ${MIN_PLAYERS} players.` });
      return;
    }
    startNewGame(io, room);
  });

  socket.on("play_again", () => {
    const { room, player } = currentRoomAndPlayer(socket);
    if (!room || !player || player.id !== room.hostPlayerId) return;
    if (room.gameEngine?.phase !== GamePhase.GAME_OVER) return;
    if (room.players.size < MIN_PLAYERS) {
      socket.emit("error", { code: "NOT_ENOUGH_PLAYERS", message: `Need at least ${MIN_PLAYERS} players.` });
      return;
    }
    startNewGame(io, room);
  });

  socket.on("submit_night_action", (payload: SubmitNightActionPayload) => {
    const { room, player } = currentRoomAndPlayer(socket);
    if (!room || !player || !room.gameEngine) return;
    room.gameEngine.submitNightAction(player.id, payload.targetPlayerId);
  });

  socket.on("cast_vote", (payload: CastVotePayload) => {
    const { room, player } = currentRoomAndPlayer(socket);
    if (!room || !player || !room.gameEngine) return;
    room.gameEngine.castVote(player.id, payload.targetPlayerId);
  });

  socket.on("send_chat_message", (payload: SendChatMessagePayload) => {
    const { room, player } = currentRoomAndPlayer(socket);
    if (!room || !player || !room.gameEngine) return;
    const text = sanitizeChatText(payload.text);
    if (!text) return;
    room.gameEngine.addChatMessage(player.id, player.nickname, text);
  });
}
