import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type InsertPayroll, type Payroll, type PayrollWithItems } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function usePayrolls() {
  return useQuery<Payroll[]>({
    queryKey: ["/api/payrolls"],
    queryFn: async () => {
      const res = await fetch("/api/payrolls", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch payrolls");
      return res.json();
    },
  });
}

export function usePayroll(id: number) {
  return useQuery<PayrollWithItems>({
    queryKey: ["/api/payrolls", id],
    queryFn: async () => {
      const res = await fetch(`/api/payrolls/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch payroll");
      return res.json();
    },
    enabled: id > 0,
  });
}

export function useCreatePayroll() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertPayroll) => {
      const res = await fetch("/api/payrolls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Failed to create payroll" }));
        throw new Error(error.message || "Failed to create payroll");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payrolls"] });
      toast({ title: "Success", description: "Payroll generated successfully." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useApprovePayroll() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/payrolls/${id}/approve`, {
        method: "PUT",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to approve payroll");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payrolls"] });
      toast({ title: "Success", description: "Payroll approved successfully." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useRejectPayroll() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/payrolls/${id}/reject`, {
        method: "PUT",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to reject payroll");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payrolls"] });
      toast({ title: "Success", description: "Payroll rejected." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeletePayroll() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/payrolls/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete payroll");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payrolls"] });
      toast({ title: "Deleted", description: "Payroll removed." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}
