import crypto from "node:crypto";
import type { Role } from "@wolf/shared";
import type { PlayerPublic, PlayerRevealed } from "@wolf/shared";

export class Player {
  readonly id: string;
  readonly sessionToken: string;
  nickname: string;
  socketId: string;
  isHost: boolean;
  isAlive: boolean;
  isConnected: boolean;
  isBot: boolean;
  role: Role | null;
  disconnectGraceTimer: NodeJS.Timeout | null = null;

  constructor(nickname: string, socketId: string, isHost: boolean, isBot = false) {
    this.id = crypto.randomUUID();
    this.sessionToken = crypto.randomUUID();
    this.nickname = nickname;
    this.socketId = socketId;
    this.isHost = isHost;
    this.isAlive = true;
    this.isConnected = true;
    this.isBot = isBot;
    this.role = null;
  }

  toPublic(): PlayerPublic {
    return {
      id: this.id,
      nickname: this.nickname,
      isHost: this.isHost,
      isAlive: this.isAlive,
      isConnected: this.isConnected,
      isBot: this.isBot,
    };
  }

  toRevealed(): PlayerRevealed {
    return {
      ...this.toPublic(),
      role: this.role,
    };
  }
}
