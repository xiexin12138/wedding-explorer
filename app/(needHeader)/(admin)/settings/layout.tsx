"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, LucideIcon } from "lucide-react";

interface SettingsLayoutProps {
  children: React.ReactNode;
}

interface Breadcrumb {
  name: string;
  href: string;
  icon?: LucideIcon;
  isLast?: boolean;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const pathname = usePathname();
  
  // 生成面包屑路径
  const generateBreadcrumbs = (): Breadcrumb[] => {
    const paths = pathname.split('/').filter(Boolean);
    const breadcrumbs: Breadcrumb[] = [];

    
    // 构建路径映射
    const pathMap: { [key: string]: string } = {
      'settings': '系统设置',
      'dictionary': '数据字典配置'
    };
    
    let currentPath = '';
    paths.forEach((path, index) => {
      currentPath += `/${path}`;
      const displayName = pathMap[path] || path;
      
      breadcrumbs.push({
        name: displayName,
        href: currentPath,
        isLast: index === paths.length - 1
      });
    });
    
    return breadcrumbs;
  };
  
  const breadcrumbs = generateBreadcrumbs();
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      {/* 面包屑导航 */}
      <div className="bg-white dark:bg-card border-b border-gray-200 dark:border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-2 py-4">
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.href} className="flex items-center">
                {index > 0 && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground mx-2" />
                )}
                {crumb.isLast ? (
                  <span className="text-sm font-medium text-foreground flex items-center">
                    {crumb.icon && <crumb.icon className="h-4 w-4 mr-1" />}
                    {crumb.name}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center transition-colors"
                  >
                    {crumb.icon && <crumb.icon className="h-4 w-4 mr-1" />}
                    {crumb.name}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* 主要内容区域 */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </div>
    </div>
  );
}