import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBrandingSchema, type InsertBranding } from "@shared/schema";
import { useBranding, useUpdateBranding } from "@/hooks/use-branding";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Save, School, Loader2 } from "lucide-react";
import { useEffect, useCallback } from "react";
import UsersManagement from "./users";

export default function SettingsPage() {
  const { data: branding, isLoading } = useBranding();
  const updateBranding = useUpdateBranding();

  const form = useForm<InsertBranding>({
    resolver: zodResolver(insertBrandingSchema),
    defaultValues: {
      schoolName: "",
      schoolAddress: "",
      logoUrl: null,
    },
  });

  useEffect(() => {
    if (branding) {
      form.reset({
        schoolName: branding.schoolName || "",
        schoolAddress: branding.schoolAddress || "",
        logoUrl: branding.logoUrl || null,
      });
    }
  }, [branding, form]);

  const onSubmit = useCallback((data: InsertBranding) => {
    updateBranding.mutate(data);
  }, [updateBranding]);

  const handleLogoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      form.setError("logoUrl", { message: "Logo file must be under 500KB" });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      form.setValue("logoUrl", reader.result as string);
      form.clearErrors("logoUrl");
    };
    reader.readAsDataURL(file);
  }, [form]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Settings className="h-7 w-7 text-muted-foreground" />
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-7 w-7 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-settings-title">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your school branding, users, and system preferences</p>
        </div>
      </div>

      <Tabs defaultValue="branding" className="w-full">
        <TabsList className="mb-4" data-testid="tabs-settings">
          <TabsTrigger value="branding" data-testid="tab-branding">Branding</TabsTrigger>
          <TabsTrigger value="users" data-testid="tab-users">User Management</TabsTrigger>
        </TabsList>

        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 flex-wrap">
                <School className="h-5 w-5 text-muted-foreground" />
                <CardTitle>School Branding</CardTitle>
              </div>
              <CardDescription>
                Customize your school name, address, and logo. These details appear on receipts and PDF reports.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="schoolName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>School Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter school name"
                            data-testid="input-school-name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="schoolAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>School Address</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter school address"
                            className="resize-none"
                            rows={3}
                            data-testid="input-school-address"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <FormLabel>School Logo</FormLabel>
                    <div className="flex items-start gap-4 flex-wrap">
                      {form.watch("logoUrl") && (
                        <div className="h-16 w-16 rounded-md border flex items-center justify-center overflow-hidden bg-muted">
                          <img
                            src={form.watch("logoUrl")!}
                            alt="School logo preview"
                            className="h-full w-full object-contain"
                            data-testid="img-logo-preview"
                          />
                        </div>
                      )}
                      <div className="flex flex-col gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoChange}
                          className="max-w-xs"
                          data-testid="input-logo-upload"
                        />
                        <p className="text-xs text-muted-foreground">
                          Upload a logo (PNG, JPG). Max 500KB. Recommended: 200x200px.
                        </p>
                        {form.watch("logoUrl") && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => form.setValue("logoUrl", null)}
                            data-testid="button-remove-logo"
                          >
                            Remove logo
                          </Button>
                        )}
                      </div>
                    </div>
                    {form.formState.errors.logoUrl && (
                      <p className="text-sm text-destructive">{form.formState.errors.logoUrl.message}</p>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={updateBranding.isPending}
                      data-testid="button-save-branding"
                    >
                      {updateBranding.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Save Changes
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <UsersManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
