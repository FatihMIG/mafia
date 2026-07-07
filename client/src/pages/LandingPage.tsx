import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useGame } from "../state/GameContext";
import { createRoom, joinRoom } from "../state/actions";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card } from "../components/ui/Card";

export function LandingPage() {
  const { state, dispatch } = useGame();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [nickname, setNickname] = useState(state.nickname);
  const [roomCode, setRoomCode] = useState(searchParams.get("code") ?? "");
  const [isPublic, setIsPublic] = useState(true);
  const [busy, setBusy] = useState(false);

  const canSubmit = nickname.trim().length > 0 && !busy;

  async function handleCreate() {
    if (!canSubmit) return;
    setBusy(true);
    dispatch({ type: "SET_NICKNAME", nickname: nickname.trim() });
    const res = await createRoom(dispatch, { nickname: nickname.trim(), isPublic });
    setBusy(false);
    if (res.ok) navigate(`/room/${res.roomCode}`);
    else dispatch({ type: "ERROR", message: res.error });
  }

  async function handleJoin() {
    if (!canSubmit || roomCode.trim().length === 0) return;
    setBusy(true);
    dispatch({ type: "SET_NICKNAME", nickname: nickname.trim() });
    const res = await joinRoom(dispatch, { nickname: nickname.trim(), roomCode: roomCode.trim() });
    setBusy(false);
    if (res.ok) navigate(`/room/${res.roomCode}`);
    else dispatch({ type: "ERROR", message: res.error });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-mafia-bg px-4">
      <div className="text-center">
        <h1 className="font-display text-5xl font-bold text-mafia-accent">MAFIA</h1>
        <p className="mt-2 text-mafia-muted">A game of trust, lies, and elimination.</p>
      </div>

      <Card className="w-full max-w-md space-y-6">
        <div className="space-y-2">
          <label className="block text-sm text-mafia-muted">Your name</label>
          <Input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Enter a nickname"
            maxLength={20}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-mafia-muted">Create a room</span>
            <label className="flex items-center gap-2 text-sm text-mafia-muted">
              <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
              Public (listed in browse)
            </label>
          </div>
          <Button className="w-full" disabled={!canSubmit} onClick={handleCreate}>
            🃏 Create Room
          </Button>
        </div>

        <div className="flex items-center gap-3 text-mafia-muted">
          <div className="h-px flex-1 bg-mafia-panel2" />
          or
          <div className="h-px flex-1 bg-mafia-panel2" />
        </div>

        <div className="space-y-2">
          <label className="block text-sm text-mafia-muted">Join with a room code</label>
          <div className="flex gap-2">
            <Input
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="CODE"
              maxLength={8}
              className="flex-1 uppercase tracking-widest"
            />
            <Button variant="secondary" disabled={!canSubmit || !roomCode.trim()} onClick={handleJoin}>
              ➡️ Join
            </Button>
          </div>
        </div>

        <Link to="/browse" className="block text-center text-sm text-mafia-muted hover:text-mafia-text">
          Browse public rooms →
        </Link>
      </Card>
    </div>
  );
}
