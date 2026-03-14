import { useState, useEffect, useRef } from "react";
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCreatePayment } from "@/hooks/use-payments";
import { useStudents } from "@/hooks/use-students";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Plus, X, Info, ChevronsUpDown, Check, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const BASE_FEE_TYPES = ["Tuition Fee", "Admission Fee", "Boarding Fee", "Transport Fee", "Lab Fee"];
const TERMS = ["Term 1", "Term 2", "Term 3"];
const CLASS_OPTIONS = [
  { label: "Senior 1", value: "Senior 1" },
  { label: "Senior 2", value: "Senior 2" },
  { label: "Senior 3", value: "Senior 3" },
  { label: "Senior 4", value: "Senior 4" },
];

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

function generateReceipt() {
  return `REC-${Date.now()}`;
}

export function PaymentFormDialog({
  open,
  onOpenChange,
  prefilledStudentId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefilledStudentId?: number;
}) {
  const { data: students } = useStudents();
  const createMutation = useCreatePayment();
  const { user } = useAuth();

  const userRole = (user as any)?.role || "Staff";
  const userName = (user as any)?.firstName || (user as any)?.email?.split("@")[0] || "Unknown";
  const recordedByLabel = `${userRole} - ${userName}`;

  const [feeItems, setFeeItems] = useState<FeeItem[]>([{ feeType: "", amount: 0 }]);
  const [receiptNum, setReceiptNum] = useState(generateReceipt);
  const [successMessage, setSuccessMessage] = useState(false);

  const [classFilter, setClassFilter] = useState<string>("");
  const [studentPopoverOpen, setStudentPopoverOpen] = useState(false);

  const isPending = createMutation.isPending;
  const totalAmount = feeItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  const hasSSCSE = feeItems.some(i => i.feeType === "SSCSE Fee");
  const isSenior4Class = classFilter === "Senior 4";
  const availableFeeTypes = isSenior4Class ? [...BASE_FEE_TYPES, "SSCSE Fee"] : BASE_FEE_TYPES;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      studentId: prefilledStudentId || 0,
      amount: 0,
      currency: "UGX",
      term: "",
      feeType: "",
      receiptNumber: receiptNum,
      recordedBy: recordedByLabel,
      notes: "",
    },
  });

  const selectedStudentId = form.watch("studentId");
  const selectedStudent = students?.find(s => s.id === Number(selectedStudentId));

  const studentsInClass = students?.filter(
    s => s.status === "Active" && s.classGrade === classFilter
  ) || [];

  useEffect(() => {
    if (open) {
      const fresh = generateReceipt();
      setReceiptNum(fresh);
      form.setValue("receiptNumber", fresh);
      setSuccessMessage(false);
    }
  }, [open]);

  useEffect(() => {
    const firstFeeType = feeItems[0]?.feeType || "";
    const computedFeeType =
      feeItems.length > 1 && feeItems.filter(i => i.feeType).length > 1
        ? "Multiple"
        : firstFeeType;
    form.setValue("amount", totalAmount);
    form.setValue("feeType", computedFeeType || "");
    if (hasSSCSE) {
      form.setValue("currency", "USD");
    }
  }, [feeItems, totalAmount, hasSSCSE]);

  useEffect(() => {
    if (!isSenior4Class) {
      setFeeItems(prev =>
        prev.map(item => (item.feeType === "SSCSE Fee" ? { ...item, feeType: "" } : item))
      );
    }
  }, [isSenior4Class]);

  const handleClassChange = (cls: string) => {
    setClassFilter(cls);
    form.setValue("studentId", 0);
    if (!hasSSCSE) {
      form.setValue("currency", "UGX");
    }
  };

  const resetForNextPayment = (keepDialog = true) => {
    const newReceipt = generateReceipt();
    setReceiptNum(newReceipt);
    setFeeItems([{ feeType: "", amount: 0 }]);
    setClassFilter("");
    setSuccessMessage(false);
    form.reset({
      studentId: prefilledStudentId || 0,
      amount: 0,
      currency: "UGX",
      term: form.getValues("term"),
      feeType: "",
      receiptNumber: newReceipt,
      recordedBy: recordedByLabel,
      notes: "",
    });
    if (!keepDialog) onOpenChange(false);
  };

  const onSubmit = (data: FormValues) => {
    const feeBreakdown = JSON.stringify(feeItems.filter(i => i.feeType && i.amount > 0));
    createMutation.mutate(
      { ...data, feeBreakdown, recordedBy: recordedByLabel },
      {
        onSuccess: () => {
          setSuccessMessage(true);
          const newReceipt = generateReceipt();
          setReceiptNum(newReceipt);
          setFeeItems([{ feeType: "", amount: 0 }]);
          setClassFilter("");
          form.reset({
            studentId: prefilledStudentId || 0,
            amount: 0,
            currency: "UGX",
            term: data.term,
            feeType: "",
            receiptNumber: newReceipt,
            recordedBy: recordedByLabel,
            notes: "",
          });
        },
      }
    );
  };

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
          {successMessage && (
            <div className="flex items-start gap-3 mb-5 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-emerald-700">Payment recorded successfully!</p>
                <p className="text-xs text-emerald-600 mt-0.5">
                  Form is ready for the next payment. Term is preserved.
                </p>
              </div>
              <button
                className="ml-auto text-emerald-500 hover:text-emerald-700"
                onClick={() => setSuccessMessage(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

              {/* Step 1: Class Selector */}
              <FormItem>
                <FormLabel>Step 1 — Select Class</FormLabel>
                <Select
                  value={classFilter}
                  onValueChange={handleClassChange}
                  disabled={!!prefilledStudentId}
                >
                  <SelectTrigger className="h-11" data-testid="select-class-filter">
                    <SelectValue placeholder="Choose a class first…" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASS_OPTIONS.map(c => (
                      <SelectItem key={c.value} value={c.value} data-testid={`class-option-${c.value.replace(/\s+/g, "-").toLowerCase()}`}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>

              {/* Step 2: Student Search (enabled only after class is picked) */}
              <FormField
                control={form.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Step 2 — Search Student</FormLabel>
                    <Popover open={studentPopoverOpen} onOpenChange={setStudentPopoverOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            disabled={!classFilter || !!prefilledStudentId}
                            className={cn(
                              "w-full h-11 justify-between font-normal",
                              !field.value || field.value === 0 ? "text-muted-foreground" : "text-foreground"
                            )}
                            data-testid="button-student-combobox"
                          >
                            {field.value && field.value !== 0
                              ? (() => {
                                  const s = students?.find(s => s.id === Number(field.value));
                                  return s ? `${s.fullName} (${s.admissionNumber})` : "Select student…";
                                })()
                              : classFilter
                              ? `Search among ${studentsInClass.length} student(s) in ${classFilter}…`
                              : "Select a class first"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[440px] p-0" align="start">
                        <Command>
                          <CommandInput
                            placeholder={`Type name or admission no. (${classFilter})…`}
                            data-testid="input-student-search"
                          />
                          <CommandList>
                            <CommandEmpty>No students found in {classFilter}.</CommandEmpty>
                            <CommandGroup heading={classFilter}>
                              {studentsInClass.map(s => (
                                <CommandItem
                                  key={s.id}
                                  value={`${s.fullName} ${s.admissionNumber}`}
                                  onSelect={() => {
                                    field.onChange(s.id);
                                    if (!hasSSCSE) {
                                      form.setValue("currency", s.currency);
                                    }
                                    setStudentPopoverOpen(false);
                                  }}
                                  data-testid={`student-option-${s.id}`}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      Number(field.value) === s.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <span className="font-medium">{s.fullName}</span>
                                  <span className="ml-2 text-xs text-muted-foreground">
                                    {s.admissionNumber}
                                  </span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {selectedStudent && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Balance:{" "}
                        <span className="font-semibold text-foreground">
                          {selectedStudent.currency}{" "}
                          {(selectedStudent as any).remainingBalance?.toLocaleString() ?? "—"}
                        </span>
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Term */}
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

              {/* Fee Items */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <FormLabel>Fee Items</FormLabel>
                  {!hasSSCSE && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFeeItems(prev => [...prev, { feeType: "", amount: 0 }])}
                      data-testid="button-add-fee-item"
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Add Fee
                    </Button>
                  )}
                </div>

                {hasSSCSE && (
                  <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700">
                    <Info className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                      SSCSE fees are collected in <strong>USD</strong> as a pass-through for
                      examination bodies.{" "}
                      <strong>This transaction is excluded from school net profit calculations.</strong>
                    </span>
                  </div>
                )}

                {feeItems.map((item, index) => (
                  <div key={index} className="flex items-start gap-2" data-testid={`fee-item-row-${index}`}>
                    <div className="flex-1">
                      <Select
                        value={item.feeType}
                        onValueChange={(val) => {
                          if (val === "SSCSE Fee") {
                            setFeeItems([{ feeType: "SSCSE Fee", amount: feeItems[index]?.amount || 0 }]);
                          } else {
                            setFeeItems(prev =>
                              prev.map((it, i) => (i === index ? { ...it, feeType: val } : it))
                            );
                          }
                        }}
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
                        onChange={(e) =>
                          setFeeItems(prev =>
                            prev.map((it, i) =>
                              i === index ? { ...it, amount: Number(e.target.value) } : it
                            )
                          )
                        }
                        data-testid={`input-fee-amount-${index}`}
                      />
                    </div>
                    {feeItems.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setFeeItems(prev => prev.filter((_, i) => i !== index))}
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

              {/* Currency */}
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Currency
                      {hasSSCSE && (
                        <span className="ml-2 text-xs text-blue-600 font-normal">
                          (locked to USD for SSCSE)
                        </span>
                      )}
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={hasSSCSE}>
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

              {/* Receipt Number */}
              <FormField
                control={form.control}
                name="receiptNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Receipt Number</FormLabel>
                    <FormControl>
                      <Input
                        className="h-11 bg-muted font-mono text-sm"
                        readOnly
                        {...field}
                        data-testid="input-receipt-number"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
                Recorded by:{" "}
                <span className="font-semibold text-foreground">{recordedByLabel}</span>
              </div>

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes / Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Optional details about this payment…"
                        className="resize-none"
                        {...field}
                        value={field.value ?? ""}
                        data-testid="input-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-4 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => resetForNextPayment(false)}
                  data-testid="button-cancel-payment"
                >
                  Close
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="hover-elevate bg-gradient-to-r from-primary to-primary/90"
                  data-testid="button-confirm-payment"
                >
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
