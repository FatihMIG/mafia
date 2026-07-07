import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { RoomSummary } from "@wolf/shared";
import { listPublicRooms } from "../state/actions";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

const POLL_MS = 3000;

export function BrowsePage() {
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      const res = await listPublicRooms();
      if (!cancelled) setRooms(res);
    }
    poll();
    const interval = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 py-12 text-mafia-text">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl text-mafia-accent">Public Rooms</h1>
        <Link to="/" className="text-sm text-mafia-muted hover:text-mafia-text">
          ← Back
        </Link>
      </div>

      {rooms.length === 0 ? (
        <Card className="text-center text-mafia-muted">No public rooms right now. Create one!</Card>
      ) : (
        <div className="space-y-3">
          {rooms.map((room) => (
            <Card key={room.code} className="flex items-center justify-between">
              <div>
                <div className="font-medium">{room.hostNickname}'s room</div>
                <div className="text-sm text-mafia-muted">
                  {room.playerCount}/{room.maxPlayers} players · {room.code}
                </div>
              </div>
              <Button onClick={() => navigate(`/?code=${room.code}`)}>➡️ Join</Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
