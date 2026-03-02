import { useState } from "react";
import { useTeachers, useDeleteTeacher } from "@/hooks/use-teachers";
import { formatCurrency } from "@/lib/utils";
import { type Teacher } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Pencil, Trash2, Info } from "lucide-react";
import { TeacherFormDialog } from "@/components/teacher-form-dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function TeachersPage() {
  const { data: teachers, isLoading } = useTeachers();
  const deleteMutation = useDeleteTeacher();
  const [formOpen, setFormOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [search, setSearch] = useState("");

  const filteredTeachers = teachers?.filter(
    (t) => t.fullName.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormOpen(true);
  };

  const handleFormClose = (open: boolean) => {
    setFormOpen(open);
    if (!open) setEditingTeacher(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground" data-testid="text-teachers-title">Teachers</h1>
          <p className="text-muted-foreground mt-1">Manage teaching staff and their assignments</p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="hover-elevate shadow-lg shadow-teal-500/20 font-semibold bg-gradient-to-r from-teal-600 to-teal-500" data-testid="button-add-teacher">
          <Plus className="mr-2 h-5 w-5" /> Add Teacher
        </Button>
      </div>

      <Card className="shadow-md border-border/50 overflow-hidden">
        <div className="p-4 border-b border-border/50 bg-muted/20">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 bg-background border-border/50 focus-visible:ring-primary/20"
              data-testid="input-search-teachers"
            />
          </div>
        </div>

        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold text-foreground">Name</TableHead>
              <TableHead className="font-semibold text-foreground">Phone</TableHead>
              <TableHead className="font-semibold text-foreground">Subjects</TableHead>
              <TableHead className="font-semibold text-foreground text-right">Net Salary</TableHead>
              <TableHead className="font-semibold text-foreground">Status</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">Loading teachers...</TableCell>
              </TableRow>
            ) : filteredTeachers?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">No teachers found.</TableCell>
              </TableRow>
            ) : (
              filteredTeachers?.map((teacher) => (
                <TableRow key={teacher.id} className="hover:bg-muted/30 transition-colors" data-testid={`row-teacher-${teacher.id}`}>
                  <TableCell className="font-medium text-foreground" data-testid={`text-teacher-name-${teacher.id}`}>
                    {teacher.fullName}
                  </TableCell>
                  <TableCell className="text-muted-foreground" data-testid={`text-teacher-phone-${teacher.id}`}>
                    {teacher.phoneNumber}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" data-testid={`badge-teacher-subjects-${teacher.id}`}>
                      {teacher.subjects.length} {teacher.subjects.length === 1 ? "subject" : "subjects"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold" data-testid={`text-teacher-salary-${teacher.id}`}>
                    {(() => {
                      const netSalary = teacher.baseSalary + teacher.accommodationAllowance + teacher.transportAllowance + teacher.otherAllowances - teacher.deductions;
                      const hasBreakdown = teacher.accommodationAllowance > 0 || teacher.transportAllowance > 0 || teacher.otherAllowances > 0 || teacher.deductions > 0;
                      const salaryDisplay = formatCurrency(netSalary, teacher.currency);

                      if (!hasBreakdown) {
                        return salaryDisplay;
                      }

                      return (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex items-center gap-1 cursor-help">
                                {salaryDisplay}
                                <Info className="h-3.5 w-3.5 text-muted-foreground" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="text-sm">
                              <div className="space-y-1">
                                <div className="flex justify-between gap-4">
                                  <span>Base Salary:</span>
                                  <span>{formatCurrency(teacher.baseSalary, teacher.currency)}</span>
                                </div>
                                {teacher.accommodationAllowance > 0 && (
                                  <div className="flex justify-between gap-4">
                                    <span>Accommodation:</span>
                                    <span>{formatCurrency(teacher.accommodationAllowance, teacher.currency)}</span>
                                  </div>
                                )}
                                {teacher.transportAllowance > 0 && (
                                  <div className="flex justify-between gap-4">
                                    <span>Transport:</span>
                                    <span>{formatCurrency(teacher.transportAllowance, teacher.currency)}</span>
                                  </div>
                                )}
                                {teacher.otherAllowances > 0 && (
                                  <div className="flex justify-between gap-4">
                                    <span>Other Allowances:</span>
                                    <span>{formatCurrency(teacher.otherAllowances, teacher.currency)}</span>
                                  </div>
                                )}
                                {teacher.deductions > 0 && (
                                  <div className="flex justify-between gap-4">
                                    <span>Deductions:</span>
                                    <span>-{formatCurrency(teacher.deductions, teacher.currency)}</span>
                                  </div>
                                )}
                                <div className="border-t border-border pt-1 flex justify-between gap-4 font-semibold">
                                  <span>Net Salary:</span>
                                  <span>{formatCurrency(netSalary, teacher.currency)}</span>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={teacher.status === "Active" ? "default" : "secondary"}
                      data-testid={`badge-teacher-status-${teacher.id}`}
                    >
                      {teacher.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(teacher)}
                        title="Edit Teacher"
                        data-testid={`button-edit-teacher-${teacher.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:text-red-600"
                        onClick={() => deleteMutation.mutate(teacher.id)}
                        disabled={deleteMutation.isPending}
                        title="Delete Teacher"
                        data-testid={`button-delete-teacher-${teacher.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <TeacherFormDialog open={formOpen} onOpenChange={handleFormClose} teacher={editingTeacher} />
    </div>
  );
}
