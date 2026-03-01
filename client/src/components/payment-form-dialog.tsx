import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPaymentSchema } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreatePayment } from "@/hooks/use-payments";
import { useStudents } from "@/hooks/use-students";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

const formSchema = insertPaymentSchema.extend({
  amount: z.coerce.number().min(1, "Amount must be at least 1"),
  studentId: z.coerce.number().min(1, "Please select a student"),
  currency: z.string().min(1, "Please select a currency"),
});

type FormValues = z.infer<typeof formSchema>;

export function PaymentFormDialog({ 
  open, 
  onOpenChange,
  prefilledStudentId 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  prefilledStudentId?: number;
}) {
  const { data: students } = useStudents();
  const createMutation = useCreatePayment();
  const { user } = useAuth();
  const isPending = createMutation.isPending;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      studentId: prefilledStudentId || 0,
      amount: 0,
      currency: students?.find(s => s.id === prefilledStudentId)?.currency || "UGX",
      receiptNumber: `REC-${Date.now()}`,
      recordedBy: user?.email || "Unknown",
      notes: "",
    },
  });

  const onSubmit = (data: FormValues) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        form.reset();
        onOpenChange(false);
      }
    });
  };

  const activeStudents = students?.filter(s => s.status === 'Active') || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-0 shadow-2xl rounded-2xl">
        <div className="px-6 py-6 border-b border-border/50 bg-primary text-primary-foreground">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display text-white">Record Payment</DialogTitle>
            <DialogDescription className="text-primary-foreground/80 mt-1">
              Log a new transaction and generate a receipt.
            </DialogDescription>
          </DialogHeader>
        </div>
        
        <div className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Student</FormLabel>
                    <Select 
                      onValueChange={(val) => {
                        field.onChange(val);
                        const student = students?.find(s => s.id === Number(val));
                        if (student) form.setValue('currency', student.currency);
                      }} 
                      defaultValue={field.value ? String(field.value) : undefined}
                      disabled={!!prefilledStudentId}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Search and select student..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activeStudents.map((s) => (
                          <SelectItem key={s.id} value={String(s.id)}>
                            {s.fullName} ({s.admissionNumber})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount Received</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0.00" className="h-11 text-lg font-bold" {...field} />
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
                          <SelectTrigger className="h-11">
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

              <FormField
                control={form.control}
                name="receiptNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Receipt Number</FormLabel>
                    <FormControl>
                      <Input className="h-11 bg-muted font-mono text-sm" readOnly {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes / Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Optional details about this payment..." className="resize-none" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-4 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-11 px-6">
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending} className="h-11 px-8 hover-elevate bg-gradient-to-r from-primary to-primary/90">
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirm Payment
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
