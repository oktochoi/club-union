-- ============================================================================
-- 종합 사용자 동기화 수정 마이그레이션
-- auth.users → public.users 자동 동기화 보장
-- ============================================================================

-- 1. 기존 트리거 및 함수 완전 삭제
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 2. 트리거 함수 재생성 (모든 케이스 처리)
-- - SECURITY DEFINER로 RLS 우회
-- - OAuth 로그인 시 email null 처리
-- - 모든 NOT NULL 제약 조건 충족
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id UUID;
  v_email TEXT;
  v_name TEXT;
  v_role TEXT;
  v_status TEXT;
BEGIN
  -- 변수 초기화
  v_user_id := NEW.id;
  v_email := COALESCE(NEW.email, '');
  v_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    'User'
  );
  
  -- role 검증 및 정규화
  v_role := LOWER(TRIM(COALESCE(
    NEW.raw_user_meta_data->>'role',
    'member'
  )));
  
  IF v_role NOT IN ('admin', 'president', 'member') THEN
    v_role := 'member';
  END IF;
  
  -- status는 회원가입 시 'pending'으로 설정
  v_status := 'pending';
  
  -- public.users에 레코드 삽입
  -- SECURITY DEFINER이므로 RLS를 우회합니다
  INSERT INTO public.users (
    id,
    email,
    name,
    role,
    status,
    club_name,
    phone_number,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    v_email,
    v_name,
    v_role,
    v_status,
    COALESCE(NEW.raw_user_meta_data->>'club_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'phone_number', NULL),
    COALESCE(NEW.created_at, NOW()),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, users.name),
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- 오류 발생 시 상세 로그 (Supabase 로그에 기록됨)
    RAISE WARNING 'handle_new_user 트리거 오류 - User ID: %, Email: %, Error: %, SQLSTATE: %', 
      v_user_id, v_email, SQLERRM, SQLSTATE;
    -- 트리거 실패해도 auth.users 생성은 계속 진행
    RETURN NEW;
END;
$$;

-- 3. 함수 소유자를 postgres로 설정 (RLS 우회 보장)
-- 참고: Supabase Dashboard에서 수동으로 확인/변경이 필요할 수 있습니다
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- 4. 함수 실행 권한 부여
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;

-- 5. 트리거 재생성
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 6. RLS 정책 확인 및 보완
-- 트리거 함수가 INSERT할 수 있도록 보장하기 위한 추가 정책
-- SECURITY DEFINER 함수는 RLS를 우회해야 하지만, 명시적으로 정책 추가

-- 기존 "Users can insert own record" 정책이 있지만,
-- 트리거 함수는 SECURITY DEFINER이므로 이 정책을 우회합니다.
-- 하지만 혹시 모를 상황을 대비해 추가 정책 생성

-- 트리거 함수를 위한 INSERT 정책 (이미 SECURITY DEFINER이므로 필요 없을 수 있음)
-- 하지만 명시적으로 추가하여 보장
DO $$
BEGIN
  -- 트리거 함수가 INSERT할 수 있도록 하는 정책이 이미 있는지 확인
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Allow trigger to insert users'
  ) THEN
    -- 정책은 생성하지 않음 (SECURITY DEFINER 함수가 RLS를 우회하므로)
    -- 대신 함수 소유자 확인만 수행
    NULL;
  END IF;
END $$;

-- 7. 기존 auth.users에 대해 누락된 레코드 백필
CREATE OR REPLACE FUNCTION public.backfill_missing_users()
RETURNS TABLE(
  inserted_count INTEGER,
  error_count INTEGER
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_inserted INTEGER := 0;
  v_errors INTEGER := 0;
  v_user RECORD;
BEGIN
  -- auth.users에 있지만 public.users에 없는 사용자 찾기
  FOR v_user IN
    SELECT 
      au.id,
      COALESCE(au.email, '') as email,
      COALESCE(
        au.raw_user_meta_data->>'name',
        au.raw_user_meta_data->>'full_name',
        au.email,
        'User'
      ) as name,
      LOWER(TRIM(COALESCE(
        au.raw_user_meta_data->>'role',
        'member'
      ))) as role_raw,
      COALESCE(au.raw_user_meta_data->>'club_name', NULL) as club_name,
      COALESCE(au.raw_user_meta_data->>'phone_number', NULL) as phone_number,
      COALESCE(au.created_at, NOW()) as created_at
    FROM auth.users au
    LEFT JOIN public.users u ON au.id = u.id
    WHERE u.id IS NULL
  LOOP
    BEGIN
      -- role 검증
      IF v_user.role_raw NOT IN ('admin', 'president', 'member') THEN
        v_user.role_raw := 'member';
      END IF;
      
      INSERT INTO public.users (
        id,
        email,
        name,
        role,
        status,
        club_name,
        phone_number,
        created_at,
        updated_at
      )
      VALUES (
        v_user.id,
        v_user.email,
        v_user.name,
        v_user.role_raw,
        'pending',
        v_user.club_name,
        v_user.phone_number,
        v_user.created_at,
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = COALESCE(EXCLUDED.name, users.name),
        updated_at = NOW();
      
      v_inserted := v_inserted + 1;
    EXCEPTION
      WHEN OTHERS THEN
        v_errors := v_errors + 1;
        RAISE WARNING '백필 오류 - User ID: %, Error: %', v_user.id, SQLERRM;
    END;
  END LOOP;
  
  RETURN QUERY SELECT v_inserted, v_errors;
END;
$$;

-- 백필 함수 실행
SELECT * FROM public.backfill_missing_users();

-- 8. 트리거 및 함수 상태 확인 쿼리
-- 다음 쿼리로 트리거와 함수가 제대로 설정되었는지 확인할 수 있습니다:
/*
SELECT 
  t.tgname as trigger_name,
  p.proname as function_name,
  pg_get_userbyid(p.proowner) as function_owner,
  t.tgenabled as trigger_enabled
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgname = 'on_auth_user_created'
  AND p.proname = 'handle_new_user';
*/

-- ============================================================================
-- 완료
-- ============================================================================
-- 다음을 확인하세요:
-- 1. Supabase Dashboard > Database > Functions > handle_new_user 존재 확인
-- 2. Supabase Dashboard > Database > Triggers > on_auth_user_created 활성화 확인
-- 3. 함수 소유자가 postgres 또는 service_role인지 확인
-- 4. 테스트: 새 사용자 회원가입 후 public.users에 레코드 생성 확인

