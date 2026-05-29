import { useEffect, useState } from 'react';
import { CheckSquare, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { api, getApiErrorMessage } from '@/lib/api';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@crm/shared';

interface Project {
  id: string;
  name: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  project?: { id: string; name: string } | null;
  assignee?: { user: { firstName: string; lastName: string } } | null;
}

const STATUSES = ['PENDING', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'] as const;

export function TasksPage() {
  const user = useAppSelector((s) => s.auth.user);
  const canWrite = user?.permissions.includes(PERMISSIONS.TASKS_WRITE);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    projectId: '',
    priority: 'MEDIUM',
    description: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const [taskRes, projectRes] = await Promise.all([
        api.get('/tasks', { params: { limit: 50 } }),
        api.get('/projects', { params: { limit: 50 } }),
      ]);
      setTasks(taskRes.data.data ?? []);
      setProjects(projectRes.data.data ?? []);
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/tasks', {
        ...form,
        projectId: form.projectId || undefined,
      });
      toast.success('Task created');
      setShowForm(false);
      setForm({ title: '', projectId: '', priority: 'MEDIUM', description: '' });
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/tasks/${id}`, { status });
      toast.success('Task updated');
      load();
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CheckSquare className="h-7 w-7 text-primary" />
            Tasks
          </h1>
          <p className="text-muted-foreground">Manage tasks across projects</p>
        </div>
        {canWrite && (
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        )}
      </div>

      {showForm && canWrite && (
        <Card>
          <CardHeader><CardTitle className="text-base">Create Task</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Title</Label>
                <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Project</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.projectId}
                  onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                >
                  <option value="">—</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create Task'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6"><Skeleton className="h-24 w-full" /></div>
          ) : tasks.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No tasks yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Task</th>
                    <th className="text-left p-3 font-medium">Project</th>
                    <th className="text-left p-3 font-medium">Assignee</th>
                    <th className="text-left p-3 font-medium">Priority</th>
                    <th className="text-left p-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((t) => (
                    <tr key={t.id} className="border-b">
                      <td className="p-3 font-medium">{t.title}</td>
                      <td className="p-3">{t.project?.name ?? '—'}</td>
                      <td className="p-3">
                        {t.assignee ? `${t.assignee.user.firstName} ${t.assignee.user.lastName}` : '—'}
                      </td>
                      <td className="p-3"><Badge variant="outline">{t.priority}</Badge></td>
                      <td className="p-3">
                        {canWrite ? (
                          <select
                            className="rounded-md border border-input bg-background px-2 py-1 text-xs"
                            value={t.status}
                            onChange={(e) => updateStatus(t.id, e.target.value)}
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>{s.replace('_', ' ')}</option>
                            ))}
                          </select>
                        ) : (
                          <Badge variant="outline">{t.status}</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
