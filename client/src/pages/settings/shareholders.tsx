import { useState } from "react";
import { useShareholders, useCreateShareholder, useUpdateShareholder, useDeleteShareholder } from "@/hooks/use-shareholders";
import type { Shareholder } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Users2, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function ShareholderFormDialog({
  open,
  onOpenChange,
  shareholder,
  totalExisting,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  shareholder: Shareholder | null;
  totalExisting: number;
}) {
  const createMutation = useCreateShareholder();
  const updateMutation = useUpdateShareholder();
  const { toast } = useToast();

  const [name, setName] = useState(shareholder?.name || "");
  const [contactInfo, setContactInfo] = useState(shareholder?.contactInfo || "");
  const [sharePercentage, setSharePercentage] = useState(shareholder?.sharePercentage || "");

  const isEditing = !!shareholder;
  const maxAllowed = isEditing
    ? 100 - (totalExisting - parseFloat(shareholder.sharePercentage || "0"))
    : 100 - totalExisting;

  const handleOpen = (v: boolean) => {
    if (!v) {
      setName(shareholder?.name || "");
      setContactInfo(shareholder?.contactInfo || "");
      setSharePercentage(shareholder?.sharePercentage || "");
    }
    onOpenChange(v);
  };

  const handleSubmit = () => {
    const pct = parseFloat(sharePercentage);
    if (!name.trim()) return toast({ title: "Name is required", variant: "destructive" });
    if (isNaN(pct) || pct <= 0 || pct > 100) return toast({ title: "Share percentage must be between 0.01 and 100", variant: "destructive" });
    if (pct > maxAllowed + 0.001) {
      return toast({ title: `Max allowed is ${maxAllowed.toFixed(2)}% to keep total ≤ 100%`, variant: "destructive" });
    }

    const data = { name: name.trim(), contactInfo: contactInfo.trim(), sharePercentage: pct.toString() };

    if (isEditing) {
      updateMutation.mutate({ id: shareholder.id, data }, {
        onSuccess: () => { toast({ title: "Shareholder updated" }); onOpenChange(false); },
        onError: (e: any) => toast({ title: e.message || "Update failed", variant: "destructive" }),
      });
    } else {
      createMutation.mutate(data, {
        onSuccess: () => { toast({ title: "Shareholder added" }); onOpenChange(false); },
        onError: (e: any) => toast({ title: e.message || "Create failed", variant: "destructive" }),
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">{isEditing ? "Edit Shareholder" : "Add Shareholder"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="sh-name">Full Name</Label>
            <Input
              id="sh-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dr. James Opio"
              className="rounded-xl"
              data-testid="input-shareholder-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sh-contact">Contact Information</Label>
            <Input
              id="sh-contact"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              placeholder="Phone or email"
              className="rounded-xl"
              data-testid="input-shareholder-contact"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sh-pct">Share Percentage (%)</Label>
            <Input
              id="sh-pct"
              type="number"
              min={0.01}
              max={maxAllowed}
              step={0.01}
              value={sharePercentage}
              onChange={(e) => setSharePercentage(e.target.value)}
              placeholder={`Max: ${maxAllowed.toFixed(2)}%`}
              className="rounded-xl"
              data-testid="input-shareholder-percentage"
            />
            <p className="text-xs text-muted-foreground">Maximum available: <span className="font-semibold text-primary">{maxAllowed.toFixed(2)}%</span></p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl" data-testid="button-cancel-shareholder">Cancel</Button>
          <Button onClick={handleSubmit} disabled={isPending} className="rounded-xl" data-testid="button-save-shareholder">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Update" : "Add Shareholder"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ShareholdersManagement() {
  const { data: shareholders, isLoading } = useShareholders();
  const deleteMutation = useDeleteShareholder();
  const { toast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [editingShareholder, setEditingShareholder] = useState<Shareholder | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const totalPercentage = shareholders?.reduce((sum, s) => sum + parseFloat(s.sharePercentage || "0"), 0) || 0;
  const remainingPercentage = 100 - totalPercentage;

  const openEdit = (s: Shareholder) => {
    setEditingShareholder(s);
    setFormOpen(true);
  };

  const openCreate = () => {
    setEditingShareholder(null);
    setFormOpen(true);
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    deleteMutation.mutate(deleteId, {
      onSuccess: () => toast({ title: "Shareholder removed" }),
      onError: () => toast({ title: "Failed to remove shareholder", variant: "destructive" }),
    });
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border-border/40 shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between">
          <div className="flex items-center gap-2">
            <Users2 className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="font-display">Shareholder Registry</CardTitle>
              <CardDescription className="mt-1">
                Define shareholders and their ownership percentages. Total must not exceed 100%.
              </CardDescription>
            </div>
          </div>
          <Button onClick={openCreate} disabled={remainingPercentage <= 0} className="rounded-xl shrink-0" data-testid="button-add-shareholder">
            <Plus className="mr-2 h-4 w-4" /> Add Shareholder
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-muted-foreground">Ownership Allocation</span>
              <span className="text-sm font-bold text-foreground">{totalPercentage.toFixed(2)}% / 100%</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${totalPercentage > 99.9 ? "bg-emerald-500" : totalPercentage > 80 ? "bg-amber-400" : "bg-primary"}`}
                style={{ width: `${Math.min(100, totalPercentage)}%` }}
              />
            </div>
            {remainingPercentage > 0.001 && (
              <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                <span><span className="font-semibold text-foreground">{remainingPercentage.toFixed(2)}%</span> unallocated — will become Retained Earnings</span>
              </p>
            )}
          </div>

          {isLoading ? (
            <div className="h-32 flex items-center justify-center text-muted-foreground">Loading shareholders...</div>
          ) : shareholders?.length === 0 ? (
            <div className="h-32 flex flex-col items-center justify-center text-muted-foreground">
              <Users2 className="h-8 w-8 mb-2 opacity-40" />
              <p className="font-medium">No shareholders registered yet.</p>
              <p className="text-xs mt-1">Add shareholders to enable profit distribution.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30 rounded-2xl border border-border/40 overflow-hidden">
              {shareholders?.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors" data-testid={`row-shareholder-${s.id}`}>
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                      {s.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground truncate" data-testid={`text-sh-name-${s.id}`}>{s.name}</p>
                      {s.contactInfo && <p className="text-xs text-muted-foreground truncate" data-testid={`text-sh-contact-${s.id}`}>{s.contactInfo}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <Badge className="rounded-full bg-primary/10 text-primary border border-primary/20 font-bold text-sm px-3" data-testid={`badge-sh-pct-${s.id}`}>
                      {parseFloat(s.sharePercentage).toFixed(2)}%
                    </Badge>
                    <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8" onClick={() => openEdit(s)} data-testid={`button-edit-sh-${s.id}`}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8 hover:text-red-600" onClick={() => setDeleteId(s.id)} data-testid={`button-delete-sh-${s.id}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ShareholderFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        shareholder={editingShareholder}
        totalExisting={totalPercentage}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Shareholder?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the shareholder and all their payout history. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90 rounded-xl">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
