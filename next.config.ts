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

  // API 路由缓存控制配置
  async headers() {
    return [
      {
        // 针对所有 API 路由禁用缓存
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate, max-age=0',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
          {
            key: 'Surrogate-Control',
            value: 'no-store',
          },
        ],
      },
      // {
      //   // 针对认证相关的 API 路由特别处理
      //   source: '/api/auth/:path*',
      //   headers: [
      //     {
      //       key: 'Cache-Control',
      //       value: 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
      //     },
      //     {
      //       key: 'Pragma',
      //       value: 'no-cache',
      //     },
      //     {
      //       key: 'Expires',
      //       value: '0',
      //     },
      //     {
      //       key: 'Surrogate-Control',
      //       value: 'no-store',
      //     },
      //     {
      //       key: 'X-Content-Type-Options',
      //       value: 'nosniff',
      //     },
      //   ],
      // },
    ];
  },
};

export default nextConfig;
