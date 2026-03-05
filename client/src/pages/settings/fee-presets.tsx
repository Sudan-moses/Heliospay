import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertFeePresetSchema } from "@shared/schema";
import { useFeePresets, useCreateFeePreset, useUpdateFeePreset, useDeleteFeePreset } from "@/hooks/use-fee-presets";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Plus, Edit, Trash2, Loader2, DollarSign } from "lucide-react";

const CLASS_GRADES = ["Senior 1", "Senior 2", "Senior 3", "Senior 4"];
const TERMS = ["Term 1", "Term 2", "Term 3"];
const FEE_TYPES = ["Tuition Fee", "Admission Fee", "Uniform Fee", "Boarding Fee", "Transport Fee", "Lab Fee", "SSCSE Fee"];

const formSchema = insertFeePresetSchema.extend({
  amount: z.coerce.number().min(1, "Amount must be at least 1"),
});

type FormValues = z.infer<typeof formSchema>;

export default function FeePresetsManagement() {
  const { data: presets, isLoading } = useFeePresets();
  const createMutation = useCreateFeePreset();
  const updateMutation = useUpdateFeePreset();
  const deleteMutation = useDeleteFeePreset();

  const [formOpen, setFormOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      classGrade: "",
      term: "",
      feeType: "",
      amount: 0,
      currency: "UGX",
    },
  });

  const openCreate = () => {
    setEditingPreset(null);
    form.reset({ classGrade: "", term: "", feeType: "", amount: 0, currency: "UGX" });
    setFormOpen(true);
  };

  const openEdit = (preset: any) => {
    setEditingPreset(preset);
    form.reset({
      classGrade: preset.classGrade,
      term: preset.term,
      feeType: preset.feeType,
      amount: preset.amount,
      currency: preset.currency,
    });
    setFormOpen(true);
  };

  const onSubmit = (data: FormValues) => {
    if (editingPreset) {
      updateMutation.mutate({ id: editingPreset.id, ...data }, {
        onSuccess: () => setFormOpen(false),
      });
    } else {
      createMutation.mutate(data, {
        onSuccess: () => setFormOpen(false),
      });
    }
  };

  const presetsByClass = CLASS_GRADES.map(grade => ({
    grade,
    presets: (presets || []).filter(p => p.classGrade === grade),
    totalUGX: (presets || []).filter(p => p.classGrade === grade && p.currency === "UGX").reduce((s, p) => s + p.amount, 0),
    totalUSD: (presets || []).filter(p => p.classGrade === grade && p.currency === "USD").reduce((s, p) => s + p.amount, 0),
  }));

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-80 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>Fee Structure</CardTitle>
                <CardDescription>
                  Define expected fees per class and term. These presets auto-populate when enrolling new students.
                </CardDescription>
              </div>
            </div>
            <Button onClick={openCreate} data-testid="button-add-fee-preset">
              <Plus className="mr-2 h-4 w-4" /> Add Fee Preset
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {presetsByClass.map(({ grade, presets: classPresets, totalUGX, totalUSD }) => (
            <div key={grade} className="mb-6 last:mb-0" data-testid={`fee-presets-class-${grade.replace(/\s+/g, '-').toLowerCase()}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-foreground">{grade}</h3>
                <div className="flex gap-2">
                  {totalUGX > 0 && (
                    <Badge variant="secondary" data-testid={`badge-total-ugx-${grade.replace(/\s+/g, '-').toLowerCase()}`}>
                      Total: {formatCurrency(totalUGX, "UGX")}
                    </Badge>
                  )}
                  {totalUSD > 0 && (
                    <Badge variant="secondary" data-testid={`badge-total-usd-${grade.replace(/\s+/g, '-').toLowerCase()}`}>
                      Total: {formatCurrency(totalUSD, "USD")}
                    </Badge>
                  )}
                </div>
              </div>
              {classPresets.length === 0 ? (
                <p className="text-sm text-muted-foreground py-3 border-b border-border/50">No fee presets defined for {grade}.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">Term</TableHead>
                      <TableHead className="font-semibold">Fee Type</TableHead>
                      <TableHead className="font-semibold text-right">Amount</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classPresets.map(preset => (
                      <TableRow key={preset.id} data-testid={`row-fee-preset-${preset.id}`}>
                        <TableCell>{preset.term}</TableCell>
                        <TableCell>{preset.feeType}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(preset.amount, preset.currency)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(preset)} data-testid={`button-edit-preset-${preset.id}`}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(preset.id)} data-testid={`button-delete-preset-${preset.id}`}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-0 shadow-2xl rounded-2xl">
          <div className="px-6 py-5 border-b border-border/50 bg-muted/30">
            <DialogHeader>
              <DialogTitle className="text-xl font-display">{editingPreset ? "Edit Fee Preset" : "Add Fee Preset"}</DialogTitle>
              <DialogDescription>Set the expected fee for a class, term, and fee type.</DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="classGrade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11" data-testid="select-preset-class">
                            <SelectValue placeholder="Select class" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CLASS_GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
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
                          <SelectTrigger className="h-11" data-testid="select-preset-term">
                            <SelectValue placeholder="Select term" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TERMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="feeType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fee Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11" data-testid="select-preset-fee-type">
                            <SelectValue placeholder="Select fee type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {FEE_TYPES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
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
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" className="h-11" {...field} data-testid="input-preset-amount" />
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
                            <SelectTrigger className="h-11" data-testid="select-preset-currency">
                              <SelectValue placeholder="Currency" />
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
                <div className="pt-4 flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-preset">
                    {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingPreset ? "Save Changes" : "Add Preset"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl border-0 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-xl">Delete Fee Preset?</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              This will permanently remove this fee preset. Existing student records will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="h-11">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="h-11 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={() => {
                if (deleteId) deleteMutation.mutate(deleteId);
                setDeleteId(null);
              }}
              data-testid="button-confirm-delete-preset"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
