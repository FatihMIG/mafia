import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "./state/GameContext";
import { getStoredSession, clearStoredSession } from "./state/session";
import { rejoinRoom } from "./state/actions";
import { AppRoutes } from "./router";
import { ErrorBanner } from "./components/ui/ErrorBanner";

export function App() {
  const { state, dispatch } = useGame();
  const navigate = useNavigate();

  useEffect(() => {
    const session = getStoredSession();
    if (!session) {
      dispatch({ type: "BOOTSTRAPPED" });
      return;
    }

    rejoinRoom(dispatch, session.roomCode, session.sessionToken).then((ok) => {
      if (!ok) {
        clearStoredSession();
        dispatch({ type: "BOOTSTRAPPED" });
        return;
      }
      dispatch({ type: "BOOTSTRAPPED" });
      navigate(`/room/${session.roomCode}`, { replace: true });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!state.bootstrapped) {
    return (
      <div className="flex h-screen items-center justify-center bg-mafia-bg text-mafia-muted">
        Reconnecting…
      </div>
    );
  }

  return (
    <>
      <ErrorBanner />
      <AppRoutes />
    </>
  );
}
