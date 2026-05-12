import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "./api/config";

const BASE = API_BASE_URL.replace("/api", "");

export const socket: Socket = io(BASE, {
  withCredentials: true,
  autoConnect: false,
});
