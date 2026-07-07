import { useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import type {
  RoomUpdatePayload,
  RoleAssignedPayload,
  PhaseChangedPayload,
  NightResultPayload,
  InvestigationResultPayload,
  ChatMessage,
  VoteUpdate,
  VoteResult,
  GameOverPayload,
  PlayerConnectionPayload,
  ErrorPayload,
} from "@wolf/shared";
import { socket } from "./socket";
import { useGame } from "../state/GameContext";
import { clearStoredSession } from "../state/session";

export function SocketProvider({ children }: { children: ReactNode }) {
  const { dispatch } = useGame();
  const navigate = useNavigate();

  useEffect(() => {
    const onRoomUpdate = (payload: RoomUpdatePayload) => dispatch({ type: "ROOM_UPDATE", ...payload });
    const onGameStarted = () => dispatch({ type: "GAME_STARTED" });
    const onRoleAssigned = (payload: RoleAssignedPayload) => dispatch({ type: "ROLE_ASSIGNED", role: payload.role });
    const onPhaseChanged = (payload: PhaseChangedPayload) => dispatch({ type: "PHASE_CHANGED", payload });
    const onNightResult = (payload: NightResultPayload) => dispatch({ type: "NIGHT_RESULT", payload });
    const onInvestigationResult = (payload: InvestigationResultPayload) =>
      dispatch({ type: "INVESTIGATION_RESULT", payload });
    const onChatMessage = (message: ChatMessage) => dispatch({ type: "CHAT_MESSAGE", message });
    const onVoteUpdate = (payload: VoteUpdate) => dispatch({ type: "VOTE_UPDATE", payload });
    const onVoteResult = (payload: VoteResult) => dispatch({ type: "VOTE_RESULT", payload });
    const onGameOver = (payload: GameOverPayload) => dispatch({ type: "GAME_OVER", payload });
    const onPlayerDisconnected = (payload: PlayerConnectionPayload) =>
      dispatch({ type: "PLAYER_CONNECTION", playerId: payload.playerId, isConnected: false });
    const onPlayerReconnected = (payload: PlayerConnectionPayload) =>
      dispatch({ type: "PLAYER_CONNECTION", playerId: payload.playerId, isConnected: true });
    const onError = (payload: ErrorPayload) => {
      dispatch({ type: "ERROR", message: payload.message });
      if (payload.code === "KICKED") {
        clearStoredSession();
        dispatch({ type: "LEFT_ROOM" });
        navigate("/", { replace: true });
      }
    };
    const onRoomTerminated = () => {
      clearStoredSession();
      dispatch({ type: "LEFT_ROOM" });
      navigate("/", { replace: true });
    };

    socket.on("room_update", onRoomUpdate);
    socket.on("game_started", onGameStarted);
    socket.on("role_assigned", onRoleAssigned);
    socket.on("phase_changed", onPhaseChanged);
    socket.on("night_result", onNightResult);
    socket.on("investigation_result", onInvestigationResult);
    socket.on("chat_message", onChatMessage);
    socket.on("vote_update", onVoteUpdate);
    socket.on("vote_result", onVoteResult);
    socket.on("game_over", onGameOver);
    socket.on("player_disconnected", onPlayerDisconnected);
    socket.on("player_reconnected", onPlayerReconnected);
    socket.on("error", onError);
    socket.on("room_terminated", onRoomTerminated);

    return () => {
      socket.off("room_update", onRoomUpdate);
      socket.off("game_started", onGameStarted);
      socket.off("role_assigned", onRoleAssigned);
      socket.off("phase_changed", onPhaseChanged);
      socket.off("night_result", onNightResult);
      socket.off("investigation_result", onInvestigationResult);
      socket.off("chat_message", onChatMessage);
      socket.off("vote_update", onVoteUpdate);
      socket.off("vote_result", onVoteResult);
      socket.off("game_over", onGameOver);
      socket.off("player_disconnected", onPlayerDisconnected);
      socket.off("player_reconnected", onPlayerReconnected);
      socket.off("error", onError);
      socket.off("room_terminated", onRoomTerminated);
    };
  }, [dispatch, navigate]);

  return <>{children}</>;
}
