import { useEffect, useRef, useState } from "react";
import { useGame, useMyPlayer } from "../../state/GameContext";
import { sendChatMessage } from "../../state/actions";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

export function DayPhaseView() {
  const { state } = useGame();
  const myPlayer = useMyPlayer();
  const [text, setText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.game?.chatLog.length]);

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed) return;
    sendChatMessage(trimmed);
    setText("");
  }

  const killedPlayer = state.game?.lastNightResult?.killedPlayerId
    ? state.players.find((p) => p.id === state.game?.lastNightResult?.killedPlayerId)
    : null;

  return (
    <div className="space-y-4">
      <h2 className="text-center font-display text-xl text-mafia-text">Daybreak</h2>
      {state.game?.lastNightResult && (
        <p className="text-center text-mafia-muted">
          {killedPlayer ? `${killedPlayer.nickname} was found dead this morning.` : "Everyone survived the night."}
        </p>
      )}

      <div className="h-64 space-y-2 overflow-y-auto border-2 border-mafia-text bg-mafia-panel2 p-3">
        {state.game?.chatLog.map((m) => (
          <div key={m.id} className="text-sm">
            <span className="font-semibold text-mafia-primary">{m.nickname}: </span>
            <span>{m.text}</span>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {myPlayer?.isAlive ? (
        <div className="flex gap-2">
          <Input
            className="flex-1"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Say something…"
            maxLength={280}
          />
          <Button onClick={handleSend}>💬 Send</Button>
        </div>
      ) : (
        <p className="text-center text-sm text-mafia-muted">You are eliminated and can only watch.</p>
      )}
    </div>
  );
}
