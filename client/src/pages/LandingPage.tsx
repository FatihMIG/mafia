import { useRef, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useGame } from "../state/GameContext";
import { createRoom, joinRoom } from "../state/actions";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card } from "../components/ui/Card";
import { Icon } from "../components/ui/Icon";
import { Modal } from "../components/ui/Modal";

export function LandingPage() {
  const { state, dispatch } = useGame();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [nickname, setNickname] = useState(state.nickname);
  const [roomCode, setRoomCode] = useState(searchParams.get("code") ?? "");
  const [isPublic, setIsPublic] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showObjective, setShowObjective] = useState(false);
  const nicknameRef = useRef<HTMLInputElement>(null);

  // Missing a name is the single most common reason a friend's "join" click does
  // nothing, so require it explicitly (with feedback) instead of just disabling
  // the button — a disabled control with no explanation looks like a broken page.
  function requireNickname(): boolean {
    if (nickname.trim().length > 0) return true;
    dispatch({ type: "ERROR", message: "Enter a name first" });
    nicknameRef.current?.focus();
    return false;
  }

  async function handleCreate() {
    if (busy || !requireNickname()) return;
    setBusy(true);
    dispatch({ type: "SET_NICKNAME", nickname: nickname.trim() });
    const res = await createRoom(dispatch, { nickname: nickname.trim(), isPublic });
    setBusy(false);
    if (res.ok) navigate(`/room/${res.roomCode}`);
    else dispatch({ type: "ERROR", message: res.error });
  }

  async function handleJoin() {
    if (busy || roomCode.trim().length === 0 || !requireNickname()) return;
    setBusy(true);
    dispatch({ type: "SET_NICKNAME", nickname: nickname.trim() });
    const res = await joinRoom(dispatch, { nickname: nickname.trim(), roomCode: roomCode.trim() });
    setBusy(false);
    if (res.ok) navigate(`/room/${res.roomCode}`);
    else dispatch({ type: "ERROR", message: res.error });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-4">
      <div className="text-center">
        <h1 className="title-8bit font-display text-4xl font-bold sm:text-6xl">MAFIA</h1>
        <p className="mt-4 font-pixel text-2xl text-mafia-onDarkMuted">A game of trust, lies, and elimination.</p>
      </div>

      <Modal open={showObjective} onClose={() => setShowObjective(false)} title="Objective">
        <p>
          The Town must find and vote out every Mafia member hiding among them. Each night the Mafia secretly
          strikes, the Doctor protects someone, and the Detective investigates a suspect. Each day, everyone debates
          and votes someone out. <span className="text-mafia-text">Town wins</span> by eliminating all Mafia —{" "}
          <span className="text-mafia-text">Mafia wins</span> if they ever equal or outnumber the Town.
        </p>
      </Modal>

      <Card className="w-full max-w-md space-y-6">
        <div className="space-y-2">
          <label className="block text-sm text-mafia-muted">Your name</label>
          <Input
            ref={nicknameRef}
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
              <input
                type="checkbox"
                className="nes-checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              <span>Public (listed in browse)</span>
            </label>
          </div>
          <Button className="w-full" disabled={busy} onClick={handleCreate}>
            <Icon name="play" /> Create Room
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
            <Button variant="secondary" disabled={busy || !roomCode.trim()} onClick={handleJoin}>
              <Icon name="arrow-right" /> Join
            </Button>
          </div>
        </div>

        <Link
          to="/browse"
          className="flex items-center justify-center gap-1.5 text-center text-sm text-mafia-muted hover:text-mafia-text"
        >
          Browse public rooms <Icon name="arrow-right" />
        </Link>
      </Card>

      <Button variant="secondary" onClick={() => setShowObjective(true)}>
        <Icon name="info-circle" /> Objective
      </Button>
    </div>
  );
}
