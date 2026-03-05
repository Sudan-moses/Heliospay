import { useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertNonTeachingStaffSchema, type NonTeachingStaff } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateNonTeachingStaff, useUpdateNonTeachingStaff } from "@/hooks/use-non-teaching-staff";
import { Loader2 } from "lucide-react";

const formSchema = insertNonTeachingStaffSchema.extend({
  fullName: z.string().min(1, "Full name is required"),
  position: z.string().min(1, "Position is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  baseSalary: z.coerce.number().min(0, "Salary must be positive"),
  accommodationAllowance: z.coerce.number().min(0).optional(),
  transportAllowance: z.coerce.number().min(0).optional(),
  otherAllowances: z.coerce.number().min(0).optional(),
  deductions: z.coerce.number().min(0).optional(),
  deductionNotes: z.string().optional(),
  currency: z.string().min(1, "Please select a currency"),
  contractType: z.string().min(1, "Please select a contract type"),
}).omit({ status: true });

type FormValues = z.infer<typeof formSchema>;

export function NonTeachingStaffFormDialog({
  open,
  onOpenChange,
  staff = null,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff?: NonTeachingStaff | null;
}) {
  const createMutation = useCreateNonTeachingStaff();
  const updateMutation = useUpdateNonTeachingStaff();
  const isEditing = !!staff;
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      position: "",
      phoneNumber: "",
      baseSalary: 0,
      currency: "UGX",
      contractType: "Permanent",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        fullName: staff?.fullName || "",
        position: staff?.position || "",
        phoneNumber: staff?.phoneNumber || "",
        baseSalary: staff?.baseSalary || 0,
        accommodationAllowance: (staff as any)?.accommodationAllowance || 0,
        transportAllowance: (staff as any)?.transportAllowance || 0,
        otherAllowances: (staff as any)?.otherAllowances || 0,
        deductions: (staff as any)?.deductions || 0,
        deductionNotes: (staff as any)?.deductionNotes || "",
        currency: staff?.currency || "UGX",
        contractType: staff?.contractType || "Permanent",
      });
    }
  }, [open, staff]);

  const onSubmit = (data: FormValues) => {
    const payload = {
      ...data,
      status: staff?.status || "Active",
    };

    if (isEditing) {
      updateMutation.mutate({ id: staff.id, ...payload }, {
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
              {isEditing ? "Edit Staff Member" : "Add Non-Teaching Staff"}
            </DialogTitle>
            <DialogDescription className="text-white/80 mt-1">
              {isEditing ? "Update staff member details." : "Enter the staff member's information."}
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
                      <Input placeholder="Enter full name" className="h-11" data-testid="input-nts-name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Cook, Security Guard, Nurse" className="h-11" data-testid="input-nts-position" {...field} />
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
                      <Input placeholder="Enter phone number" className="h-11" data-testid="input-nts-phone" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="baseSalary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base Salary</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" className="h-11 text-lg font-bold" data-testid="input-nts-salary" {...field} />
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
                          <SelectTrigger className="h-11" data-testid="select-nts-currency">
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
                        <Input type="number" placeholder="0" className="h-11" data-testid="input-nts-accommodation" {...field} />
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
                        <Input type="number" placeholder="0" className="h-11" data-testid="input-nts-transport" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="otherAllowances"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Other Allowances</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" className="h-11" data-testid="input-nts-other-allowances" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="deductions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deductions</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" className="h-11" data-testid="input-nts-deductions" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="deductionNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deduction Notes</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Tax, Insurance" className="h-11" data-testid="input-nts-deduction-notes" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="contractType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11" data-testid="select-nts-contract">
                          <SelectValue placeholder="Select contract type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Permanent">Permanent</SelectItem>
                        <SelectItem value="Contract">Contract</SelectItem>
                        <SelectItem value="Part-time">Part-time</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-4 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-nts">
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending} className="bg-gradient-to-r from-teal-600 to-teal-500" data-testid="button-submit-nts">
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditing ? "Save Changes" : "Add Staff Member"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
