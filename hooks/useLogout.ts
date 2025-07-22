import { useUser } from "@/components/UserProvider";

/**
 * 自定义 hook：提供登出功能
 * 可以在任何组件中使用
 * 
 * @example
 * ```tsx
 * import { useLogout } from "@/hooks/useLogout";
 * 
 * function MyComponent() {
 *   const { logout, isLoggingOut } = useLogout();
 *   
 *   return (
 *     <button onClick={logout} disabled={isLoggingOut}>
 *       {isLoggingOut ? "退出中..." : "退出登录"}
 *     </button>
 *   );
 * }
 * ```
 */
export function useLogout() {
  const { logout } = useUser();
  
  // 这里可以添加额外的状态管理，比如 loading 状态
  // 如果需要的话，可以在 UserProvider 中添加 isLoggingOut 状态
  
  return {
    logout,
    // 如果需要 loading 状态，可以在这里添加
    // isLoggingOut: false,
  };
} 