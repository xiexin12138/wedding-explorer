"use client";

import AuthingGuard from "@/components/AuthingGuard";

export default function LoginPage() {
  return (
    <div className="h-screen w-screen flex justify-center items-center bg-stone-100 p-4">
      <AuthingGuard />
    </div>
  );
}
