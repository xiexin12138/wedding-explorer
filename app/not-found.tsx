import Link from "next/link";
import { SPECIAL_ROUTES } from "@/lib/routes.config";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            页面找不到啦
          </h2>
          <p className="text-gray-600 mb-8">
            抱歉，您访问的页面不存在或已被移动。
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href={SPECIAL_ROUTES.HOME}
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            返回首页
          </Link>

          <div className="text-sm text-gray-500">
            <p>如果问题持续存在，请检查您的网络连接或稍后再试</p>
          </div>
        </div>
      </div>
    </div>
  );
}
