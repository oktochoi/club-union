import { createClient } from '@/utils/supabase/client';
import type { User } from '@/types/user';

/**
 * 인증 상태 변경 감지
 */
export function onAuthStateChange(callback: (user: User | null) => void) {
  const supabase = createClient();
  
  // 세션 복원을 기다린 후 현재 세션 확인 (재시도 로직 포함)
  const checkSessionWithRetry = async (retryCount = 0, maxRetries = 5) => {
    try {
      // 세션이 복원될 때까지 대기 (첫 시도가 아닐 때만)
      if (retryCount > 0) {
        await new Promise(resolve => setTimeout(resolve, 300 * retryCount));
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        if (process.env.NODE_ENV === 'development') {
          console.error('세션 조회 오류:', sessionError);
        }
        // 재시도
        if (retryCount < maxRetries) {
          return checkSessionWithRetry(retryCount + 1, maxRetries);
        }
        callback(null);
        return;
      }

      if (!session?.user) {
        // 세션이 없으면 재시도 (세션이 아직 복원 중일 수 있음)
        if (retryCount < maxRetries) {
          return checkSessionWithRetry(retryCount + 1, maxRetries);
        }
        callback(null);
        return;
      }

      // users 테이블에서 사용자 정보 조회
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('onAuthStateChange - users 테이블 조회 오류:', error);
          console.error('에러 코드:', error.code);
          console.error('에러 메시지:', error.message);
        }
        // RLS 오류인 경우 재시도
        if ((error.code === 'PGRST116' || error.message.includes('permission denied') || error.message.includes('406')) && retryCount < maxRetries) {
          return checkSessionWithRetry(retryCount + 1, maxRetries);
        }
        callback(null);
      } else {
        callback(userData || null);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('onAuthStateChange - 예외 발생:', error);
      }
      // 재시도
      if (retryCount < maxRetries) {
        return checkSessionWithRetry(retryCount + 1, maxRetries);
      }
      callback(null);
    }
  };

  checkSessionWithRetry();
  
  // 인증 상태 변경 감지
  return supabase.auth.onAuthStateChange(async (event, session) => {
    // 비밀번호 변경 요구 이벤트 무시
    if (event === 'PASSWORD_RECOVERY' || event === 'TOKEN_REFRESHED') {
      // 비밀번호 변경 요구는 무시하고 계속 진행
    }
    
    if (!session?.user) {
      callback(null);
      return;
    }

    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle(); // .single() 대신 .maybeSingle() 사용

      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('users 테이블 조회 오류:', error);
          console.error('에러 코드:', error.code);
          console.error('에러 메시지:', error.message);
        }
        callback(null);
      } else {
        callback(userData || null);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('인증 상태 변경 처리 오류:', error);
      }
      callback(null);
    }
  });
}

/**
 * 세션 확인
 */
export async function getSession() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * 현재 사용자 확인 (클라이언트 사이드)
 */
export async function getCurrentAuthUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

