'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Loading from './ui/Loading';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@/types/user';

interface AuthCheckProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
}

export default function AuthCheck({
  children,
  requireAuth = true,
  requireAdmin = false,
}: AuthCheckProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      const supabase = createClient();
      const maxRetries = 5;
      let retryCount = 0;

      while (retryCount < maxRetries && !cancelled) {
        try {
          // 세션이 복원될 때까지 대기 (첫 시도가 아닐 때만)
          if (retryCount > 0) {
            await new Promise(resolve => setTimeout(resolve, 300 * retryCount));
          }

          // 1️⃣ 세션 확정
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();

          if (sessionError) {
            if (process.env.NODE_ENV === 'development') {
              console.warn(`세션 조회 오류 (시도 ${retryCount + 1}/${maxRetries}):`, sessionError);
            }
            retryCount++;
            continue;
          }

          if (!session?.user) {
            // 세션이 없으면 재시도 (세션이 아직 복원 중일 수 있음)
            if (retryCount < maxRetries - 1) {
              retryCount++;
              continue;
            }
            setLoading(false);
            if (requireAuth) router.replace('/login');
            return;
          }

          // 2️⃣ 프로필 조회 (재시도 포함)
          const { data: profile, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (cancelled) return;

          // error가 null이 아니면 실제 에러
          if (error) {
            // RLS 정책 오류나 일시적 오류인 경우 재시도
            if ((error.code === 'PGRST116' || error.message.includes('permission denied') || error.message.includes('406')) && retryCount < maxRetries - 1) {
              if (process.env.NODE_ENV === 'development') {
                console.warn(`프로필 조회 오류 (시도 ${retryCount + 1}/${maxRetries}), 재시도 중...:`, error.message);
              }
              retryCount++;
              continue;
            }
            
            console.error('Profile fetch error:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            setLoading(false);
            router.replace('/login');
            return;
          }

          // profile이 null이면 재시도 (트리거가 아직 실행되지 않았을 수 있음)
          if (!profile) {
            if (retryCount < maxRetries - 1) {
              if (process.env.NODE_ENV === 'development') {
                console.warn(`프로필 없음 (시도 ${retryCount + 1}/${maxRetries}), 재시도 중... User ID:`, session.user.id);
              }
              retryCount++;
              continue;
            }
            
            // 최대 재시도 후에도 없으면 에러
            console.error('❌ users 테이블에 레코드가 없습니다. User ID:', session.user.id);
            console.error('⚠️ 트리거 함수가 실행되지 않았거나 백필이 필요합니다.');
            setLoading(false);
            alert('사용자 정보를 찾을 수 없습니다. 관리자에게 문의하세요.\n\n트리거 함수가 실행되지 않았거나 백필이 필요할 수 있습니다.');
            router.replace('/login');
            return;
          }

          // 3️⃣ 권한 체크
          if (requireAdmin && profile.role !== 'admin') {
            setLoading(false);
            router.replace('/');
            return;
          }

          setUser(profile);
          setLoading(false);
          return; // 성공 시 루프 종료

        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error(`인증 확인 오류 (시도 ${retryCount + 1}/${maxRetries}):`, error);
          }
          retryCount++;
          
          if (retryCount >= maxRetries) {
            setLoading(false);
            if (requireAuth) router.replace('/login');
            return;
          }
        }
      }
    };

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, [requireAuth, requireAdmin, router]);

  if (loading) {
    return <Loading fullScreen text="로딩 중..." />;
  }

  if (requireAuth && !user) return null;
  if (requireAdmin && user?.role !== 'admin') return null;

  return <>{children}</>;
}
