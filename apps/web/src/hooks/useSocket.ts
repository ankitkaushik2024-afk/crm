import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addNotification } from '@/store/slices/notificationSlice';
import { toast } from 'sonner';

const WS_URL = import.meta.env.VITE_WS_URL || '';

let socket: Socket | null = null;

export function useSocket() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, accessToken } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      socket?.disconnect();
      socket = null;
      return;
    }

    socket = io(WS_URL || window.location.origin, {
      auth: { token: accessToken },
      path: '/socket.io',
      transports: ['websocket', 'polling'],
    });

    socket.on('notification:new', (notification) => {
      dispatch(addNotification(notification));
      toast.info(notification.title, { description: notification.message });
    });

    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, [isAuthenticated, accessToken, dispatch]);
}
