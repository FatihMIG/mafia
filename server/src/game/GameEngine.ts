import crypto from "node:crypto";
import { GamePhase, Role, type GameState, type Winner, type ChatMessage } from "@wolf/shared";
import type {
  PhaseChangedPayload,
  NightResultPayload,
  InvestigationResultPayload,
  RoleAssignedPayload,
  VoteUpdate,
  VoteResult,
  GameOverPayload,
} from "@wolf/shared";
import type { Room } from "../rooms/Room.js";
import { assignRoles } from "./roleAssignment.js";
import { resolveNight } from "./nightResolution.js";
import { resolveVotes } from "./voteResolution.js";
import { checkWinCondition } from "./winCondition.js";
import { pickRandomTarget, randomDelayMs, pickBotChatLine } from "./botAI.js";

const ROLE_REVEAL_DURATION_SEC = 6;

export interface GameEvents {
  onRoleAssigned(playerId: string, payload: RoleAssignedPayload): void;
  onPhaseChanged(payload: PhaseChangedPayload): void;
  onNightResult(payload: NightResultPayload): void;
  onInvestigationResult(playerId: string, payload: InvestigationResultPayload): void;
  onChatMessage(message: ChatMessage): void;
  onVoteUpdate(payload: VoteUpdate): void;
  onVoteResult(payload: VoteResult): void;
  onGameOver(payload: GameOverPayload): void;
  onRoomUpdate(): void;
}

export class GameEngine {
  phase: GamePhase = GamePhase.LOBBY;
  round = 0;
  phaseEndsAt: number | null = null;
  chatLog: ChatMessage[] = [];
  lastNightResult: NightResultPayload | null = null;
  lastVoteResult: VoteResult | null = null;
  winner: Winner | null = null;

  private timer: NodeJS.Timeout | null = null;
  private botTimers: NodeJS.Timeout[] = [];
  private mafiaTargetId: string | null = null;
  private doctorTargetId: string | null = null;
  private detectiveTargetId: string | null = null;
  private detectiveActorId: string | null = null;
  private votes = new Map<string, string | null>();
  private investigationHistory = new Map<string, InvestigationResultPayload[]>();

  constructor(
    private room: Room,
    private events: GameEvents,
  ) {}

  start(): void {
    assignRoles([...this.room.players.values()], this.room.settings.mafiaCountOverride);
    for (const player of this.room.players.values()) {
      if (player.role) this.events.onRoleAssigned(player.id, { role: player.role });
    }
    this.round = 1;
    this.transitionTo(GamePhase.ROLE_REVEAL, ROLE_REVEAL_DURATION_SEC);
  }

  submitNightAction(playerId: string, targetPlayerId: string): void {
    if (this.phase !== GamePhase.NIGHT) return;
    const player = this.room.players.get(playerId);
    if (!player || !player.isAlive || !player.role) return;
    if (!this.room.players.get(targetPlayerId)?.isAlive) return;

    if (player.role === Role.MAFIA) {
      this.mafiaTargetId = targetPlayerId;
    } else if (player.role === Role.DOCTOR) {
      this.doctorTargetId = targetPlayerId;
    } else if (player.role === Role.DETECTIVE) {
      this.detectiveTargetId = targetPlayerId;
      this.detectiveActorId = playerId;
    } else {
      return;
    }

    if (this.allNightActorsSubmitted()) this.resolveNightPhase();
  }

  castVote(playerId: string, targetPlayerId: string | null): void {
    if (this.phase !== GamePhase.VOTING) return;
    const player = this.room.players.get(playerId);
    if (!player || !player.isAlive) return;
    if (targetPlayerId && !this.room.players.get(targetPlayerId)?.isAlive) return;

    this.votes.set(playerId, targetPlayerId);
    this.events.onVoteUpdate(this.currentVoteTally());

    const aliveCount = [...this.room.players.values()].filter((p) => p.isAlive).length;
    if (this.votes.size >= aliveCount) this.resolveVotingPhase();
  }

  addChatMessage(playerId: string, nickname: string, text: string): void {
    if (this.phase !== GamePhase.DAY) return;
    const player = this.room.players.get(playerId);
    if (!player || !player.isAlive) return;

    const message: ChatMessage = { id: crypto.randomUUID(), playerId, nickname, text, timestamp: Date.now() };
    this.chatLog.push(message);
    this.events.onChatMessage(message);
  }

  /** Halts all pending timers — call when the room is being torn down out from under the engine. */
  stop(): void {
    this.clearTimer();
    this.clearBotTimers();
  }

  getState(): GameState {
    return {
      phase: this.phase,
      round: this.round,
      phaseEndsAt: this.phaseEndsAt,
      players: this.room.getPublicPlayers(),
      deadPlayerIds: [...this.room.players.values()].filter((p) => !p.isAlive).map((p) => p.id),
      lastNightResult: this.lastNightResult,
      lastVoteResult: this.lastVoteResult,
      chatLog: this.chatLog,
      winner: this.winner,
    };
  }

  getInvestigationHistory(playerId: string): InvestigationResultPayload[] {
    return this.investigationHistory.get(playerId) ?? [];
  }

  private currentVoteTally(): VoteUpdate {
    const tally: Record<string, number> = {};
    for (const targetId of this.votes.values()) {
      if (!targetId) continue;
      tally[targetId] = (tally[targetId] ?? 0) + 1;
    }
    return { tally, votedPlayerIds: [...this.votes.keys()] };
  }

  private allNightActorsSubmitted(): boolean {
    const alive = [...this.room.players.values()].filter((p) => p.isAlive);
    const needsMafia = alive.some((p) => p.role === Role.MAFIA);
    const needsDoctor = alive.some((p) => p.role === Role.DOCTOR);
    const needsDetective = alive.some((p) => p.role === Role.DETECTIVE);
    if (needsMafia && this.mafiaTargetId === null) return false;
    if (needsDoctor && this.doctorTargetId === null) return false;
    if (needsDetective && this.detectiveTargetId === null) return false;
    return true;
  }

  private clearTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private clearBotTimers(): void {
    for (const t of this.botTimers) clearTimeout(t);
    this.botTimers = [];
  }

  private transitionTo(phase: GamePhase, durationSec: number | null): void {
    this.clearTimer();
    this.clearBotTimers();
    this.phase = phase;
    this.phaseEndsAt = durationSec !== null ? Date.now() + durationSec * 1000 : null;
    this.events.onPhaseChanged({ phase, phaseEndsAt: this.phaseEndsAt, round: this.round });

    if (durationSec !== null) {
      this.timer = setTimeout(() => this.onPhaseTimerExpired(), durationSec * 1000);
    }

    this.scheduleBotActions(phase, durationSec);
  }

  private scheduleBotActions(phase: GamePhase, durationSec: number | null): void {
    const bots = [...this.room.players.values()].filter((p) => p.isBot && p.isAlive);
    if (bots.length === 0) return;

    // Never let a scheduled bot action land after its own phase would have already ended.
    const maxDelayMs = durationSec !== null ? Math.max(1000, (durationSec - 2) * 1000) : 4000;
    const cappedDelay = (minSec: number, maxSec: number) => Math.min(randomDelayMs(minSec, maxSec), maxDelayMs);

    if (phase === GamePhase.NIGHT) {
      for (const bot of bots) {
        if (bot.role !== Role.MAFIA && bot.role !== Role.DOCTOR && bot.role !== Role.DETECTIVE) continue;
        const timer = setTimeout(() => {
          const alive = [...this.room.players.values()].filter((p) => p.isAlive);
          const candidates = bot.role === Role.DOCTOR ? alive : alive.filter((p) => p.id !== bot.id);
          const targetId = pickRandomTarget(candidates);
          if (targetId) this.submitNightAction(bot.id, targetId);
        }, cappedDelay(1, 4));
        this.botTimers.push(timer);
      }
    } else if (phase === GamePhase.VOTING) {
      for (const bot of bots) {
        const timer = setTimeout(() => {
          const alive = [...this.room.players.values()].filter((p) => p.isAlive);
          const targetId = pickRandomTarget(alive, bot.id);
          this.castVote(bot.id, targetId);
        }, cappedDelay(1, 5));
        this.botTimers.push(timer);
      }
    } else if (phase === GamePhase.DAY) {
      for (const bot of bots) {
        const timer = setTimeout(() => {
          this.addChatMessage(bot.id, bot.nickname, pickBotChatLine());
        }, cappedDelay(2, 6));
        this.botTimers.push(timer);
      }
    }
  }

  private onPhaseTimerExpired(): void {
    switch (this.phase) {
      case GamePhase.ROLE_REVEAL:
        this.transitionTo(GamePhase.NIGHT, this.room.settings.nightDurationSec);
        break;
      case GamePhase.NIGHT:
        this.resolveNightPhase();
        break;
      case GamePhase.DAY:
        this.transitionTo(GamePhase.VOTING, this.room.settings.votingDurationSec);
        break;
      case GamePhase.VOTING:
        this.resolveVotingPhase();
        break;
      default:
        break;
    }
  }

  private resolveNightPhase(): void {
    this.clearTimer();

    const outcome = resolveNight(this.room.players, {
      mafiaTargetId: this.mafiaTargetId,
      doctorTargetId: this.doctorTargetId,
      detectiveTargetId: this.detectiveTargetId,
    });

    if (outcome.killedPlayerId) {
      const victim = this.room.players.get(outcome.killedPlayerId);
      if (victim) victim.isAlive = false;
    }
    this.lastNightResult = { killedPlayerId: outcome.killedPlayerId };
    this.events.onNightResult(this.lastNightResult);

    if (outcome.investigation && this.detectiveActorId) {
      const history = this.investigationHistory.get(this.detectiveActorId) ?? [];
      history.push(outcome.investigation);
      this.investigationHistory.set(this.detectiveActorId, history);
      this.events.onInvestigationResult(this.detectiveActorId, outcome.investigation);
    }

    this.mafiaTargetId = null;
    this.doctorTargetId = null;
    this.detectiveTargetId = null;
    this.detectiveActorId = null;
    this.chatLog = [];
    this.events.onRoomUpdate();

    const winner = checkWinCondition(this.room.players);
    if (winner) {
      this.endGame(winner);
      return;
    }

    this.transitionTo(GamePhase.DAY, this.room.settings.dayDurationSec);
  }

  private resolveVotingPhase(): void {
    this.clearTimer();

    const outcome = resolveVotes(this.votes);
    if (outcome.eliminatedPlayerId) {
      const target = this.room.players.get(outcome.eliminatedPlayerId);
      if (target) target.isAlive = false;
    }
    this.lastVoteResult = outcome;
    this.events.onVoteResult(outcome);
    this.votes.clear();
    this.events.onRoomUpdate();

    const winner = checkWinCondition(this.room.players);
    if (winner) {
      this.endGame(winner);
      return;
    }

    this.round += 1;
    this.transitionTo(GamePhase.NIGHT, this.room.settings.nightDurationSec);
  }

  private endGame(winner: Winner): void {
    this.winner = winner;
    this.transitionTo(GamePhase.GAME_OVER, null);
    const players = [...this.room.players.values()].map((p) => p.toRevealed());
    this.events.onGameOver({ winner, players });
  }
}
