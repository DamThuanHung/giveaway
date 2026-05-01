"use client";

import { io, Socket } from "socket.io-client";
import { getToken } from "./auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.traotay.com.vn";

/// Connect socket cho chat room cụ thể. Auth qua JWT trong handshake query
/// (chat.gateway.ts đọc query.token làm fallback chính cho WS-only mode).
export function connectChatSocket(roomId: string): Socket | null {
  const token = getToken();
  if (!token) return null;

  return io(API_BASE, {
    transports: ["websocket"],
    auth: { token },
    query: { roomId, token },
  });
}
