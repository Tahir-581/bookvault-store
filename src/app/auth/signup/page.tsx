"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created! Check your email to confirm.");
    router.push("/auth/login");
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-medium">Create account</h1>
        <form onSubmit={handleSignup} className="mt-6 space-y-4">
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label>Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Create your BookVault account"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-link hover:text-link-hover">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
