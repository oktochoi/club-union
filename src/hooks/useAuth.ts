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
    let cancelled = false;

    // 초기 사용자 로드 (세션 복원 대기 포함)
    const loadUser = async () => {
      try {
        const supabase = (await import('@/utils/supabase/client')).createClient();
        
        // 세션이 복원될 때까지 최대 2초 대기
        let sessionRestored = false;
        for (let i = 0; i < 10; i++) {
          if (cancelled) return;
          
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            sessionRestored = true;
            break;
          }
          
          // 200ms씩 대기
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        if (cancelled) return;

        // 세션이 복원되었거나 없으면 사용자 정보 조회
        const currentUser = await getCurrentUser();
        if (!cancelled) {
          setUser(currentUser);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('사용자 로드 오류:', error);
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadUser();

    // 인증 상태 변경 감지
    const { data: { subscription } } = onAuthStateChange((user) => {
      if (!cancelled) {
        setUser(user);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
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

