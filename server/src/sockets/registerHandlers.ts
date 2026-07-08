import type { IOServer, IOSocket } from "./types.js";
import { registerLobbyHandlers } from "./lobbyHandlers.js";
import { registerConnectionHandlers } from "./connectionHandlers.js";
import { registerGameHandlers } from "./gameHandlers.js";

export function registerHandlers(io: IOServer, socket: IOSocket): void {
  registerLobbyHandlers(io, socket);
  registerGameHandlers(io, socket);
  registerConnectionHandlers(io, socket);
}
