import http from "node:http";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import { config } from "./config.js";
import type { IOServer } from "./sockets/types.js";
import { registerHandlers } from "./sockets/registerHandlers.js";
import { logger } from "./util/logger.js";

const app = express();
app.use(cors({ origin: config.clientOrigin }));
app.get("/health", (_req, res) => res.json({ ok: true }));

const httpServer = http.createServer(app);

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
