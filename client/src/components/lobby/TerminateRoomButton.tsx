import { useState } from "react";
import { terminateRoom } from "../../state/actions";
import { Button } from "../ui/Button";

export function TerminateRoomButton() {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-mafia-muted">End the room for everyone?</span>
        <Button variant="danger" onClick={() => terminateRoom()}>
          🛑 Yes, end it
        </Button>
        <Button variant="ghost" onClick={() => setConfirming(false)}>
          Never mind
        </Button>
      </div>
    );
  }

  return (
    <Button variant="danger" onClick={() => setConfirming(true)}>
      🛑 Terminate Room
    </Button>
  );
}
