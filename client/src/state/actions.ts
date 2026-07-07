import type { Dispatch } from "react";
import type { CreateRoomPayload, JoinRoomPayload, RoomSettings, RoomSummary } from "@wolf/shared";
import { socket } from "../socket/socket";
import { setStoredNickname, setStoredSession, clearStoredSession } from "./session";
import type { AppAction } from "./gameReducer";

export type JoinResult = { ok: true; roomCode: string } | { ok: false; error: string };

export function createRoom(dispatch: Dispatch<AppAction>, payload: CreateRoomPayload): Promise<JoinResult> {
  return new Promise((resolve) => {
    socket.emit("create_room", payload, (res) => {
      if (!res.ok) return resolve(res);
      setStoredNickname(payload.nickname);
      setStoredSession({ roomCode: res.roomCode, sessionToken: res.sessionToken });
      dispatch({
        type: "ROOM_JOINED",
        roomCode: res.roomCode,
        playerId: res.playerId,
        sessionToken: res.sessionToken,
      });
      resolve({ ok: true, roomCode: res.roomCode });
    });
  });
}

export function joinRoom(dispatch: Dispatch<AppAction>, payload: JoinRoomPayload): Promise<JoinResult> {
  const roomCode = payload.roomCode.toUpperCase();
  return new Promise((resolve) => {
    socket.emit("join_room", { ...payload, roomCode }, (res) => {
      if (!res.ok) return resolve(res);
      setStoredNickname(payload.nickname);
      setStoredSession({ roomCode, sessionToken: res.sessionToken });
      dispatch({ type: "ROOM_JOINED", roomCode, playerId: res.playerId, sessionToken: res.sessionToken });
      resolve({ ok: true, roomCode });
    });
  });
}

export function rejoinRoom(dispatch: Dispatch<AppAction>, roomCode: string, sessionToken: string): Promise<boolean> {
  return new Promise((resolve) => {
    socket.emit("rejoin_room", { roomCode, sessionToken }, (res) => {
      if (!res.ok) return resolve(false);
      dispatch({
        type: "ROOM_JOINED",
        roomCode,
        playerId: res.playerId,
        sessionToken,
        hostPlayerId: res.hostPlayerId,
        settings: res.settings,
        game: res.gameState,
        myRole: res.myRole,
        investigationResults: res.investigationResults,
      });
      resolve(true);
    });
  });
}

export function listPublicRooms(): Promise<RoomSummary[]> {
  return new Promise((resolve) => socket.emit("list_public_rooms", resolve));
}

export function leaveRoom(dispatch: Dispatch<AppAction>): void {
  socket.emit("leave_room");
  clearStoredSession();
  dispatch({ type: "LEFT_ROOM" });
}

export function updateSettings(settings: Partial<RoomSettings>): void {
  socket.emit("update_settings", { settings });
}

export function kickPlayer(targetPlayerId: string): void {
  socket.emit("kick_player", { targetPlayerId });
}

export function startGame(): void {
  socket.emit("start_game");
}

export function submitNightAction(targetPlayerId: string): void {
  socket.emit("submit_night_action", { targetPlayerId });
}

export function castVote(targetPlayerId: string | null): void {
  socket.emit("cast_vote", { targetPlayerId });
}

export function sendChatMessage(text: string): void {
  socket.emit("send_chat_message", { text });
}

export function addBot(): void {
  socket.emit("add_bot");
}

export function terminateRoom(): void {
  socket.emit("terminate_room");
}

export function playAgain(): void {
  socket.emit("play_again");
}
