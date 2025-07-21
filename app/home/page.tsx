import LogoutButton from "@/app/ui/LogoutButton";

/**
 * 仪表板页面 - 现在由布局自动处理认证
 * 无需手动检查登录状态
 */
export default async function HomePage() {
  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">仪表板</h2>
        <p className="text-gray-600 mb-6">
          欢迎使用 Wedding Explorer！您已成功登录。
        </p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">账户操作</h3>
        <LogoutButton />
      </div>
    </div>
  );
}
