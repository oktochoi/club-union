import { createClient } from '@/utils/supabase/client';
import type { User } from '@/types/user';

/**
 * 인증 상태 변경 감지
 */
export function onAuthStateChange(callback: (user: User | null) => void) {
  const supabase = createClient();
  
  // 즉시 현재 세션 확인 (에러 처리 개선)
  supabase.auth.getSession()
    .then(({ data: { session }, error: sessionError }) => {
      if (sessionError) {
        if (process.env.NODE_ENV === 'development') {
          console.error('세션 조회 오류:', sessionError);
        }
        callback(null);
        return;
      }

      if (!session?.user) {
        callback(null);
        return;
      }

      // users 테이블에서 사용자 정보 조회
      supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle() // .single() 대신 .maybeSingle() 사용 (행이 없어도 에러 발생 안 함)
        .then(({ data: userData, error }) => {
          if (error) {
            if (process.env.NODE_ENV === 'development') {
              console.error('onAuthStateChange - users 테이블 조회 오류:', error);
              console.error('에러 코드:', error.code);
              console.error('에러 메시지:', error.message);
            }
            callback(null);
          } else {
            callback(userData || null);
          }
        })
        .then(undefined, (error) => {
          if (process.env.NODE_ENV === 'development') {
            console.error('onAuthStateChange - 예외 발생:', error);
          }
          callback(null);
        });
    })
    .catch((error) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('getSession 예외 발생:', error);
      }
      callback(null);
    });
  
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

