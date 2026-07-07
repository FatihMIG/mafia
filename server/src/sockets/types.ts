import type { Server, Socket } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents } from "@wolf/shared";

export interface SocketData {
  roomCode?: string;
  playerId?: string;
}

export type IOServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;
export type IOSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;
