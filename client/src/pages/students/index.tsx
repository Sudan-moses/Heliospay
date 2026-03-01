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

  const isBursar = (user as any)?.role === 'bursar';

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
          <h1 className="text-3xl font-display font-bold text-foreground">Students Directory</h1>
          <p className="text-muted-foreground mt-1">Manage enrollment and financial status</p>
        </div>
        {!isBursar && (
          <Button onClick={openCreate} className="hover-elevate shadow-md font-semibold h-11 px-6">
            <Plus className="mr-2 h-5 w-5" /> Add Student
          </Button>
        )}
      </div>

      <Card className="shadow-md border-border/50 overflow-hidden">
        <div className="p-4 border-b border-border/50 bg-muted/20">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Search by name or admission number..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 bg-background border-border/50 focus-visible:ring-primary/20"
            />
          </div>
        </div>
        
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold text-foreground">Student Details</TableHead>
              <TableHead className="font-semibold text-foreground">Class</TableHead>
              <TableHead className="font-semibold text-foreground">Status</TableHead>
              <TableHead className="font-semibold text-foreground text-right">Tuition Fee</TableHead>
              <TableHead className="font-semibold text-foreground text-right">Balance</TableHead>
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
                <TableRow key={student.id} className="hover:bg-muted/30 transition-colors group">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-foreground">{student.fullName}</span>
                      <span className="text-xs font-mono text-muted-foreground">{student.admissionNumber}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-medium">{student.classGrade}</TableCell>
                  <TableCell>
                    <Badge variant={student.status === 'Active' ? 'default' : 'secondary'} className={student.status === 'Active' ? 'bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20' : ''}>
                      {student.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(student.tuitionFee, student.currency)}</TableCell>
                  <TableCell className="text-right">
                    <span className={student.remainingBalance > 0 ? "text-destructive font-bold" : "text-emerald-600 font-bold"}>
                      {formatCurrency(student.remainingBalance, student.currency)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[160px]">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild className="cursor-pointer">
                          <Link href={`/students/${student.id}`} className="flex w-full items-center">
                            <Eye className="mr-2 h-4 w-4 text-muted-foreground" /> View Profile
                          </Link>
                        </DropdownMenuItem>
                        {!isBursar && (
                          <>
                            <DropdownMenuItem onClick={() => openEdit(student)} className="cursor-pointer">
                              <Edit className="mr-2 h-4 w-4 text-muted-foreground" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDeleteId(student.id)} className="cursor-pointer text-destructive focus:text-destructive">
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
            <AlertDialogCancel className="h-11 hover-elevate border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="h-11 bg-destructive hover:bg-destructive/90 text-destructive-foreground hover-elevate"
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
