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
      
      // 1️⃣ 세션 확정
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        setLoading(false);
        if (requireAuth) router.replace('/login');
        return;
      }

      // 2️⃣ 프로필 1회 조회 (반드시 id로)
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle(); // .single() 대신 .maybeSingle() 사용

      if (cancelled) return;

      // error가 null이 아니면 실제 에러 (error가 null이면 에러 없음)
      if (error) {
        console.error('Profile fetch error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        setLoading(false);
        router.replace('/login');
        return;
      }

      // profile이 null이면 users 테이블에 레코드가 없는 경우
      if (!profile) {
        console.error('❌ users 테이블에 레코드가 없습니다. User ID:', session.user.id);
        console.error('⚠️ 트리거 함수가 실행되지 않았거나 백필이 필요합니다.');
        console.error('📝 해결 방법: Supabase Dashboard > SQL Editor에서 다음 파일을 실행하세요:');
        console.error('   - supabase/migrations/009_create_user_trigger.sql (트리거 함수 생성)');
        console.error('   - supabase/migrations/010_create_admin_user_now.sql (admin 사용자 생성)');
        
        // users 테이블에 레코드가 없으면 로그인 페이지로 리다이렉트
        // 임시 사용자 객체로 진행하지 않음 (보안상 위험)
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
