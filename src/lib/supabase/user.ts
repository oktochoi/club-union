import { createClient } from '@/utils/supabase/client';
import type { User, CreateUserInput, UpdateUserInput, UserRole, UserStatus } from '@/types/user';

/**
 * 사용자 회원가입
 */
export async function signUpUser(input: CreateUserInput) {
  try {
    const supabase = createClient();
    // 1. Supabase Auth에 사용자 생성
    // email_redirect_to를 설정하여 이메일 확인을 건너뛸 수 있지만,
    // 개발 환경에서는 Supabase Dashboard에서 직접 확인하는 것을 권장
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          name: input.name,
          club_name: input.club_name,
          role: input.role,
        },
        // 이메일 확인을 건너뛰려면 아래 옵션 사용 (권장하지 않음)
        // emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError) {
      throw new Error(authError.message);
    }

    if (!authData.user) {
      throw new Error('사용자 생성에 실패했습니다.');
    }

    // 2. 트리거 함수가 자동으로 users 테이블에 레코드를 생성하므로
    //    잠시 대기 후 생성된 레코드를 조회
    //    트리거가 실행될 시간을 주기 위해 약간의 지연 (최대 3초까지 재시도)
    let userData = null;
    let userError = null;
    const maxRetries = 6;
    let retryCount = 0;

    while (retryCount < maxRetries && !userData) {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (data) {
        userData = data;
        break;
      }

      if (error) {
        userError = error;
      }

      retryCount++;
    }

    if (userError && !userData) {
      if (process.env.NODE_ENV === 'development') {
        console.error('users 테이블 조회 오류:', userError);
      }
      throw new Error('사용자 정보를 가져올 수 없습니다. 데이터베이스 설정을 확인하세요.');
    }

    if (!userData) {
      // 트리거가 실행되지 않은 경우
      throw new Error('사용자 레코드가 생성되지 않았습니다. 트리거 함수를 확인하세요.');
    }

    // 회원가입 시 추가 정보 업데이트 (트리거가 기본값으로 생성한 레코드 업데이트)
    const { data: updatedUserData, error: updateError } = await supabase
      .from('users')
      .update({
        name: input.name,
        club_name: input.club_name,
        phone_number: input.phone_number,
        role: input.role, // metadata에서 가져온 role로 업데이트
        status: 'pending', // 회원가입 시 기본값: 승인 대기
        updated_at: new Date().toISOString(),
      })
      .eq('id', authData.user.id)
      .select()
      .single();

    if (updateError) {
      console.error('사용자 정보 업데이트 오류:', updateError);
      // 업데이트 실패해도 기본 레코드는 있으므로 계속 진행
      return { user: userData, authUser: authData.user };
    }

    return { user: updatedUserData || userData, authUser: authData.user };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('회원가입 오류:', error);
    }
    
    // 더 명확한 오류 메시지 제공
    if (error instanceof Error) {
      if (error.message.includes('Database error')) {
        throw new Error('데이터베이스 오류가 발생했습니다. 관리자에게 문의하세요.');
      }
      if (error.message.includes('already registered')) {
        throw new Error('이미 등록된 이메일입니다.');
      }
      if (error.message.includes('Invalid email')) {
        throw new Error('유효하지 않은 이메일 주소입니다.');
      }
      if (error.message.includes('Password')) {
        throw new Error('비밀번호는 최소 6자 이상이어야 합니다.');
      }
      throw error;
    }
    
    throw new Error('회원가입에 실패했습니다. 다시 시도해주세요.');
  }
}

/**
 * 사용자 로그인
 */
export async function signInUser(email: string, password: string) {
  try {
    const supabase = createClient();
    
    // 이메일 정규화 (공백 제거, 소문자 변환)
    const normalizedEmail = email.trim().toLowerCase();
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      // 프로덕션 환경에서만 console.error 제거 (개발 환경에서는 유지)
      if (process.env.NODE_ENV === 'development') {
        console.error('Supabase 로그인 오류:', error);
        console.error('오류 코드:', error.status);
        console.error('오류 메시지:', error.message);
      }
      
      // 비밀번호 유출 관련 오류 무시
      if (error.message.includes('password breach') || 
          error.message.includes('compromised') || 
          error.message.includes('유출') ||
          error.message.includes('leak')) {
        // 비밀번호 유출 경고는 무시하고 계속 진행
        // 실제 로그인은 성공했을 수 있으므로 세션 확인
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session) {
          // 세션이 있으면 로그인 성공으로 처리
          // 에러를 무시하고 계속 진행
        } else {
          // 세션이 없으면 실제 로그인 실패
          throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
        }
      }
      
      // 더 친절한 에러 메시지 제공
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('이메일 또는 비밀번호가 올바르지 않습니다. Supabase Dashboard에서 사용자가 생성되었는지 확인하세요.');
      }
      
      if (error.message.includes('Email not confirmed')) {
        // 이메일 확인이 필요한 경우, users 테이블의 status를 확인하여
        // active 상태면 이메일 확인을 건너뛰고 로그인 허용
        const { data: userData } = await supabase
          .from('users')
          .select('status')
          .eq('email', normalizedEmail)
          .single();
        
        if (userData && userData.status === 'active') {
          // users 테이블에서 active이면 이메일 확인을 건너뛰고 계속 진행
          // 하지만 Supabase Auth 자체가 이메일 확인을 요구하므로
          // 여기서는 에러를 던지고, 사용자에게 Dashboard에서 확인하도록 안내
          throw new Error('이메일이 확인되지 않았습니다. Supabase Dashboard > Authentication > Users에서 사용자를 선택하고 "Confirm User" 버튼을 클릭하거나, 사용자 생성 시 "Auto Confirm User" 옵션을 체크하세요. (users 테이블은 이미 active 상태입니다)');
        }
        
        throw new Error('이메일이 확인되지 않았습니다. Supabase Dashboard > Authentication > Users에서 사용자를 선택하고 "Confirm User" 버튼을 클릭하거나, 사용자 생성 시 "Auto Confirm User" 옵션을 체크하세요.');
      }
      
      // 비밀번호 유출 경고가 아닌 경우에만 에러 던지기
      if (!error.message.includes('password breach') && 
          !error.message.includes('compromised') && 
          !error.message.includes('유출') &&
          !error.message.includes('leak') &&
          !error.message.includes('breach')) {
        throw new Error(error.message);
      }
    }

    // 비밀번호 유출 경고가 있었지만 세션이 있는 경우 처리
    let authUser = data?.user;
    if (!authUser && error?.message?.includes('breach')) {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user) {
        authUser = sessionData.session.user;
      }
    }

    if (!authUser) {
      throw new Error('로그인에 실패했습니다.');
    }

    // 비밀번호 변경 요구가 있는 경우 무시 (Supabase Auth의 기본 동작)
    // app_metadata에서 비밀번호 변경 요구 확인
    if (authUser?.app_metadata?.password_change_required) {
      // 비밀번호 변경 요구를 무시하고 계속 진행
      // 필요시 나중에 비밀번호 변경 페이지로 리다이렉트할 수 있음
    }

    // 세션이 제대로 설정될 때까지 잠시 대기
    await new Promise(resolve => setTimeout(resolve, 100));

    // users 테이블에서 사용자 정보 가져오기
    // 세션을 다시 확인하여 인증 토큰이 제대로 설정되었는지 확인
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    
    if (!currentSession) {
      throw new Error('세션이 설정되지 않았습니다. 다시 로그인해주세요.');
    }

    // 프로덕션 환경에서만 console.log 제거
    if (process.env.NODE_ENV === 'development') {
      console.log('users 테이블에서 사용자 정보 조회 시도 - ID:', authUser.id);
    }
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle(); // .single() 대신 .maybeSingle() 사용
    
    if (process.env.NODE_ENV === 'development') {
      console.log('users 테이블 조회 결과:', { userData: userData ? { id: userData.id, role: userData.role } : null, error: userError });
    }

    if (userError) {
      // 프로덕션 환경에서만 console.error 제거
      if (process.env.NODE_ENV === 'development') {
        console.error('사용자 정보 조회 오류:', userError);
        console.error('오류 코드:', userError.code);
        console.error('오류 메시지:', userError.message);
        console.error('오류 힌트:', userError.hint);
        console.error('사용자 ID:', authUser.id);
        console.error('세션 존재 여부:', !!currentSession);
      }
      
      // 406 오류인 경우 특별한 메시지 제공
      if (userError.code === 'PGRST116' || userError.message.includes('406') || userError.message.includes('Not Acceptable')) {
        throw new Error('RLS 정책 문제가 발생했습니다. Supabase Dashboard에서 users 테이블의 RLS 정책을 확인하거나, 개발 환경에서는 RLS를 일시적으로 비활성화하세요.');
      }
      
      throw new Error(`사용자 정보를 가져올 수 없습니다: ${userError.message}`);
    }

    if (!userData) {
      // users 테이블에 레코드가 없는 경우
      // 트리거 함수가 실행되지 않았거나 백필이 필요함
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ users 테이블에 사용자 레코드가 없습니다. User ID:', authUser.id);
        console.error('⚠️ 트리거 함수가 실행되지 않았거나 백필이 필요합니다.');
        console.error('📝 해결 방법: Supabase Dashboard > SQL Editor에서 다음 파일을 실행하세요:');
        console.error('   - supabase/migrations/009_create_user_trigger.sql (트리거 함수 생성)');
        console.error('   - supabase/migrations/010_create_admin_user_now.sql (admin 사용자 생성)');
      }
      
      // users 테이블에 레코드가 없으면 에러 발생
      // 임시 사용자 객체로 진행하지 않음 (보안상 위험)
      throw new Error('사용자 정보를 찾을 수 없습니다. 트리거 함수가 실행되지 않았거나 백필이 필요합니다. 관리자에게 문의하세요.');
    }

    // 마지막 로그인 시간 업데이트
    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', authUser.id);

    return { user: userData, session: currentSession || data?.session };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('로그인 오류:', error);
    }
    throw error;
  }
}

/**
 * 사용자 로그아웃
 */
export async function signOutUser() {
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
    return true;
  } catch (error) {
    console.error('로그아웃 오류:', error);
    throw error;
  }
}

/**
 * 현재 로그인한 사용자 정보 가져오기
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = createClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error('인증 사용자 조회 오류:', authError);
      return null;
    }

    if (!authUser) {
      return null;
    }

    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle(); // .single() 대신 .maybeSingle() 사용 (행이 없어도 에러 발생 안 함)

    if (error) {
      console.error('사용자 정보 조회 오류:', error);
      console.error('에러 코드:', error.code);
      console.error('에러 메시지:', error.message);
      console.error('에러 힌트:', error.hint);
      
      // RLS 정책 문제일 수 있으므로 null 반환
      return null;
    }

    return userData;
  } catch (error) {
    console.error('현재 사용자 조회 오류:', error);
    return null;
  }
}

/**
 * 사용자 정보 업데이트
 */
export async function updateUser(userId: string, input: UpdateUserInput) {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('users')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error('사용자 정보 업데이트 오류:', error);
    throw error;
  }
}

/**
 * 사용자 목록 조회 (관리자용)
 */
export async function getUsers(filters?: {
  status?: UserStatus;
  role?: UserRole;
  search?: string;
}) {
  try {
    const supabase = createClient();
    let query = supabase.from('users').select('*').order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.role) {
      query = query.eq('role', filters.role);
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,club_name.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error('사용자 목록 조회 오류:', error);
    throw error;
  }
}

/**
 * 사용자 ID로 조회
 */
export async function getUserById(userId: string): Promise<User | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle(); // .single() 대신 .maybeSingle() 사용

    if (error) {
      console.error('사용자 조회 오류:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('사용자 조회 오류:', error);
    return null;
  }
}

/**
 * 사용자 상태 변경 (관리자용)
 */
export async function updateUserStatus(userId: string, status: UserStatus) {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('users')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error('사용자 상태 변경 오류:', error);
    throw error;
  }
}

/**
 * 사용자 삭제 (관리자용)
 */
export async function deleteUser(userId: string) {
  try {
    const supabase = createClient();
    // 1. users 테이블에서 삭제
    const { error: userError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (userError) {
      throw new Error(userError.message);
    }

    // 2. auth에서도 삭제 (관리자 권한 필요)
    // 실제로는 Supabase Dashboard에서 관리하거나 서버 사이드에서 처리해야 함
    // 여기서는 users 테이블만 삭제

    return true;
  } catch (error) {
    console.error('사용자 삭제 오류:', error);
    throw error;
  }
}

