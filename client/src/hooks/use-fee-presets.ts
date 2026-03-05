import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { FeePreset, InsertFeePreset } from "@shared/schema";

export function useFeePresets(classGrade?: string, currency?: string) {
  const params = new URLSearchParams();
  if (classGrade) params.set("classGrade", classGrade);
  if (currency) params.set("currency", currency);
  const qs = params.toString();

  return useQuery<FeePreset[]>({
    queryKey: ["/api/fee-presets", classGrade, currency],
    queryFn: async () => {
      const res = await fetch(`/api/fee-presets${qs ? `?${qs}` : ""}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch fee presets");
      return res.json();
    },
  });
}

export function useCreateFeePreset() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertFeePreset) => {
      const res = await apiRequest("POST", "/api/fee-presets", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fee-presets"] });
      toast({ title: "Success", description: "Fee preset created." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateFeePreset() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<InsertFeePreset>) => {
      const res = await apiRequest("PUT", `/api/fee-presets/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fee-presets"] });
      toast({ title: "Success", description: "Fee preset updated." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteFeePreset() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/fee-presets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fee-presets"] });
      toast({ title: "Success", description: "Fee preset deleted." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}
