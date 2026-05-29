import { useEffect, useState } from 'react';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api, getApiErrorMessage } from '@/lib/api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { markRead, setNotifications, type AppNotification } from '@/store/slices/notificationSlice';

export function NotificationsPage() {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector((s) => s.notifications.items);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications', { params: { limit: 50 } });
      dispatch(setNotifications(res.data.data ?? []));
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await api.post(`/notifications/${id}/read`);
      dispatch(markRead(id));
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      dispatch(setNotifications(notifications.map((n) => ({ ...n, isRead: true }))));
      toast.success('All notifications marked as read');
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  const removeOne = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      dispatch(setNotifications(notifications.filter((n) => n.id !== id)));
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-7 w-7 text-primary" />
            Notifications
          </h1>
          <p className="text-muted-foreground">System alerts, approvals, and updates</p>
        </div>
        <Button variant="outline" onClick={markAllAsRead} disabled={loading}>
          <CheckCheck className="h-4 w-4 mr-2" />
          Mark all as read
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading notifications...</p>
          ) : notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notifications yet.</p>
          ) : (
            notifications.map((n: AppNotification) => (
              <div
                key={n.id}
                className={`rounded-md border p-3 ${n.isRead ? 'bg-background' : 'bg-primary/5'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{n.title}</p>
                      {!n.isRead && <Badge variant="default">New</Badge>}
                      <Badge variant="outline">{n.type}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {!n.isRead && (
                      <Button size="sm" variant="outline" onClick={() => markAsRead(n.id)}>
                        Read
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => removeOne(n.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
