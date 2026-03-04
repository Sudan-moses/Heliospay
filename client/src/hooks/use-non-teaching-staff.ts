import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type NonTeachingStaff, type InsertNonTeachingStaff } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export function useNonTeachingStaff() {
  return useQuery<NonTeachingStaff[]>({
    queryKey: ["/api/non-teaching-staff"],
  });
}

export function useCreateNonTeachingStaff() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertNonTeachingStaff) => {
      const res = await apiRequest("POST", "/api/non-teaching-staff", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/non-teaching-staff"] });
      toast({ title: "Success", description: "Staff member added successfully." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateNonTeachingStaff() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertNonTeachingStaff & { id: number }) => {
      const { id, ...body } = data;
      const res = await apiRequest("PUT", `/api/non-teaching-staff/${id}`, body);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/non-teaching-staff"] });
      toast({ title: "Success", description: "Staff member updated successfully." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteNonTeachingStaff() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/non-teaching-staff/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/non-teaching-staff"] });
      toast({ title: "Deleted", description: "Staff member removed." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}
