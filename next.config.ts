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

  // Turbopack 配置（稳定版本）
  turbopack: {
    // 配置 Turbopack 规则
    rules: {
      // 优化包导入
      '*.tsx': {
        loaders: ['typescript'],
        as: '*.js',
      },
    },
    // 配置模块解析
    resolveAlias: {
      // 可以在这里添加路径别名
    },
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

  // Turbopack 特定配置
  webpack: undefined, // 禁用 webpack 配置
};

export default nextConfig;
