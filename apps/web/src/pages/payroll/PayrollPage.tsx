import { useEffect, useState } from 'react';
import { Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { api, getApiErrorMessage } from '@/lib/api';

interface PayrollRecord {
  id: string;
  month: number;
  year: number;
  baseSalary: number;
  tax: number;
  netSalary: number;
  status: string;
  employee?: {
    employeeCode: string;
    user: { firstName: string; lastName: string };
  };
}

interface SalaryStructure {
  id: string;
  baseSalary: number;
  effectiveFrom: string;
  employee?: {
    employeeCode: string;
    user: { firstName: string; lastName: string };
  };
}

export function PayrollPage() {
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [payrollRes, structRes] = await Promise.all([
          api.get('/payroll', { params: { limit: 50 } }),
          api.get('/payroll/salary-structures'),
        ]);
        setPayrolls(payrollRes.data.data ?? []);
        setStructures(structRes.data.data ?? []);
      } catch (e) {
        toast.error(getApiErrorMessage(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Wallet className="h-7 w-7 text-primary" />
          Payroll
        </h1>
        <p className="text-muted-foreground">Salary structures and monthly payroll records</p>
      </div>

      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Employees with salary</p>
                <p className="text-2xl font-bold">{structures.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Payroll records</p>
                <p className="text-2xl font-bold">{payrolls.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Total net (visible)</p>
                <p className="text-2xl font-bold">
                  ${payrolls.reduce((sum, p) => sum + p.netSalary, 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Salary Structures</CardTitle></CardHeader>
            <CardContent className="p-0">
              {structures.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">No salary structures found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3 font-medium">Employee</th>
                        <th className="text-left p-3 font-medium">Base Salary</th>
                        <th className="text-left p-3 font-medium">Effective From</th>
                      </tr>
                    </thead>
                    <tbody>
                      {structures.map((s) => (
                        <tr key={s.id} className="border-b">
                          <td className="p-3">
                            {s.employee
                              ? `${s.employee.user.firstName} ${s.employee.user.lastName} (${s.employee.employeeCode})`
                              : '—'}
                          </td>
                          <td className="p-3">${s.baseSalary.toLocaleString()}</td>
                          <td className="p-3">{new Date(s.effectiveFrom).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Payroll Records</CardTitle></CardHeader>
            <CardContent className="p-0">
              {payrolls.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">No payroll records yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3 font-medium">Employee</th>
                        <th className="text-left p-3 font-medium">Period</th>
                        <th className="text-left p-3 font-medium">Gross</th>
                        <th className="text-left p-3 font-medium">Tax</th>
                        <th className="text-left p-3 font-medium">Net</th>
                        <th className="text-left p-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payrolls.map((p) => (
                        <tr key={p.id} className="border-b">
                          <td className="p-3">
                            {p.employee
                              ? `${p.employee.user.firstName} ${p.employee.user.lastName}`
                              : '—'}
                          </td>
                          <td className="p-3">{monthNames[p.month - 1]} {p.year}</td>
                          <td className="p-3">${p.baseSalary.toLocaleString()}</td>
                          <td className="p-3">${p.tax.toLocaleString()}</td>
                          <td className="p-3 font-medium">${p.netSalary.toLocaleString()}</td>
                          <td className="p-3"><Badge variant="outline">{p.status}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
