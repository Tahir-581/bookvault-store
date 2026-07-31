import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <Suspense fallback={<div className="rounded-lg bg-white p-8 shadow-sm">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
