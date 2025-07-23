import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 启用实验性功能以优化分包
  experimental: {
    // 启用更细粒度的代码分割
    optimizePackageImports: [
      'lucide-react', 
      '@radix-ui/react-alert-dialog', 
      '@radix-ui/react-dropdown-menu',
      'vconsole', // 添加 vconsole 优化
    ],
  },
  
  // 配置输出选项
  output: 'standalone',
  
  // 压缩配置
  compress: true,
  
  // 禁用不必要的功能
  poweredByHeader: false,
  
  // 配置图片优化
  images: {
    formats: ['image/webp', 'image/avif'],
  },
};

export default nextConfig;
