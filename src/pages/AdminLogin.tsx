import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Hardcoded admin bypass (testing/demo)
    if (email.trim() === "admin" && pw === "admin123") {
      localStorage.setItem("admin_session", "1");
      toast.success("Selamat datang, Admin");
      // Hard redirect so AuthProvider re-initializes with admin session
      window.location.href = "/admin";
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pw });
    if (error || !data.user) {
      setLoading(false);
      return toast.error(error?.message || "Gagal masuk");
    }
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleRow) {
      await supabase.auth.signOut();
      setLoading(false);
      return toast.error("Akun ini bukan admin");
    }
    setLoading(false);
    toast.success("Selamat datang, Admin");
    navigate("/admin");
  };

  return (
    <Layout>
      <div className="container max-w-md py-16">
        <div className="text-center mb-8">
          <div className="inline-grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-lg-soft">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="mt-4 font-display text-3xl font-bold">Admin Login</h1>
          <p className="text-muted-foreground">Khusus untuk pengelola MediCryp.</p>
        </div>

        <Card className="p-6 shadow-md-soft">
          <form onSubmit={onLogin} className="space-y-4">
            <div>
              <Label>Email / Username Admin</Label>
              <Input type="text" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Masuk sebagai Admin
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Bukan admin?{" "}
            <Link to="/auth" className="text-primary font-medium hover:underline">
              Masuk sebagai User
            </Link>
          </p>
        </Card>
      </div>
    </Layout>
  );
}
