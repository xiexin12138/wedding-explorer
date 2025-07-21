"use client";

import AuthingGuard from "@/components/AuthingGuard";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <div className="h-screen w-screen flex justify-center items-center bg-indigo-500">
      <Suspense fallback={<div>加载中...</div>}>
        <AuthingGuard />
      </Suspense>
    </div>
  );
}
