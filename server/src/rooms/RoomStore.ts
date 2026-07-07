import type { RoomSettings, RoomSummary } from "@wolf/shared";
import { Room } from "./Room.js";
import { Player } from "./Player.js";
import { generateUniqueRoomCode } from "./roomCode.js";

const EMPTY_ROOM_GRACE_MS = 30_000;
const STALE_ROOM_MS = 2 * 60 * 60 * 1000; // 2 hours
const SWEEP_INTERVAL_MS = 60_000;

export class RoomStore {
  private rooms = new Map<string, Room>();
  private sweepTimer: NodeJS.Timeout;

  constructor() {
    this.sweepTimer = setInterval(() => this.sweep(), SWEEP_INTERVAL_MS);
    this.sweepTimer.unref();
  }

  createRoom(hostPlayer: Player, isPublic: boolean, settings?: Partial<RoomSettings>): Room {
    const code = generateUniqueRoomCode((c) => this.rooms.has(c));
    const room = new Room(code, hostPlayer, { ...settings, isPublic });
    this.rooms.set(code, room);
    return room;
  }

  get(code: string): Room | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  delete(code: string): void {
    this.rooms.delete(code);
  }

  listPublic(): RoomSummary[] {
    return [...this.rooms.values()]
      .filter((r) => r.settings.isPublic && r.isInLobby() && !r.isFull())
      .map((r) => r.toSummary());
  }

  private sweep(): void {
    const now = Date.now();
    for (const [code, room] of this.rooms) {
      const emptyTooLong = room.emptyAt !== null && now - room.emptyAt > EMPTY_ROOM_GRACE_MS;
      const stale = now - room.lastActivityAt > STALE_ROOM_MS;
      if (emptyTooLong || stale) {
        this.rooms.delete(code);
      }
    }
  }
}

export const roomStore = new RoomStore();
