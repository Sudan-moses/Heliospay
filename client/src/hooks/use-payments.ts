import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { type CreatePaymentRequest } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export function usePayments() {
  return useQuery({
    queryKey: [api.payments.list.path],
    queryFn: async () => {
      const res = await fetch(api.payments.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch payments");
      return api.payments.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreatePaymentRequest) => {
      const validated = api.payments.create.input.parse(data);
      const res = await fetch(api.payments.create.path, {
        method: api.payments.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.payments.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to record payment");
      }
      return api.payments.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.payments.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.students.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.students.get.path, variables.studentId] });
      toast({ title: "Success", description: "Payment recorded successfully." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });
}

export function useDeletePayment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/payments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.payments.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.students.list.path] });
      toast({ title: "Payment deleted", description: "The payment has been removed." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete payment.", variant: "destructive" });
    },
  });
}
