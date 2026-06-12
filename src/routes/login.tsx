import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { store } from "@/lib/store";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = React.useState<"signin" | "signup">("signin");
  const [name, setName] = React.useState("");
  const [companyName, setCompanyName] = React.useState("");
  const [tenantKey, setTenantKey] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [passwordConfirm, setPasswordConfirm] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [syncMessage, setSyncMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window !== "undefined" && store.getUser()) {
      navigate({ to: "/" });
    }
  }, [navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError(null);
    setSyncMessage(null);
    try {
      if (mode === "signup") {
        if (!name.trim() || !tenantKey.trim()) {
          throw new Error("Name and tenant/company key are required");
        }
        if (password !== passwordConfirm) {
          throw new Error("Passwords do not match");
        }
        await store.signup({
          name: name.trim(),
          email: email.trim(),
          password,
          tenantKey: tenantKey.trim(),
          companyName: companyName.trim() || undefined,
        });
      } else {
        await store.loginWithPassword(email, password);
      }
      const synced = await store.bootstrapFromApi();
      if (!synced) {
        setSyncMessage("Backend API unavailable. Using local demo data.");
      }
      navigate({ to: "/" });
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Unable to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center p-4">
      <Card className="crm-surface w-full max-w-sm overflow-hidden border-white/70">
        <div className="h-2 bg-gradient-to-r from-emerald-400 via-amber-300 to-sky-400" />
        <CardHeader>
          <div className="mb-2 grid size-11 place-content-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground shadow-lg shadow-primary/20">
            C
          </div>
          <CardTitle>
            {mode === "signin" ? "Sign in to SalesCRM" : "Create your SalesCRM account"}
          </CardTitle>
          <CardDescription>
            {mode === "signin"
              ? "Use your company account credentials."
              : "Create a company tenant and your first manager user."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted/60 p-1 text-sm">
              <Button
                type="button"
                variant={mode === "signin" ? "default" : "ghost"}
                size="sm"
                onClick={() => setMode("signin")}
              >
                Sign in
              </Button>
              <Button
                type="button"
                variant={mode === "signup" ? "default" : "ghost"}
                size="sm"
                onClick={() => setMode("signup")}
              >
                Sign up
              </Button>
            </div>
            {mode === "signup" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={mode === "signup"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company name</Label>
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Example Logistics S.A."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tenantKey">Tenant / company key</Label>
                  <Input
                    id="tenantKey"
                    value={tenantKey}
                    onChange={(e) =>
                      setTenantKey(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, "-")
                          .replace(/-+/g, "-"),
                      )
                    }
                    placeholder="example-main"
                    required={mode === "signup"}
                  />
                  <div className="text-xs text-muted-foreground">
                    Lowercase letters, numbers, and hyphens only. This identifies the company
                    tenant.
                  </div>
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={mode === "signup" ? 8 : undefined}
                required
              />
              {mode === "signup" && (
                <div className="text-xs text-muted-foreground">Use at least 8 characters.</div>
              )}
            </div>
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="passwordConfirm">Confirm password</Label>
                <Input
                  id="passwordConfirm"
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  minLength={8}
                  required
                />
              </div>
            )}
            {error && <div className="text-xs text-destructive">{error}</div>}
            {syncMessage && <div className="text-xs text-muted-foreground">{syncMessage}</div>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Connecting..." : mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
