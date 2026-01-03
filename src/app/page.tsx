'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="relative z-10 text-center max-w-2xl mx-auto">
        <div className="mb-6">
          <div className="inline-block mb-4">
            <span className="inline-flex items-center bg-white/10 text-white border border-white/30 px-6 py-2 rounded-full text-sm font-medium backdrop-blur-sm">
              <i className="ri-community-line mr-2 text-xl"></i>
              총동아리연합회
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 animate-fade-in">
            환영합니다
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-8">
            동아리 활동에 필요한 모든 서비스를 한 곳에서
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-all transform hover:scale-105 shadow-lg whitespace-nowrap inline-flex items-center justify-center text-lg"
          >
            <i className="ri-login-box-line mr-2 text-xl"></i>
            로그인
          </Link>
          <Link
            href="/register"
            className="bg-white/10 backdrop-blur-sm border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-all transform hover:scale-105 whitespace-nowrap inline-flex items-center justify-center text-lg"
          >
            <i className="ri-user-add-line mr-2 text-xl"></i>
            회원가입
          </Link>
        </div>
        
        <div className="mt-12 text-blue-100 text-sm">
          <p>시설 예약 · 장비 대여 · 공지사항 · 건의사항</p>
        </div>
      </div>
    </div>
  );
}
