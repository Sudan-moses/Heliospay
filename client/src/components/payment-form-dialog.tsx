import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPaymentSchema } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreatePayment } from "@/hooks/use-payments";
import { useStudents } from "@/hooks/use-students";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Plus, X } from "lucide-react";

const BASE_FEE_TYPES = ["Tuition Fee", "Admission Fee", "Uniform Fee", "Boarding Fee", "Transport Fee", "Lab Fee"];
const TERMS = ["Term 1", "Term 2", "Term 3"];
const CLASS_GRADES = ["Senior 1", "Senior 2", "Senior 3", "Senior 4"];

interface FeeItem {
  feeType: string;
  amount: number;
}

const formSchema = insertPaymentSchema.extend({
  amount: z.coerce.number().min(1, "Amount must be at least 1"),
  studentId: z.coerce.number().min(1, "Please select a student"),
  currency: z.string().min(1, "Please select a currency"),
  term: z.string().min(1, "Please select a term"),
  feeType: z.string().min(1, "Please select a fee type"),
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

  const [feeItems, setFeeItems] = useState<FeeItem[]>([{ feeType: "", amount: 0 }]);

  const totalAmount = feeItems.reduce((sum, item) => sum + (item.amount || 0), 0);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      studentId: prefilledStudentId || 0,
      amount: 0,
      currency: students?.find(s => s.id === prefilledStudentId)?.currency || "UGX",
      term: "",
      feeType: "",
      receiptNumber: `REC-${Date.now()}`,
      recordedBy: user?.email || "Unknown",
      notes: "",
    },
  });

  useEffect(() => {
    const firstFeeType = feeItems[0]?.feeType || "";
    const computedFeeType = feeItems.length > 1 && feeItems.filter(i => i.feeType).length > 1 ? "Multiple" : firstFeeType;
    form.setValue("amount", totalAmount);
    form.setValue("feeType", computedFeeType || "");
  }, [feeItems, totalAmount, form]);

  const selectedStudentId = form.watch("studentId");
  const selectedStudent = students?.find(s => s.id === Number(selectedStudentId));
  const isSenior4 = selectedStudent?.classGrade === "Senior 4";
  const availableFeeTypes = isSenior4 ? [...BASE_FEE_TYPES, "SSCSE Fee"] : BASE_FEE_TYPES;

  const addFeeItem = () => {
    setFeeItems(prev => [...prev, { feeType: "", amount: 0 }]);
  };

  const removeFeeItem = (index: number) => {
    setFeeItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateFeeItem = (index: number, field: keyof FeeItem, value: string | number) => {
    setFeeItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      return { ...item, [field]: value };
    }));
  };

  const onSubmit = (data: FormValues) => {
    const feeBreakdown = JSON.stringify(feeItems.filter(i => i.feeType && i.amount > 0));
    createMutation.mutate({ ...data, feeBreakdown }, {
      onSuccess: () => {
        form.reset();
        setFeeItems([{ feeType: "", amount: 0 }]);
        onOpenChange(false);
      }
    });
  };

  const activeStudents = students?.filter(s => s.status === 'Active') || [];

  const studentsByClass = CLASS_GRADES.reduce<Record<string, typeof activeStudents>>((acc, grade) => {
    const studentsInGrade = activeStudents.filter(s => s.classGrade === grade);
    if (studentsInGrade.length > 0) {
      acc[grade] = studentsInGrade;
    }
    return acc;
  }, {});

  useEffect(() => {
    if (!isSenior4) {
      setFeeItems(prev => prev.map(item => 
        item.feeType === "SSCSE Fee" ? { ...item, feeType: "" } : item
      ));
    }
  }, [isSenior4]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-0 shadow-2xl rounded-2xl">
        <div className="px-6 py-6 border-b border-border/50 bg-primary text-primary-foreground">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display text-white">Record Payment</DialogTitle>
            <DialogDescription className="text-primary-foreground/80 mt-1">
              Log a new transaction and generate a receipt.
            </DialogDescription>
          </DialogHeader>
        </div>
        
        <div className="p-6 max-h-[70vh] overflow-y-auto">
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
                        if (student) {
                          form.setValue('currency', student.currency);
                        }
                      }}
                      defaultValue={field.value ? String(field.value) : undefined}
                      disabled={!!prefilledStudentId}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11" data-testid="select-student">
                          <SelectValue placeholder="Search and select student..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(studentsByClass).map(([grade, studentsInGrade]) => (
                          <SelectGroup key={grade}>
                            <SelectLabel data-testid={`select-group-label-${grade.replace(/\s+/g, '-').toLowerCase()}`}>{grade}</SelectLabel>
                            {studentsInGrade.map((s) => (
                              <SelectItem key={s.id} value={String(s.id)} data-testid={`select-student-option-${s.id}`}>
                                {s.fullName} ({s.admissionNumber})
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="term"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Term</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11" data-testid="select-term">
                          <SelectValue placeholder="Select term" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TERMS.map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <FormLabel>Fee Items</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addFeeItem}
                    data-testid="button-add-fee-item"
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Add Fee
                  </Button>
                </div>

                {feeItems.map((item, index) => (
                  <div key={index} className="flex items-start gap-2" data-testid={`fee-item-row-${index}`}>
                    <div className="flex-1">
                      <Select
                        value={item.feeType}
                        onValueChange={(val) => updateFeeItem(index, "feeType", val)}
                      >
                        <SelectTrigger className="h-11" data-testid={`select-fee-type-${index}`}>
                          <SelectValue placeholder="Select fee type" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableFeeTypes.map(ft => (
                            <SelectItem key={ft} value={ft}>{ft}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-32">
                      <Input
                        type="number"
                        placeholder="0"
                        className="h-11"
                        value={item.amount || ""}
                        onChange={(e) => updateFeeItem(index, "amount", Number(e.target.value))}
                        data-testid={`input-fee-amount-${index}`}
                      />
                    </div>
                    {feeItems.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFeeItem(index)}
                        data-testid={`button-remove-fee-item-${index}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}

                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <span className="text-sm font-medium text-muted-foreground">Total Amount</span>
                  <span className="text-lg font-bold" data-testid="text-total-amount">
                    {form.watch("currency")} {totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              <input type="hidden" {...form.register("amount")} />
              <input type="hidden" {...form.register("feeType")} />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11" data-testid="select-currency">
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

              <FormField
                control={form.control}
                name="receiptNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Receipt Number</FormLabel>
                    <FormControl>
                      <Input className="h-11 bg-muted font-mono text-sm" readOnly {...field} data-testid="input-receipt-number" />
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
                      <Textarea placeholder="Optional details about this payment..." className="resize-none" {...field} value={field.value ?? ""} data-testid="input-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-4 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-payment">
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending} className="hover-elevate bg-gradient-to-r from-primary to-primary/90" data-testid="button-confirm-payment">
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
