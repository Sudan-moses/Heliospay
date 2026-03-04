import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { BrandingSettings, InsertBranding } from "@shared/schema";

export function useBranding() {
  return useQuery<BrandingSettings>({
    queryKey: ["/api/settings/branding"],
  });
}

export function useUpdateBranding() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertBranding) => {
      const res = await apiRequest("PUT", "/api/settings/branding", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/branding"] });
      toast({ title: "Success", description: "Branding settings saved successfully." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}
