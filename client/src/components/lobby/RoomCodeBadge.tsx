import { useState } from "react";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";

interface Props {
  roomCode: string;
}

export function RoomCodeBadge({ roomCode }: Props) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    const url = `${window.location.origin}${import.meta.env.BASE_URL}room/${roomCode}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex items-center gap-3">
      <div className="border-4 border-white bg-mafia-bg px-4 py-2 font-pixel text-2xl tracking-[0.3em] text-mafia-accent2">
        {roomCode}
      </div>
      <Button variant="secondary" onClick={copyLink}>
        <Icon name={copied ? "check" : "link"} /> {copied ? "Copied!" : "Copy Link"}
      </Button>
    </div>
  );
}
