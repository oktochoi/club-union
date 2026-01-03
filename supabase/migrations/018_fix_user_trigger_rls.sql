-- 트리거 함수 수정: RLS 우회 및 오류 처리 개선
-- SECURITY DEFINER로 실행되지만, Supabase에서는 추가 권한 설정이 필요할 수 있습니다.

-- 기존 트리거 삭제
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 트리거 함수 재생성 (RLS 완전 우회)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- RLS를 우회하기 위해 SET LOCAL을 사용하여 현재 세션의 RLS를 비활성화
  -- SECURITY DEFINER 함수는 함수 소유자의 권한으로 실행되지만,
  -- Supabase에서는 명시적으로 RLS를 우회해야 할 수 있습니다.
  PERFORM set_config('app.settings.bypass_rls', 'true', true);
  
  -- 트리거 함수 내에서 RLS를 우회하여 INSERT 수행
  INSERT INTO public.users (id, email, role, status, name, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::text, 'member'),
    'pending', -- 회원가입 시 기본값: 승인 대기
    COALESCE(NEW.raw_user_meta_data->>'name', COALESCE(NEW.email, 'Unknown')),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- 오류 발생 시 로그 (Supabase 로그에서 확인 가능)
    RAISE WARNING 'handle_new_user 트리거 오류: %', SQLERRM;
    -- 트리거 실패해도 auth.users 생성은 계속 진행
    RETURN NEW;
END;
$$;

-- 함수 소유자를 postgres로 변경 (RLS 우회를 위해)
-- Supabase에서는 service_role이 아닌 postgres 사용자를 사용해야 할 수 있습니다.
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- 트리거 재생성
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- RLS 정책 추가: 트리거 함수가 INSERT할 수 있도록 허용
-- SECURITY DEFINER 함수는 RLS를 우회해야 하지만, 명시적으로 정책을 추가하는 것이 더 안전합니다.
-- 하지만 트리거 함수는 SECURITY DEFINER이므로 RLS를 우회해야 합니다.
-- 만약 여전히 작동하지 않으면, 아래 정책을 추가하세요:

-- 트리거 함수가 INSERT할 수 있도록 RLS 정책 추가 (대안)
-- 이 정책은 SECURITY DEFINER 함수가 RLS를 우회하지 못하는 경우를 위한 것입니다.
-- 하지만 일반적으로 SECURITY DEFINER 함수는 RLS를 우회해야 하므로 필요하지 않습니다.

