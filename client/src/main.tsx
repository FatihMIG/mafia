import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GameStateProvider } from "./state/GameContext";
import { SocketProvider } from "./socket/SocketProvider";
import { App } from "./App";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GameStateProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <SocketProvider>
          <App />
        </SocketProvider>
      </BrowserRouter>
    </GameStateProvider>
  </StrictMode>,
);
