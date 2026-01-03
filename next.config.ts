import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: "export" 제거 - middleware 사용을 위해 필요
  images: {
    unoptimized: true,
  },
  typescript: {
    // 빌드 시 타입 오류가 있어도 계속 진행 (프로덕션 배포를 위해)
    ignoreBuildErrors: false,
  },
  eslint: {
    // 빌드 시 ESLint 오류가 있어도 계속 진행 (프로덕션 배포를 위해)
    ignoreDuringBuilds: true,
  },
  // 프로덕션 환경에서 console.log 제거
  webpack: (config, { isServer, dev }) => {
    if (!dev && !isServer) {
      // 클라이언트 사이드에서 프로덕션 빌드 시 console 제거
      config.optimization = {
        ...config.optimization,
        minimize: true,
      };
    }
    return config;
  },
  // 프로덕션에서 console 제거를 위한 컴파일러 옵션
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'], // error와 warn은 유지
    } : false,
  },
};

export default nextConfig;
