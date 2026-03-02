import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { type InsertTeacher } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useTeachers() {
  return useQuery({
    queryKey: [api.teachers.list.path],
    queryFn: async () => {
      const res = await fetch(api.teachers.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch teachers");
      return api.teachers.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateTeacher() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertTeacher) => {
      const res = await fetch(api.teachers.create.path, {
        method: api.teachers.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.teachers.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create teacher");
      }
      return api.teachers.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.teachers.list.path] });
      toast({ title: "Success", description: "Teacher added successfully." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateTeacher() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertTeacher & { id: number }) => {
      const { id, ...body } = data;
      const res = await fetch(`/api/teachers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.teachers.update.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to update teacher");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.teachers.list.path] });
      toast({ title: "Success", description: "Teacher updated successfully." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteTeacher() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/teachers/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete teacher");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.teachers.list.path] });
      toast({ title: "Deleted", description: "Teacher removed." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}
