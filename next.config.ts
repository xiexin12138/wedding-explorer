import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 启用实验性功能以优化分包
  experimental: {
    // 启用更细粒度的代码分割
    optimizePackageImports: ['lucide-react', '@radix-ui/react-alert-dialog', '@radix-ui/react-dropdown-menu'],
  },
  
  // 配置 webpack 分包策略
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // 优化分包配置
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          // 将 Authing 相关库单独分包
          authing: {
            name: 'authing',
            test: /[\\/]node_modules[\\/](@authing|authing-js-sdk)[\\/]/,
            chunks: 'all',
            priority: 20,
          },
          // 将 UI 组件库单独分包
          ui: {
            name: 'ui',
            test: /[\\/]node_modules[\\/](@radix-ui|lucide-react)[\\/]/,
            chunks: 'all',
            priority: 15,
          },
          // 将 React 相关库单独分包
          react: {
            name: 'react',
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            chunks: 'all',
            priority: 10,
          },
          // 将 Next.js 相关库单独分包
          next: {
            name: 'next',
            test: /[\\/]node_modules[\\/](next)[\\/]/,
            chunks: 'all',
            priority: 5,
          },
          // 默认分包
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
        },
      },
    };

    // 限制单个 chunk 的大小
    config.optimization.splitChunks.maxSize = 250000; // 250KB

    return config;
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
