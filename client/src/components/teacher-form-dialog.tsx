import { useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTeacherSchema, type Teacher } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateTeacher, useUpdateTeacher } from "@/hooks/use-teachers";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const formSchema = insertTeacherSchema.extend({
  baseSalary: z.coerce.number().min(0, "Salary must be positive"),
  fullName: z.string().min(1, "Full name is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  subjects: z.string().min(1, "At least one subject is required"),
  currency: z.string().min(1, "Please select a currency"),
  accommodationAllowance: z.coerce.number().min(0),
  transportAllowance: z.coerce.number().min(0),
  otherAllowances: z.coerce.number().min(0),
  deductions: z.coerce.number().min(0),
  deductionNotes: z.string().optional(),
}).omit({ status: true });

type FormValues = z.infer<typeof formSchema>;

export function TeacherFormDialog({
  open,
  onOpenChange,
  teacher = null,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacher?: Teacher | null;
}) {
  const createMutation = useCreateTeacher();
  const updateMutation = useUpdateTeacher();
  const isEditing = !!teacher;
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      phoneNumber: "",
      subjects: "",
      baseSalary: 0,
      currency: "UGX",
      accommodationAllowance: 0,
      transportAllowance: 0,
      otherAllowances: 0,
      deductions: 0,
      deductionNotes: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        fullName: teacher?.fullName || "",
        phoneNumber: teacher?.phoneNumber || "",
        subjects: teacher?.subjects ? teacher.subjects.join(", ") : "",
        baseSalary: teacher?.baseSalary || 0,
        currency: teacher?.currency || "UGX",
        accommodationAllowance: teacher?.accommodationAllowance || 0,
        transportAllowance: teacher?.transportAllowance || 0,
        otherAllowances: teacher?.otherAllowances || 0,
        deductions: teacher?.deductions || 0,
        deductionNotes: teacher?.deductionNotes || "",
      });
    }
  }, [open, teacher]);

  const watchedValues = form.watch();
  const grossSalary = (Number(watchedValues.baseSalary) || 0) +
    (Number(watchedValues.accommodationAllowance) || 0) +
    (Number(watchedValues.transportAllowance) || 0) +
    (Number(watchedValues.otherAllowances) || 0);
  const netSalary = grossSalary - (Number(watchedValues.deductions) || 0);
  const selectedCurrency = watchedValues.currency || "UGX";

  const onSubmit = (data: FormValues) => {
    const subjectsArray = (data.subjects as string).split(",").map((s: string) => s.trim()).filter(Boolean);
    const payload = {
      ...data,
      subjects: subjectsArray,
      status: teacher?.status || "Active",
    };

    if (isEditing) {
      updateMutation.mutate({ id: teacher.id, ...payload }, {
        onSuccess: () => {
          form.reset();
          onOpenChange(false);
        },
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          form.reset();
          onOpenChange(false);
        },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto p-0 overflow-x-hidden border-0 shadow-2xl rounded-2xl">
        <div className="px-6 py-6 border-b border-border/50 bg-teal-600 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display text-white">
              {isEditing ? "Edit Teacher" : "Add New Teacher"}
            </DialogTitle>
            <DialogDescription className="text-white/80 mt-1">
              {isEditing ? "Update teacher details." : "Enter the teacher's information."}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter full name" className="h-11" data-testid="input-teacher-name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter phone number" className="h-11" data-testid="input-teacher-phone" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subjects"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subjects</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Math, English, Science" className="h-11" data-testid="input-teacher-subjects" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-2 pb-1">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Salary & Compensation</h3>
                <div className="mt-2 border-t border-border/50" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="baseSalary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base Salary</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" className="h-11 text-lg font-bold" data-testid="input-teacher-salary" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11" data-testid="select-teacher-currency">
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="UGX">UGX</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="accommodationAllowance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Accommodation Allowance</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" className="h-11" data-testid="input-teacher-accommodation" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="transportAllowance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transport Allowance</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" className="h-11" data-testid="input-teacher-transport" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="otherAllowances"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Other Allowances</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" className="h-11" data-testid="input-teacher-other-allowances" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="deductions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deductions</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" className="h-11" data-testid="input-teacher-deductions" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="deductionNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deduction Notes</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Tax, NSSF, Loan recovery" className="h-11" data-testid="input-teacher-deduction-notes" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="rounded-md bg-muted p-4 space-y-1">
                <div className="flex items-center justify-between gap-4 flex-wrap text-sm">
                  <span className="text-muted-foreground">Gross Salary:</span>
                  <span className="font-semibold" data-testid="text-gross-salary">{formatCurrency(grossSalary, selectedCurrency)}</span>
                </div>
                <div className="flex items-center justify-between gap-4 flex-wrap text-sm">
                  <span className="text-muted-foreground">Net Salary:</span>
                  <span className="font-semibold" data-testid="text-net-salary">{formatCurrency(netSalary, selectedCurrency)}</span>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-teacher">
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending} className="hover-elevate bg-gradient-to-r from-teal-600 to-teal-500" data-testid="button-submit-teacher">
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditing ? "Save Changes" : "Add Teacher"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
