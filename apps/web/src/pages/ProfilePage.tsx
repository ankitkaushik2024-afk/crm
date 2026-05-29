import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAppSelector } from '@/store/hooks';
import { ROLE_LABELS } from '@crm/shared';

export function ProfilePage() {
  const user = useAppSelector((s) => s.auth.user);
  const initials = user ? `${user.firstName[0]}${user.lastName[0]}` : 'U';

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Profile</h1>
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-lg bg-primary/10 text-primary">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>
              {user?.firstName} {user?.lastName}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <Badge className="mt-2">
              {user?.role && ROLE_LABELS[user.role as keyof typeof ROLE_LABELS]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Employee ID</p>
              <p className="font-medium">{user?.employeeId || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Company ID</p>
              <p className="font-medium font-mono text-xs">{user?.companyId}</p>
            </div>
          </div>
          <div>
            <p className="text-muted-foreground text-sm mb-2">Permissions ({user?.permissions.length})</p>
            <div className="flex flex-wrap gap-1">
              {user?.permissions.slice(0, 12).map((p) => (
                <Badge key={p} variant="outline" className="text-[10px]">
                  {p}
                </Badge>
              ))}
              {(user?.permissions.length ?? 0) > 12 && (
                <Badge variant="secondary">+{(user?.permissions.length ?? 0) - 12} more</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
