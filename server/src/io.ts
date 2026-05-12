import { Server } from "socket.io";

let _io: Server | null = null;

export function setIO(io: Server) {
  _io = io;
}

export function emitToUser(userId: string, event: string, data: unknown) {
  _io?.to(`user:${userId}`).emit(event, data);
}
