import { MIN_PLAYERS, MAX_PLAYERS } from "@wolf/shared";
import type {
  CreateRoomAck,
  CreateRoomPayload,
  JoinRoomAck,
  JoinRoomPayload,
  RejoinRoomAck,
  RejoinRoomPayload,
  KickPlayerPayload,
  UpdateSettingsPayload,
  AckError,
  RoomSummary,
} from "@wolf/shared";
import { roomStore } from "../rooms/RoomStore.js";
import { Player } from "../rooms/Player.js";
import { createBotPlayer } from "../rooms/bots.js";
import { sanitizeNickname, sanitizeRoomCode } from "../util/sanitize.js";
import { broadcastRoomUpdate } from "./roomBroadcast.js";
import { currentRoomAndPlayer } from "./socketContext.js";
import type { IOServer, IOSocket } from "./types.js";
import { logger } from "../util/logger.js";

function fail(message: string): AckError {
  return { ok: false, error: message };
}

const DURATION_MIN_SEC = 10;
const DURATION_MAX_SEC = 300;

export function registerLobbyHandlers(io: IOServer, socket: IOSocket): void {
  socket.on("create_room", (payload: CreateRoomPayload, ack) => {
    const nickname = sanitizeNickname(payload.nickname);
    const hostPlayer = new Player(nickname, socket.id, true);
    const settings = {
      ...payload.settings,
      maxPlayers: clamp(payload.settings?.maxPlayers ?? MAX_PLAYERS, MIN_PLAYERS, MAX_PLAYERS),
    };
    const room = roomStore.createRoom(hostPlayer, payload.isPublic, settings);

    socket.join(room.code);
    socket.data.roomCode = room.code;
    socket.data.playerId = hostPlayer.id;

    logger.info(`room ${room.code} created by ${nickname}`);

    const res: CreateRoomAck = {
      ok: true,
      roomCode: room.code,
      sessionToken: hostPlayer.sessionToken,
      playerId: hostPlayer.id,
    };
    ack(res);
    broadcastRoomUpdate(io, room);
  });

  socket.on("join_room", (payload: JoinRoomPayload, ack) => {
    const room = roomStore.get(sanitizeRoomCode(payload.roomCode));
    if (!room) return ack(fail("Room not found."));
    if (room.isFull()) return ack(fail("Room is full."));
    if (!room.isInLobby()) return ack(fail("Game already in progress."));

    const nickname = sanitizeNickname(payload.nickname);
    const player = new Player(nickname, socket.id, false);
    room.addPlayer(player);

    socket.join(room.code);
    socket.data.roomCode = room.code;
    socket.data.playerId = player.id;

    const res: JoinRoomAck = { ok: true, sessionToken: player.sessionToken, playerId: player.id };
    ack(res);
    broadcastRoomUpdate(io, room);
  });

  socket.on("rejoin_room", (payload: RejoinRoomPayload, ack) => {
    const room = roomStore.get(sanitizeRoomCode(payload.roomCode));
    if (!room) return ack(fail("Room not found."));

    const player = room.getPlayerBySessionToken(payload.sessionToken);
    if (!player) return ack(fail("Session not recognized."));

    if (player.disconnectGraceTimer) {
      clearTimeout(player.disconnectGraceTimer);
      player.disconnectGraceTimer = null;
    }
    player.socketId = socket.id;
    player.isConnected = true;
    room.touch();

    socket.join(room.code);
    socket.data.roomCode = room.code;
    socket.data.playerId = player.id;

    const res: RejoinRoomAck = {
      ok: true,
      playerId: player.id,
      settings: room.settings,
      hostPlayerId: room.hostPlayerId,
      gameState: room.getGameState(),
      myRole: player.role,
      investigationResults: room.gameEngine?.getInvestigationHistory(player.id) ?? [],
    };
    ack(res);

    io.to(room.code).emit("player_reconnected", { playerId: player.id });
    broadcastRoomUpdate(io, room);
  });

  socket.on("leave_room", () => {
    const { room, player } = currentRoomAndPlayer(socket);
    if (!room || !player) return;

    room.removePlayer(player.id);
    socket.leave(room.code);
    socket.data.roomCode = undefined;
    socket.data.playerId = undefined;

    if (room.players.size > 0) broadcastRoomUpdate(io, room);
  });

  socket.on("kick_player", (payload: KickPlayerPayload) => {
    const { room, player: requester } = currentRoomAndPlayer(socket);
    if (!room || !requester || requester.id !== room.hostPlayerId) return;
    if (!room.isInLobby()) return;
    if (payload.targetPlayerId === requester.id) return;

    const target = room.players.get(payload.targetPlayerId);
    if (!target) return;

    const targetSocket = io.sockets.sockets.get(target.socketId);
    if (targetSocket) {
      targetSocket.emit("error", { code: "KICKED", message: "You were removed from the room." });
      targetSocket.leave(room.code);
      targetSocket.data.roomCode = undefined;
      targetSocket.data.playerId = undefined;
    }

    room.removePlayer(target.id);
    broadcastRoomUpdate(io, room);
  });

  socket.on("update_settings", (payload: UpdateSettingsPayload) => {
    const { room, player } = currentRoomAndPlayer(socket);
    if (!room || !player || player.id !== room.hostPlayerId) return;
    if (!room.isInLobby()) return;

    room.settings = {
      ...room.settings,
      ...payload.settings,
      maxPlayers: clamp(
        payload.settings.maxPlayers ?? room.settings.maxPlayers,
        Math.max(room.players.size, MIN_PLAYERS),
        MAX_PLAYERS,
      ),
      nightDurationSec: clamp(
        payload.settings.nightDurationSec ?? room.settings.nightDurationSec,
        DURATION_MIN_SEC,
        DURATION_MAX_SEC,
      ),
      dayDurationSec: clamp(
        payload.settings.dayDurationSec ?? room.settings.dayDurationSec,
        DURATION_MIN_SEC,
        DURATION_MAX_SEC,
      ),
      votingDurationSec: clamp(
        payload.settings.votingDurationSec ?? room.settings.votingDurationSec,
        DURATION_MIN_SEC,
        DURATION_MAX_SEC,
      ),
    };
    broadcastRoomUpdate(io, room);
  });

  socket.on("list_public_rooms", (ack: (res: RoomSummary[]) => void) => {
    ack(roomStore.listPublic());
  });

  socket.on("add_bot", () => {
    const { room, player } = currentRoomAndPlayer(socket);
    if (!room || !player || player.id !== room.hostPlayerId) return;
    if (!room.isInLobby()) return;
    if (room.isFull()) return;

    const bot = createBotPlayer([...room.players.values()].map((p) => p.nickname));
    room.addPlayer(bot);
    broadcastRoomUpdate(io, room);
  });

  socket.on("terminate_room", () => {
    const { room, player } = currentRoomAndPlayer(socket);
    if (!room || !player || player.id !== room.hostPlayerId) return;

    room.gameEngine?.stop();
    io.to(room.code).emit("room_terminated");

    for (const p of room.players.values()) {
      const s = io.sockets.sockets.get(p.socketId);
      if (s) {
        s.leave(room.code);
        s.data.roomCode = undefined;
        s.data.playerId = undefined;
      }
    }
    roomStore.delete(room.code);
    logger.info(`room ${room.code} terminated by host`);
  });
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}
