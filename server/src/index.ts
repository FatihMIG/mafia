import http from "node:http";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import { ExpressPeerServer } from "peer";
import { WebSocketServer } from "ws";
import { config } from "./config.js";
import type { IOServer } from "./sockets/types.js";
import { registerHandlers } from "./sockets/registerHandlers.js";
import { logger } from "./util/logger.js";

const app = express();
app.use(cors({ origin: config.clientOrigin }));
app.get("/health", (_req, res) => res.json({ ok: true }));

const httpServer = http.createServer(app);

// Self-hosted PeerJS signaling broker for voice chat — mounted on the same
// HTTP server rather than relying on PeerJS's public cloud broker, which its
// own docs say is for prototyping only (rate-limited, no uptime guarantee).
//
// PeerJS's default `{server: httpServer}` wiring makes its underlying `ws`
// WebSocketServer attach its own unconditional 'upgrade' listener directly to
// the shared httpServer — and `ws` actively responds 400-and-destroys the
// socket for any upgrade whose path doesn't match its own, before Socket.IO's
// own 'upgrade' listener (registered afterward) ever gets a chance to see it.
// Running it in `noServer` mode and dispatching upgrades ourselves — only for
// /peerjs/* — keeps the two independent WebSocket stacks off each other.
const peerWss = new WebSocketServer({ noServer: true });
const peerServer = ExpressPeerServer(httpServer, {
  path: "/",
  createWebSocketServer: () => peerWss,
});
app.use("/peerjs", peerServer);

httpServer.on("upgrade", (req, socket, head) => {
  if (req.url?.startsWith("/peerjs")) {
    peerWss.handleUpgrade(req, socket, head, (ws) => peerWss.emit("connection", ws, req));
  }
});

const io: IOServer = new Server(httpServer, {
  cors: { origin: config.clientOrigin },
});

io.on("connection", (socket) => {
  logger.info(`socket connected: ${socket.id}`);
  registerHandlers(io, socket);
});

httpServer.listen(config.port, () => {
  console.log(`[server] listening on http://localhost:${config.port}`);
});
