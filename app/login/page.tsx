"use client";

import AuthingGuard from "@/components/AuthingGuard";

export default function LoginPage() {
  return (
    <div className="h-screen w-screen flex justify-center items-center bg-indigo-500">
      <AuthingGuard />
    </div>
  );
}
