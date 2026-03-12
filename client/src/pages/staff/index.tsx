import { useState } from "react";
import { useTeachers, useDeleteTeacher } from "@/hooks/use-teachers";
import { useNonTeachingStaff, useDeleteNonTeachingStaff } from "@/hooks/use-non-teaching-staff";
import { useAuth } from "@/hooks/use-auth";
import { useBranding } from "@/hooks/use-branding";
import { formatCurrency } from "@/lib/utils";
import { type Teacher, type NonTeachingStaff } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Pencil, Trash2, Info, Eye, FileDown } from "lucide-react";
import { Link } from "wouter";
import { TeacherFormDialog } from "@/components/teacher-form-dialog";
import { NonTeachingStaffFormDialog } from "@/components/non-teaching-staff-form-dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { generateTeachingStaffPDF, generateNonTeachingStaffPDF } from "@/lib/pdf-reports";

function TeachingStaffTab({ canEdit, branding }: { canEdit: boolean; branding?: any }) {
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

  const handleExportPDF = () => {
    if (!teachers || teachers.length === 0) return;
    generateTeachingStaffPDF(teachers, branding);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search teachers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 bg-background rounded-xl border-border/40 focus-visible:ring-primary/20"
            data-testid="input-search-teachers"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            disabled={!teachers || teachers.length === 0}
            className="rounded-xl"
            data-testid="button-export-teaching-staff-pdf"
          >
            <FileDown className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          {canEdit && (
            <Button onClick={() => setFormOpen(true)} className="rounded-xl font-semibold shadow-sm" data-testid="button-add-teacher">
              <Plus className="mr-2 h-5 w-5" /> Add Teacher
            </Button>
          )}
        </div>
      </div>

      <Card className="shadow-sm rounded-2xl border-border/40 overflow-hidden">
        <div className="divide-y divide-border/30">
          {isLoading ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground">Loading teachers...</div>
          ) : filteredTeachers?.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground">No teachers found.</div>
          ) : (
            filteredTeachers?.map((teacher) => (
              <div key={teacher.id} className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors" data-testid={`row-teacher-${teacher.id}`}>
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                    {teacher.fullName.charAt(0)}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-semibold text-foreground text-sm truncate" data-testid={`text-teacher-name-${teacher.id}`}>{teacher.fullName}</span>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-muted-foreground" data-testid={`text-teacher-phone-${teacher.id}`}>{teacher.phoneNumber}</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <Badge variant="secondary" className="rounded-lg text-[10px] h-5 px-2" data-testid={`badge-teacher-subjects-${teacher.id}`}>
                        {teacher.subjects.length} {teacher.subjects.length === 1 ? "subject" : "subjects"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <span className="text-sm font-semibold text-foreground hidden sm:inline" data-testid={`text-teacher-salary-${teacher.id}`}>
                    {(() => {
                      const netSalary = teacher.baseSalary + teacher.accommodationAllowance + teacher.transportAllowance + teacher.otherAllowances - teacher.deductions;
                      const hasBreakdown = teacher.accommodationAllowance > 0 || teacher.transportAllowance > 0 || teacher.otherAllowances > 0 || teacher.deductions > 0;
                      const salaryDisplay = formatCurrency(netSalary, teacher.currency);

                      if (!hasBreakdown) return salaryDisplay;

                      return (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex items-center gap-1 cursor-help">
                                {salaryDisplay}
                                <Info className="h-3.5 w-3.5 text-muted-foreground" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="text-sm rounded-xl">
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
                  </span>
                  <Badge
                    className={`rounded-full text-xs font-medium px-3 ${teacher.status === "Active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-gray-100 text-gray-600 border border-gray-200"}`}
                    data-testid={`badge-teacher-status-${teacher.id}`}
                  >
                    {teacher.status}
                  </Badge>
                  <div className="flex gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                      title="View Teacher"
                      className="h-8 w-8 rounded-xl"
                      data-testid={`button-view-teacher-${teacher.id}`}
                    >
                      <Link href={`/staff/teacher/${teacher.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    {canEdit && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(teacher)}
                          title="Edit Teacher"
                          className="h-8 w-8 rounded-xl"
                          data-testid={`button-edit-teacher-${teacher.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:text-red-600 h-8 w-8 rounded-xl"
                          onClick={() => deleteMutation.mutate(teacher.id)}
                          disabled={deleteMutation.isPending}
                          title="Delete Teacher"
                          data-testid={`button-delete-teacher-${teacher.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {canEdit && <TeacherFormDialog open={formOpen} onOpenChange={handleFormClose} teacher={editingTeacher} />}
    </div>
  );
}

function NonTeachingStaffTab({ canEdit, branding }: { canEdit: boolean; branding?: any }) {
  const { data: staffList, isLoading } = useNonTeachingStaff();
  const deleteMutation = useDeleteNonTeachingStaff();
  const [formOpen, setFormOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<NonTeachingStaff | null>(null);
  const [search, setSearch] = useState("");

  const filteredStaff = staffList?.filter(
    (s) =>
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.position.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (staff: NonTeachingStaff) => {
    setEditingStaff(staff);
    setFormOpen(true);
  };

  const handleFormClose = (open: boolean) => {
    setFormOpen(open);
    if (!open) setEditingStaff(null);
  };

  const handleExportPDF = () => {
    if (!staffList || staffList.length === 0) return;
    generateNonTeachingStaffPDF(staffList, branding);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or position..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 bg-background rounded-xl border-border/40 focus-visible:ring-primary/20"
            data-testid="input-search-nts"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            disabled={!staffList || staffList.length === 0}
            className="rounded-xl"
            data-testid="button-export-nts-pdf"
          >
            <FileDown className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          {canEdit && (
            <Button onClick={() => setFormOpen(true)} className="rounded-xl font-semibold shadow-sm" data-testid="button-add-nts">
              <Plus className="mr-2 h-5 w-5" /> Add Staff
            </Button>
          )}
        </div>
      </div>

      <Card className="shadow-sm rounded-2xl border-border/40 overflow-hidden">
        <div className="divide-y divide-border/30">
          {isLoading ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground">Loading staff...</div>
          ) : filteredStaff?.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground">No non-teaching staff found.</div>
          ) : (
            filteredStaff?.map((staff) => (
              <div key={staff.id} className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors" data-testid={`row-nts-${staff.id}`}>
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                    {staff.fullName.charAt(0)}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-semibold text-foreground text-sm truncate" data-testid={`text-nts-name-${staff.id}`}>{staff.fullName}</span>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-muted-foreground" data-testid={`text-nts-position-${staff.id}`}>{staff.position}</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground" data-testid={`text-nts-phone-${staff.id}`}>{staff.phoneNumber}</span>
                      <Badge variant="secondary" className="rounded-lg text-[10px] h-5 px-2" data-testid={`badge-nts-contract-${staff.id}`}>
                        {staff.contractType}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <span className="text-sm font-semibold text-foreground hidden sm:inline" data-testid={`text-nts-salary-${staff.id}`}>
                    {formatCurrency(staff.baseSalary, staff.currency)}
                  </span>
                  <Badge
                    className={`rounded-full text-xs font-medium px-3 ${staff.status === "Active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-gray-100 text-gray-600 border border-gray-200"}`}
                    data-testid={`badge-nts-status-${staff.id}`}
                  >
                    {staff.status}
                  </Badge>
                  <div className="flex gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                      title="View Staff"
                      className="h-8 w-8 rounded-xl"
                      data-testid={`button-view-nts-${staff.id}`}
                    >
                      <Link href={`/staff/non-teaching/${staff.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    {canEdit && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(staff)}
                          title="Edit Staff"
                          className="h-8 w-8 rounded-xl"
                          data-testid={`button-edit-nts-${staff.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:text-red-600 h-8 w-8 rounded-xl"
                          onClick={() => deleteMutation.mutate(staff.id)}
                          disabled={deleteMutation.isPending}
                          title="Delete Staff"
                          data-testid={`button-delete-nts-${staff.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {canEdit && <NonTeachingStaffFormDialog open={formOpen} onOpenChange={handleFormClose} staff={editingStaff} />}
    </div>
  );
}

export default function StaffPage() {
  const { user } = useAuth();
  const { data: branding } = useBranding();
  const canEdit = (user as any)?.role !== "Principal";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground" data-testid="text-staff-title">Staff Management</h1>
        <p className="text-muted-foreground mt-1 text-sm">Manage teaching and non-teaching staff</p>
      </div>

      <Tabs defaultValue="teaching" className="w-full">
        <TabsList className="mb-4 rounded-xl bg-muted/60 p-1" data-testid="tabs-staff">
          <TabsTrigger value="teaching" className="rounded-lg" data-testid="tab-teaching-staff">Teaching Staff</TabsTrigger>
          <TabsTrigger value="non-teaching" className="rounded-lg" data-testid="tab-non-teaching-staff">Non-Teaching Staff</TabsTrigger>
        </TabsList>
        <TabsContent value="teaching">
          <TeachingStaffTab canEdit={canEdit} branding={branding} />
        </TabsContent>
        <TabsContent value="non-teaching">
          <NonTeachingStaffTab canEdit={canEdit} branding={branding} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
