
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import NotificationSystem from './NotificationSystem';
import { useAuth } from '@/hooks/useAuth';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      const { signOutUser } = await import('@/lib/supabase/user');
      await signOutUser();
      router.push('/login');
    } catch (error) {
      console.error('로그아웃 오류:', error);
      router.push('/login');
    }
  };

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
            <Link href="/" className="flex items-center ml-2 lg:ml-0">
              <div className="font-['Pacifico'] text-2xl text-blue-600">총동연</div>
            </Link>
          </div>

          <nav className="hidden lg:flex space-x-8">
            <Link href="/" className="text-gray-900 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
              홈
            </Link>
            <Link href="/reservation" className="text-gray-500 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
              예약
            </Link>
            <Link href="/office-hour" className="text-gray-500 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
              오피스아워
            </Link>
            <Link href="/notice" className="text-gray-500 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
              공지
            </Link>
            <Link href="/suggestion" className="text-gray-500 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
              건의
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <NotificationSystem />

            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.name ? user.name.charAt(0) : 'U'}
                </span>
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-medium text-gray-900">
                  {user?.name || '사용자'}
                </div>
                <div className="text-xs text-gray-500">
                  {user?.club_name || '동아리'}
                </div>
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
                      <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <i className="ri-user-line mr-2"></i>
                        프로필
                      </Link>
                      <Link href="/my-reservations" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <i className="ri-calendar-check-line mr-2"></i>
                        내 예약
                      </Link>
                      <Link href="/my-rentals" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <i className="ri-tools-line mr-2"></i>
                        내 대여 내역
                      </Link>
                      <Link href="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <i className="ri-settings-3-line mr-2"></i>
                        설정
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
            <Link href="/" className="block px-3 py-2 text-base font-medium text-gray-900 hover:text-blue-600 hover:bg-gray-50 rounded-md">
              홈
            </Link>
            <Link href="/reservation" className="block px-3 py-2 text-base font-medium text-gray-500 hover:text-blue-600 hover:bg-gray-50 rounded-md">
              예약
            </Link>
            <Link href="/office-hour" className="block px-3 py-2 text-base font-medium text-gray-500 hover:text-blue-600 hover:bg-gray-50 rounded-md">
              오피스아워
            </Link>
            <Link href="/notice" className="block px-3 py-2 text-base font-medium text-gray-500 hover:text-blue-600 hover:bg-gray-50 rounded-md">
              공지
            </Link>
            <Link href="/suggestion" className="block px-3 py-2 text-base font-medium text-gray-500 hover:text-blue-600 hover:bg-gray-50 rounded-md">
              건의
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
