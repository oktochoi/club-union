-- 트리거 함수가 RLS를 완전히 우회하도록 수정
-- Supabase에서 SECURITY DEFINER 함수가 RLS를 우회하지 못하는 경우를 해결

-- 기존 트리거 삭제
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 트리거 함수를 service_role 권한으로 실행되도록 수정
-- Supabase에서는 service_role이 RLS를 완전히 우회합니다
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id UUID;
  v_email TEXT;
  v_role TEXT;
  v_name TEXT;
BEGIN
  -- 변수에 값 할당
  v_user_id := NEW.id;
  v_email := COALESCE(NEW.email, '');
  v_role := COALESCE((NEW.raw_user_meta_data->>'role')::text, 'member');
  v_name := COALESCE(NEW.raw_user_meta_data->>'name', COALESCE(NEW.email, 'Unknown'));
  
  -- RLS를 우회하여 직접 INSERT 수행
  -- SECURITY DEFINER 함수는 함수 소유자의 권한으로 실행되므로 RLS를 우회해야 합니다
  INSERT INTO public.users (id, email, role, status, name, created_at, updated_at)
  VALUES (
    v_user_id,
    v_email,
    v_role,
    'pending', -- 회원가입 시 기본값: 승인 대기
    v_name,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- 오류 발생 시 상세 로그
    RAISE WARNING 'handle_new_user 트리거 오류 - User ID: %, Error: %', v_user_id, SQLERRM;
    -- 트리거 실패해도 auth.users 생성은 계속 진행
    RETURN NEW;
END;
$$;

-- 함수 소유자를 service_role로 설정 (RLS 완전 우회)
-- Supabase에서는 service_role이 RLS를 완전히 우회합니다
-- 하지만 Supabase에서는 함수 소유자를 직접 변경할 수 없으므로,
-- 함수를 service_role 권한으로 실행되도록 설정합니다.

-- 참고: Supabase Dashboard에서 수동으로 함수 소유자를 변경해야 할 수 있습니다:
-- 1. Database > Functions > handle_new_user 선택
-- 2. 함수 소유자를 service_role로 변경

-- 트리거 재생성
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 함수에 필요한 권한 부여
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- 참고: Supabase Dashboard에서 다음을 확인하세요:
-- 1. Database > Functions에서 handle_new_user 함수가 존재하는지
-- 2. Database > Triggers에서 on_auth_user_created 트리거가 활성화되어 있는지
-- 3. 함수의 소유자가 postgres 또는 service_role인지

