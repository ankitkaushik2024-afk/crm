import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import { logger } from '../utils/logger';
import { env } from '../config/env';

let ioInstance: Server | null = null;

export function getIO(): Server | null {
  return ioInstance;
}

export function initSocketIO(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      credentials: true,
    },
    path: '/socket.io',
  });

  ioInstance = io;

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error('Authentication required'));
    try {
      const payload = verifyAccessToken(token);
      socket.data.userId = payload.sub;
      socket.data.companyId = payload.companyId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const { userId, companyId } = socket.data;
    socket.join(`user:${userId}`);
    socket.join(`company:${companyId}`);
    logger.debug(`Socket connected: ${userId}`);

    socket.on('notification:read', (notificationId: string) => {
      io.to(`user:${userId}`).emit('notification:updated', { id: notificationId, isRead: true });
    });

    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected: ${userId}`);
    });
  });

  return io;
}

export function emitNotification(
  io: Server,
  userId: string,
  notification: { id: string; title: string; message: string; type: string }
): void {
  io.to(`user:${userId}`).emit('notification:new', notification);
}
