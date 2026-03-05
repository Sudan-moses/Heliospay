import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertStudentSchema } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateStudent, useUpdateStudent } from "@/hooks/use-students";
import { useFeePresets } from "@/hooks/use-fee-presets";
import { Loader2, Info } from "lucide-react";

const formSchema = insertStudentSchema.extend({
  tuitionFee: z.coerce.number().min(0, "Tuition fee must be positive"),
  currency: z.string().min(1, "Please select a currency"),
});

type FormValues = z.infer<typeof formSchema>;

export function StudentFormDialog({ 
  open, 
  onOpenChange, 
  student = null 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  student?: any;
}) {
  const createMutation = useCreateStudent();
  const updateMutation = useUpdateStudent();
  const { data: feePresets } = useFeePresets();
  const isEditing = !!student;
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      admissionNumber: student?.admissionNumber || "",
      fullName: student?.fullName || "",
      classGrade: student?.classGrade || "",
      academicYear: student?.academicYear || new Date().getFullYear().toString(),
      parentPhoneNumber: student?.parentPhoneNumber || "",
      status: student?.status || "Active",
      tuitionFee: student?.tuitionFee || 0,
      currency: student?.currency || "UGX",
    },
  });

  const watchedClass = form.watch("classGrade");
  const watchedCurrency = form.watch("currency");
  const presetTotal = feePresets
    ?.filter(p => p.classGrade === watchedClass && p.currency === watchedCurrency)
    .reduce((sum, p) => sum + p.amount, 0) || 0;

  const handleClassChange = (value: string, onChange: (v: string) => void) => {
    onChange(value);
    if (!isEditing) {
      const currency = form.getValues("currency");
      const matching = feePresets?.filter(p => p.classGrade === value && p.currency === currency) || [];
      if (matching.length > 0) {
        const total = matching.reduce((sum, p) => sum + p.amount, 0);
        form.setValue("tuitionFee", total);
      }
    }
  };

  const handleCurrencyChange = (value: string, onChange: (v: string) => void) => {
    onChange(value);
    if (!isEditing) {
      const classGrade = form.getValues("classGrade");
      const matching = feePresets?.filter(p => p.classGrade === classGrade && p.currency === value) || [];
      if (matching.length > 0) {
        const total = matching.reduce((sum, p) => sum + p.amount, 0);
        form.setValue("tuitionFee", total);
      }
    }
  };

  const onSubmit = (data: FormValues) => {
    if (isEditing) {
      updateMutation.mutate({ id: student.id, ...data }, {
        onSuccess: () => onOpenChange(false)
      });
    } else {
      createMutation.mutate(data, {
        onSuccess: () => onOpenChange(false)
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-0 shadow-2xl rounded-2xl">
        <div className="px-6 py-6 border-b border-border/50 bg-muted/30">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display">{isEditing ? "Edit Student" : "Add New Student"}</DialogTitle>
            <DialogDescription className="text-base mt-1">
              Enter the student's details and fee expectations.
            </DialogDescription>
          </DialogHeader>
        </div>
        
        <div className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="admissionNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Admission Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. ADM-001" className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="academicYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Academic Year</FormLabel>
                      <FormControl>
                        <Input placeholder="2024/2025" className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter student's full name" className="h-11" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="classGrade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class</FormLabel>
                      <Select onValueChange={(v) => handleClassChange(v, field.onChange)} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select class" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Senior 1">Senior 1</SelectItem>
                          <SelectItem value="Senior 2">Senior 2</SelectItem>
                          <SelectItem value="Senior 3">Senior 3</SelectItem>
                          <SelectItem value="Senior 4">Senior 4</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="parentPhoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Phone number" className="h-11" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tuitionFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected Tuition Fee</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0.00" className="h-11" {...field} data-testid="input-tuition-fee" />
                      </FormControl>
                      {presetTotal > 0 && !isEditing && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Info className="h-3 w-3" />
                          Auto-populated from fee presets. You can override this value.
                        </p>
                      )}
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
                      <Select onValueChange={(v) => handleCurrencyChange(v, field.onChange)} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="UGX">UGX (Shillings)</SelectItem>
                          <SelectItem value="USD">USD (Dollars)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-11 px-6">
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending} className="h-11 px-8 hover-elevate">
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditing ? "Save Changes" : "Add Student"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
