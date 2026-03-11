import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Shareholder, InsertShareholder, PayoutWithShareholder } from "@shared/schema";

export function useShareholders() {
  return useQuery<Shareholder[]>({
    queryKey: ["/api/shareholders"],
  });
}

export function useCreateShareholder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: InsertShareholder) =>
      apiRequest("POST", "/api/shareholders", data).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/shareholders"] }),
  });
}

export function useUpdateShareholder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertShareholder> }) =>
      apiRequest("PUT", `/api/shareholders/${id}`, data).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/shareholders"] }),
  });
}

export function useDeleteShareholder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/shareholders/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/shareholders"] }),
  });
}

export function usePayouts(term: string, academicYear: string, currency: string) {
  return useQuery<PayoutWithShareholder[]>({
    queryKey: ["/api/payouts", term, academicYear, currency],
    queryFn: () =>
      fetch(`/api/payouts?term=${encodeURIComponent(term)}&academicYear=${encodeURIComponent(academicYear)}&currency=${encodeURIComponent(currency)}`)
        .then((r) => r.json()),
    enabled: !!term && !!academicYear && !!currency,
  });
}

export function useCalculatePayouts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { term: string; academicYear: string; currency: string }) =>
      apiRequest("POST", "/api/payouts/calculate", data).then((r) => r.json()),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["/api/payouts", vars.term, vars.academicYear, vars.currency] });
    },
  });
}
