import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Budget, InsertBudget } from "@shared/schema";

export function useBudgets(term?: string, academicYear?: string) {
  const params = new URLSearchParams();
  if (term) params.set("term", term);
  if (academicYear) params.set("academicYear", academicYear);
  const queryString = params.toString();
  const path = `/api/budgets${queryString ? `?${queryString}` : ""}`;

  return useQuery<Budget[]>({
    queryKey: ["/api/budgets", term, academicYear],
    queryFn: async () => {
      const res = await fetch(path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch budgets");
      return res.json();
    },
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertBudget) => {
      const res = await apiRequest("POST", "/api/budgets", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      toast({ title: "Success", description: "Budget item created successfully." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertBudget> }) => {
      const res = await apiRequest("PUT", `/api/budgets/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      toast({ title: "Success", description: "Budget item updated successfully." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/budgets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      toast({ title: "Deleted", description: "Budget item removed." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useBudgetVsActual(term: string, academicYear: string) {
  return useQuery<{
    category: string;
    currency: string;
    estimated: number;
    actual: number;
    variance: number;
    status: string;
  }[]>({
    queryKey: ["/api/reports/budget-vs-actual", term, academicYear],
    queryFn: async () => {
      const params = new URLSearchParams({ term, academicYear });
      const res = await fetch(`/api/reports/budget-vs-actual?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch budget comparison");
      return res.json();
    },
  });
}
