import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/models/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Shield, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";

const roleBadgeStyles: Record<string, string> = {
  Admin: "bg-purple-500/10 text-purple-700 border-purple-200 dark:text-purple-300 dark:border-purple-600",
  Bursar: "bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-300 dark:border-blue-600",
  Principal: "bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-300 dark:border-emerald-600",
  Suspended: "bg-red-500/10 text-red-700 border-red-200 dark:text-red-300 dark:border-red-600",
  Pending: "bg-amber-500/10 text-amber-700 border-amber-200 dark:text-amber-300 dark:border-amber-600",
};

export default function UsersManagement() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const res = await apiRequest("PUT", `/api/users/${id}/role`, { role });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Role updated", description: "User role has been updated successfully." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const pendingUsers = users?.filter(u => u.role === "Pending") || [];
  const sortedUsers = users ? [...users].sort((a, b) => {
    if (a.role === "Pending" && b.role !== "Pending") return -1;
    if (b.role === "Pending" && a.role !== "Pending") return 1;
    return 0;
  }) : [];

  return (
    <div className="space-y-4">
      {pendingUsers.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20" data-testid="card-pending-users">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-amber-800 dark:text-amber-300">
                {pendingUsers.length} Pending Approval{pendingUsers.length > 1 ? "s" : ""}
              </CardTitle>
            </div>
            <CardDescription>
              These users have registered but need role assignment before they can access the system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingUsers.map(u => (
                <div key={u.id} className="flex items-center justify-between gap-3 p-3 bg-white dark:bg-background rounded-lg border border-amber-200 dark:border-amber-800" data-testid={`row-pending-user-${u.id}`}>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={u.profileImageUrl || undefined} />
                      <AvatarFallback className="text-xs font-bold">
                        {u.firstName?.[0] || u.email?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="font-medium text-foreground" data-testid={`text-pending-name-${u.id}`}>
                        {u.firstName || "Unknown"} {u.lastName || ""}
                      </span>
                      <p className="text-xs text-muted-foreground">{u.email || "No email"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => updateRoleMutation.mutate({ id: u.id, role: "Bursar" })}
                      disabled={updateRoleMutation.isPending}
                      data-testid={`button-approve-bursar-${u.id}`}
                    >
                      Approve as Bursar
                    </Button>
                    <Select
                      onValueChange={(role) => updateRoleMutation.mutate({ id: u.id, role })}
                      disabled={updateRoleMutation.isPending}
                    >
                      <SelectTrigger className="w-[140px] h-8" data-testid={`select-approve-role-${u.id}`}>
                        <SelectValue placeholder="Other role..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="Principal">Principal</SelectItem>
                        <SelectItem value="Suspended">Reject</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

    <Card>
      <CardHeader>
        <div className="flex items-center gap-2 flex-wrap">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <CardTitle>User Management</CardTitle>
        </div>
        <CardDescription>
          Manage user roles and access permissions. Assign Admin, Bursar, or Principal roles to control what each user can access.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold text-foreground">User</TableHead>
              <TableHead className="font-semibold text-foreground">Email</TableHead>
              <TableHead className="font-semibold text-foreground">Role</TableHead>
              <TableHead className="font-semibold text-foreground">Joined</TableHead>
              <TableHead className="w-[180px] font-semibold text-foreground">Change Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users?.map((u) => (
                <TableRow key={u.id} className="hover:bg-muted/30 transition-colors" data-testid={`row-user-${u.id}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={u.profileImageUrl || undefined} />
                        <AvatarFallback className="text-xs font-bold">
                          {u.firstName?.[0] || u.email?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-foreground" data-testid={`text-user-name-${u.id}`}>
                        {u.firstName || "Unknown"} {u.lastName || ""}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground" data-testid={`text-user-email-${u.id}`}>
                    {u.email || "N/A"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={roleBadgeStyles[u.role] || ""}
                      data-testid={`badge-user-role-${u.id}`}
                    >
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {u.createdAt ? format(new Date(u.createdAt), "MMM dd, yyyy") : "N/A"}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={u.role}
                      onValueChange={(role) => updateRoleMutation.mutate({ id: u.id, role })}
                      disabled={u.id === currentUser?.id || updateRoleMutation.isPending}
                    >
                      <SelectTrigger data-testid={`select-user-role-${u.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="Bursar">Bursar</SelectItem>
                        <SelectItem value="Principal">Principal</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
    </div>
  );
}
