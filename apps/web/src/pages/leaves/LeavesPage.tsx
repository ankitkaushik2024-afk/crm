import { useEffect, useState } from 'react';
import { CalendarDays, Check, X } from 'lucide-react';
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

interface LeaveType {
  id: string;
  name: string;
  code: string;
  daysPerYear: number;
}

interface LeaveBalance {
  id: string;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
  leaveType: { name: string; code: string };
}

interface LeaveRequest {
  id: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string | null;
  status: string;
  leaveType: { name: string };
  employee?: {
    employeeCode: string;
    user: { firstName: string; lastName: string };
  };
}

export function LeavesPage() {
  const user = useAppSelector((s) => s.auth.user);
  const canApprove = user?.permissions.includes(PERMISSIONS.LEAVES_APPROVE);

  const [types, setTypes] = useState<LeaveType[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const [form, setForm] = useState({
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const [typesRes, balRes, reqRes] = await Promise.all([
        api.get('/leaves/types'),
        api.get('/leaves/balances'),
        api.get('/leaves/requests', { params: { limit: 30 } }),
      ]);
      setTypes(typesRes.data.data ?? []);
      setBalances(balRes.data.data ?? []);
      setRequests(reqRes.data.data ?? []);
      if (!form.leaveTypeId && typesRes.data.data?.[0]) {
        setForm((f) => ({ ...f, leaveTypeId: typesRes.data.data[0].id }));
      }
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/leaves/requests', form);
      toast.success('Leave request submitted');
      setForm({ leaveTypeId: types[0]?.id ?? '', startDate: '', endDate: '', reason: '' });
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const approve = async (id: string) => {
    try {
      await api.post(`/leaves/requests/${id}/approve`);
      toast.success('Leave approved');
      load();
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  const reject = async (id: string) => {
    if (!rejectReason.trim()) {
      toast.error('Rejection reason is required');
      return;
    }
    try {
      await api.post(`/leaves/requests/${id}/reject`, { rejectionReason: rejectReason });
      toast.success('Leave rejected');
      setRejectId(null);
      setRejectReason('');
      load();
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <CalendarDays className="h-7 w-7 text-primary" />
          Leave Management
        </h1>
        <p className="text-muted-foreground">Apply for leave and track your balances</p>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {balances.map((b) => (
            <Card key={b.id}>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">{b.leaveType.name}</p>
                <p className="text-2xl font-bold mt-1">{b.remainingDays}</p>
                <p className="text-xs text-muted-foreground">
                  of {b.totalDays} days · used {b.usedDays}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Apply for Leave</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleApply} className="grid gap-4 sm:grid-cols-2 max-w-2xl">
            <div className="space-y-2 sm:col-span-2">
              <Label>Leave type</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
                value={form.leaveTypeId}
                onChange={(e) => setForm({ ...form, leaveTypeId: e.target.value })}
              >
                {types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.daysPerYear} days/year)
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Start date</Label>
              <Input
                type="date"
                required
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>End date</Label>
              <Input
                type="date"
                required
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Reason (optional)</Label>
              <Input
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
              />
            </div>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {canApprove ? 'All Leave Requests' : 'My Leave Requests'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6">
              <Skeleton className="h-24 w-full" />
            </div>
          ) : requests.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No leave requests yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    {canApprove && <th className="text-left p-3 font-medium">Employee</th>}
                    <th className="text-left p-3 font-medium">Type</th>
                    <th className="text-left p-3 font-medium">Dates</th>
                    <th className="text-left p-3 font-medium">Days</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    {canApprove && <th className="text-left p-3 font-medium">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.id} className="border-b">
                      {canApprove && (
                        <td className="p-3">
                          {r.employee
                            ? `${r.employee.user.firstName} ${r.employee.user.lastName}`
                            : '—'}
                        </td>
                      )}
                      <td className="p-3">{r.leaveType.name}</td>
                      <td className="p-3">
                        {new Date(r.startDate).toLocaleDateString()} –{' '}
                        {new Date(r.endDate).toLocaleDateString()}
                      </td>
                      <td className="p-3">{r.days}</td>
                      <td className="p-3">
                        <Badge
                          variant={
                            r.status === 'APPROVED'
                              ? 'default'
                              : r.status === 'REJECTED'
                                ? 'warning'
                                : 'outline'
                          }
                        >
                          {r.status}
                        </Badge>
                      </td>
                      {canApprove && (
                        <td className="p-3">
                          {r.status === 'PENDING' && (
                            <div className="flex gap-1 flex-wrap">
                              <Button size="sm" variant="outline" onClick={() => approve(r.id)}>
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setRejectId(r.id)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                          {rejectId === r.id && (
                            <div className="mt-2 flex gap-1">
                              <Input
                                placeholder="Reason"
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className="h-8 text-xs"
                              />
                              <Button size="sm" onClick={() => reject(r.id)}>
                                OK
                              </Button>
                            </div>
                          )}
                        </td>
                      )}
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
