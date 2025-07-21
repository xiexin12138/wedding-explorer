"use client";

import { useGuard } from "@authing/guard-react18";

export default function LogoutButton() {
  const guard = useGuard();

  const handleLogout = () => guard.logout();

  return (
    <button
      onClick={handleLogout}
      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
    >
      退出登录
    </button>
  );
}
