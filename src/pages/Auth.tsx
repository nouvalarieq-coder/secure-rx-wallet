import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2, Pill } from "lucide-react";

const emailSchema = z.string().trim().email("Email tidak valid").max(255);
const pwSchema = z.string().min(6, "Minimal 6 karakter").max(72);
const nameSchema = z.string().trim().min(2, "Minimal 2 karakter").max(80);

export default function Auth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPw, setLoginPw] = useState("");

  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPw, setSignupPw] = useState("");

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const e1 = emailSchema.safeParse(loginEmail);
    const p1 = pwSchema.safeParse(loginPw);
    if (!e1.success) return toast.error(e1.error.issues[0].message);
    if (!p1.success) return toast.error(p1.error.issues[0].message);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPw });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Berhasil masuk");
    navigate("/marketplace");
  };

  const onSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = nameSchema.safeParse(signupName);
    const e1 = emailSchema.safeParse(signupEmail);
    const p1 = pwSchema.safeParse(signupPw);
    if (!n.success) return toast.error(n.error.issues[0].message);
    if (!e1.success) return toast.error(e1.error.issues[0].message);
    if (!p1.success) return toast.error(p1.error.issues[0].message);
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPw,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: signupName },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Akun berhasil dibuat. Selamat datang!");
    navigate("/marketplace");
  };

  const onGoogle = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) { setLoading(false); return toast.error("Gagal sign in Google"); }
    if (result.redirected) return;
    navigate("/marketplace");
  };

  return (
    <Layout>
      <div className="container max-w-md py-16">
        <div className="text-center mb-8">
          <div className="inline-grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-lg-soft">
            <Pill className="h-7 w-7" />
          </div>
          <h1 className="mt-4 font-display text-3xl font-bold">Selamat datang</h1>
          <p className="text-muted-foreground">Masuk atau daftar untuk mulai berbelanja.</p>
        </div>

        <Card className="p-6 shadow-md-soft">
          <Tabs defaultValue="login">
            <TabsList className="grid grid-cols-2 w-full mb-6">
              <TabsTrigger value="login">Masuk</TabsTrigger>
              <TabsTrigger value="signup">Daftar</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={onLogin} className="space-y-4">
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="kamu@email.com" required />
                </div>
                <div>
                  <Label>Password</Label>
                  <Input type="password" value={loginPw} onChange={(e) => setLoginPw(e.target.value)} placeholder="••••••••" required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Masuk
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={onSignup} className="space-y-4">
                <div>
                  <Label>Nama Lengkap</Label>
                  <Input value={signupName} onChange={(e) => setSignupName(e.target.value)} placeholder="Budi Santoso" required />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} placeholder="kamu@email.com" required />
                </div>
                <div>
                  <Label>Password</Label>
                  <Input type="password" value={signupPw} onChange={(e) => setSignupPw(e.target.value)} placeholder="Minimal 6 karakter" required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Buat Akun
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">atau</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button onClick={onGoogle} variant="outline" className="w-full" disabled={loading}>
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path fill="#4285f4" d="M22.5 12.3c0-.8-.1-1.4-.2-2.1H12v3.9h5.9c-.1.9-.7 2.4-2.1 3.4l3.3 2.6c2-1.8 3.4-4.5 3.4-7.8z"/><path fill="#34a853" d="M12 23c2.8 0 5.2-.9 6.9-2.5l-3.3-2.6c-.9.6-2.1 1-3.6 1-2.8 0-5.1-1.8-5.9-4.4l-3.4 2.6C4.4 20.4 7.9 23 12 23z"/><path fill="#fbbc04" d="M6.1 14.5c-.2-.6-.3-1.2-.3-1.9s.1-1.3.3-1.9L2.7 8.1C2 9.5 1.6 11 1.6 12.6s.4 3.1 1.1 4.5l3.4-2.6z"/><path fill="#ea4335" d="M12 6.3c1.6 0 2.7.7 3.3 1.3l2.4-2.4C16.2 3.8 14.4 3 12 3 7.9 3 4.4 5.6 2.7 8.1l3.4 2.6C7 8.1 9.2 6.3 12 6.3z"/></svg>
            Lanjut dengan Google
          </Button>
        </Card>
      </div>
    </Layout>
  );
}
