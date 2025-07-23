import type { NextConfig } from "next";
import path from "path";

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
        maxSize: 250000, // 250KB
        cacheGroups: {
          // 将 Authing 相关库单独分包
          authing: {
            name: 'authing',
            test: /[\\/]node_modules[\\/](@authing|authing-js-sdk)[\\/]/,
            chunks: 'all',
            priority: 20,
            maxSize: 500000, // 500KB for authing
          },
          // 将 UI 组件库单独分包
          ui: {
            name: 'ui',
            test: /[\\/]node_modules[\\/](@radix-ui|lucide-react)[\\/]/,
            chunks: 'all',
            priority: 15,
            maxSize: 300000, // 300KB for UI
          },
          // 将 React 相关库单独分包
          react: {
            name: 'react',
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            chunks: 'all',
            priority: 10,
            maxSize: 200000, // 200KB for React
          },
          // 将 Next.js 相关库单独分包
          next: {
            name: 'next',
            test: /[\\/]node_modules[\\/](next)[\\/]/,
            chunks: 'all',
            priority: 5,
            maxSize: 400000, // 400KB for Next.js
          },
          // 将大型库单独分包
          vendors: {
            name: 'vendors',
            test: /[\\/]node_modules[\\/]/,
            chunks: 'all',
            priority: -10,
            maxSize: 200000, // 200KB for other vendors
          },
          // 默认分包
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
            maxSize: 100000, // 100KB for default
          },
        },
      },
    };

    // 优化缓存配置
    config.cache = {
      type: 'filesystem',
      buildDependencies: {
        config: [__filename],
      },
      cacheDirectory: path.resolve(process.cwd(), '.next/cache/webpack'),
      maxMemoryGenerations: 1, // 减少内存使用
    };

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
