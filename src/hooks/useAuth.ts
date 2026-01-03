'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, signOutUser } from '@/lib/supabase/user';
import { onAuthStateChange } from '@/lib/supabase/auth';
import type { User } from '@/types/user';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 초기 사용자 로드
    const loadUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('사용자 로드 오류:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();

    // 인증 상태 변경 감지
    const { data: { subscription } } = onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    try {
      await signOutUser();
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  };

  return {
    user,
    loading,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isPresident: user?.role === 'president',
  };
}

