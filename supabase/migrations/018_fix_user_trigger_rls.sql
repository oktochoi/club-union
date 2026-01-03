-- 트리거 함수 수정: RLS 우회 및 오류 처리 개선
-- SECURITY DEFINER로 실행되지만, Supabase에서는 추가 권한 설정이 필요할 수 있습니다.

-- 기존 트리거 삭제
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 트리거 함수 재생성 (더 안전한 오류 처리 포함)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- 트리거 함수 내에서 RLS를 우회하여 INSERT 수행
  -- SECURITY DEFINER로 실행되므로 함수 소유자의 권한으로 실행됨
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

-- 트리거 재생성
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 함수에 필요한 권한 부여 (RLS 우회를 위해)
-- SECURITY DEFINER 함수는 함수 소유자(보통 postgres 또는 service_role)의 권한으로 실행됨
-- 따라서 RLS 정책을 우회할 수 있어야 합니다.

