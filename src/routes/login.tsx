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
  const [email, setEmail] = React.useState("maria@salescrm.app");
  const [password, setPassword] = React.useState("demo");
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
    if (!email) return;
    setLoading(true);
    setError(null);
    setSyncMessage(null);
    try {
      await store.loginWithPassword(email, password);
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
          <CardTitle>Sign in to SalesCRM</CardTitle>
          <CardDescription>Warm cockpit for cargo sales teams.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="flex flex-wrap gap-2 text-xs">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEmail("maria@salescrm.app")}
              >
                Maria Lopez
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEmail("juan@salescrm.app")}
              >
                Juan Smith
              </Button>
            </div>
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
              />
            </div>
            {error && <div className="text-xs text-destructive">{error}</div>}
            {syncMessage && <div className="text-xs text-muted-foreground">{syncMessage}</div>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Connecting..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
