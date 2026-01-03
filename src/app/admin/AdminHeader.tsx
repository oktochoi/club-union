
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export default function AdminHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      try {
        const { signOutUser } = await import('@/lib/supabase/user');
        await signOutUser();
        router.push('/login');
      } catch (error) {
        console.error('로그아웃 오류:', error);
        router.push('/login');
      }
    }
  };

  const pathname = usePathname();

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <i className="ri-menu-line text-xl"></i>
            </button>
            <Link href="/admin" className="flex items-center ml-2 lg:ml-0">
              <div className="font-['Pacifico'] text-2xl text-red-600">관리자</div>
            </Link>
          </div>

          <nav className="hidden lg:flex space-x-8">
            <Link 
              href="/admin" 
              className={`text-sm font-medium transition-colors whitespace-nowrap ${
                pathname === '/admin' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <i className="ri-dashboard-line mr-2"></i>
              대시보드
            </Link>
            <Link 
              href="/admin/reservations" 
              className={`text-sm font-medium transition-colors whitespace-nowrap ${
                pathname === '/admin/reservations' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <i className="ri-calendar-check-line mr-2"></i>
              예약 관리
            </Link>
            <Link 
              href="/admin/facilities" 
              className={`text-sm font-medium transition-colors whitespace-nowrap ${
                pathname === '/admin/facilities' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <i className="ri-building-line mr-2"></i>
              시설 현황
            </Link>
            <Link 
              href="/admin/rentals" 
              className={`text-sm font-medium transition-colors whitespace-nowrap ${
                pathname === '/admin/rentals' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <i className="ri-box-3-line mr-2"></i>
              물품 관리
            </Link>
            <Link 
              href="/admin/notices" 
              className={`text-sm font-medium transition-colors whitespace-nowrap ${
                pathname === '/admin/notices' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <i className="ri-notification-3-line mr-2"></i>
              공지사항
            </Link>
            <Link 
              href="/admin/suggestions" 
              className={`text-sm font-medium transition-colors whitespace-nowrap ${
                pathname === '/admin/suggestions' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <i className="ri-chat-3-line mr-2"></i>
              건의사항
            </Link>
            <Link 
              href="/admin/users" 
              className={`text-sm font-medium transition-colors whitespace-nowrap ${
                pathname === '/admin/users' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <i className="ri-user-settings-line mr-2"></i>
              사용자 관리
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">관</span>
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-medium text-gray-900">관리자</div>
                <div className="text-xs text-gray-500">총동연 관리자</div>
              </div>
              <div className="relative">
                <button 
                  className="p-1 text-gray-400 hover:text-gray-500"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                >
                  <i className="ri-arrow-down-s-line"></i>
                </button>
                
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-50">
                    <div className="py-1">
                      <Link href="/admin/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <i className="ri-settings-3-line mr-2"></i>
                        시스템 설정
                      </Link>
                      <Link href="/admin/users" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <i className="ri-user-settings-line mr-2"></i>
                        사용자 관리
                      </Link>
                      <Link href="/admin/statistics" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <i className="ri-bar-chart-line mr-2"></i>
                        통계 보기
                      </Link>
                      <hr className="my-1" />
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <i className="ri-logout-box-line mr-2"></i>
                        로그아웃
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="lg:hidden border-t bg-white">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link href="/admin" className="block px-3 py-2 text-base font-medium text-gray-900 hover:text-blue-600 hover:bg-gray-50 rounded-md">
              대시보드
            </Link>
            <Link href="/admin/reservations" className="block px-3 py-2 text-base font-medium text-gray-500 hover:text-blue-600 hover:bg-gray-50 rounded-md">
              예약 관리
            </Link>
            <Link href="/admin/facilities" className="block px-3 py-2 text-base font-medium text-gray-500 hover:text-blue-600 hover:bg-gray-50 rounded-md">
              시설 현황
            </Link>
            <Link href="/admin/rentals" className="block px-3 py-2 text-base font-medium text-gray-500 hover:text-blue-600 hover:bg-gray-50 rounded-md">
              물품 관리
            </Link>
            <Link href="/admin/notices" className="block px-3 py-2 text-base font-medium text-gray-500 hover:text-blue-600 hover:bg-gray-50 rounded-md">
              공지 관리
            </Link>
            <Link href="/admin/suggestions" className="block px-3 py-2 text-base font-medium text-gray-500 hover:text-blue-600 hover:bg-gray-50 rounded-md">
              건의 관리
            </Link>
            <Link href="/admin/users" className="block px-3 py-2 text-base font-medium text-gray-500 hover:text-blue-600 hover:bg-gray-50 rounded-md">
              사용자 관리
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
