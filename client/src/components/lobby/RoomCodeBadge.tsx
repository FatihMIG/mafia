import { useState } from "react";
import { Button } from "../ui/Button";

interface Props {
  roomCode: string;
}

export function RoomCodeBadge({ roomCode }: Props) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    const url = `${window.location.origin}/room/${roomCode}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex items-center gap-3">
      <div className="rounded-md bg-mafia-panel2 px-4 py-2 font-mono text-2xl tracking-[0.3em] text-mafia-accent2">
        {roomCode}
      </div>
      <Button variant="secondary" onClick={copyLink}>
        {copied ? "✅ Copied!" : "🔗 Copy Link"}
      </Button>
    </div>
  );
}
