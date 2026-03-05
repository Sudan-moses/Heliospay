import { useState } from "react";
import { Link } from "wouter";
import { useStudents, useDeleteStudent } from "@/hooks/use-students";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { StudentFormDialog } from "@/components/student-form-dialog";
import { Search, Plus, MoreVertical, Eye, Edit, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function StudentsPage() {
  const [search, setSearch] = useState("");
  const { data: students, isLoading } = useStudents(search);
  const { user } = useAuth();
  const deleteMutation = useDeleteStudent();
  
  const [formOpen, setFormOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const userRole = (user as any)?.role || "Bursar";
  const canEdit = userRole === "Admin" || userRole === "Bursar";

  const openEdit = (student: any) => {
    setSelectedStudent(student);
    setFormOpen(true);
  };

  const openCreate = () => {
    setSelectedStudent(null);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Students Directory</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage enrollment and financial status</p>
        </div>
        {canEdit && (
          <Button onClick={openCreate} className="rounded-xl font-semibold h-11 px-6 shadow-sm" data-testid="button-add-student">
            <Plus className="mr-2 h-5 w-5" /> Admit Student
          </Button>
        )}
      </div>

      <Card className="shadow-sm rounded-2xl border-border/40 overflow-hidden">
        <div className="p-4 border-b border-border/30 bg-muted/20">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name or admission number..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 bg-background rounded-xl border-border/40 focus-visible:ring-primary/20"
              data-testid="input-search-students"
            />
          </div>
        </div>
        
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold text-foreground text-xs uppercase tracking-wide">Student Details</TableHead>
              <TableHead className="font-semibold text-foreground text-xs uppercase tracking-wide">Class</TableHead>
              <TableHead className="font-semibold text-foreground text-xs uppercase tracking-wide">Status</TableHead>
              <TableHead className="font-semibold text-foreground text-xs uppercase tracking-wide text-right">Tuition Fee</TableHead>
              <TableHead className="font-semibold text-foreground text-xs uppercase tracking-wide text-right">Balance</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">Loading records...</TableCell>
              </TableRow>
            ) : students?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">No students found matching your criteria.</TableCell>
              </TableRow>
            ) : (
              students?.map((student) => (
                <TableRow key={student.id} className="hover:bg-muted/20 transition-colors group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                        {student.fullName.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground text-sm">{student.fullName}</span>
                        <span className="text-xs font-mono text-muted-foreground">{student.admissionNumber}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-medium text-sm">{student.classGrade}</TableCell>
                  <TableCell>
                    <Badge className={`rounded-full text-xs font-medium px-3 ${student.status === 'Active' ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'}`}>
                      {student.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium text-sm">{formatCurrency(student.tuitionFee, student.currency)}</TableCell>
                  <TableCell className="text-right">
                    <span className={`font-bold text-sm ${student.remainingBalance > 0 ? "text-red-500" : "text-emerald-600"}`}>
                      {formatCurrency(student.remainingBalance, student.currency)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[160px] rounded-xl">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
                          <Link href={`/students/${student.id}`} className="flex w-full items-center">
                            <Eye className="mr-2 h-4 w-4 text-muted-foreground" /> View Profile
                          </Link>
                        </DropdownMenuItem>
                        {canEdit && (
                          <>
                            <DropdownMenuItem onClick={() => openEdit(student)} className="cursor-pointer rounded-lg">
                              <Edit className="mr-2 h-4 w-4 text-muted-foreground" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDeleteId(student.id)} className="cursor-pointer text-destructive focus:text-destructive rounded-lg">
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <StudentFormDialog open={formOpen} onOpenChange={setFormOpen} student={selectedStudent} />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl border-0 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-xl">Delete Student Record?</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              This action cannot be undone. This will permanently delete the student and cascade delete all their payment records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="h-11 rounded-xl border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="h-11 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl"
              onClick={() => {
                if (deleteId) deleteMutation.mutate(deleteId);
                setDeleteId(null);
              }}
            >
              Confirm Deletion
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
