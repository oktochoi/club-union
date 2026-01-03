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
};

export default nextConfig;
