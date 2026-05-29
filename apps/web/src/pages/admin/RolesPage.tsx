import { useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { api, getApiErrorMessage } from '@/lib/api';

interface Permission {
  id: string;
  key: string;
  module: string;
}

interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  permissions: Array<{ permission: Permission }>;
  _count?: { users: number };
}

export function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/roles');
        setRoles(res.data.data ?? []);
      } catch (e) {
        toast.error(getApiErrorMessage(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Building2 className="h-7 w-7 text-primary" />
          Roles & Permissions
        </h1>
        <p className="text-muted-foreground">System roles and permission assignments</p>
      </div>

      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {roles.map((role) => (
            <Card key={role.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{role.displayName}</span>
                  <Badge variant="outline">{role._count?.users ?? 0} users</Badge>
                </CardTitle>
                <p className="text-xs text-muted-foreground font-mono">{role.name}</p>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{role.description || '—'}</p>
                <div className="flex flex-wrap gap-1">
                  {role.permissions.slice(0, 12).map((rp) => (
                    <Badge key={rp.permission.id} variant="secondary" className="text-[10px]">
                      {rp.permission.key}
                    </Badge>
                  ))}
                  {role.permissions.length > 12 && (
                    <Badge variant="outline">+{role.permissions.length - 12}</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
