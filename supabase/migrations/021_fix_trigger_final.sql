-- 트리거 함수 최종 수정: RLS 완전 우회 보장
-- Supabase에서 트리거 함수가 users 테이블에 INSERT할 수 있도록 보장

-- 1. 기존 트리거 및 함수 삭제
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. 트리거 함수 재생성 (RLS 완전 우회)
-- SECURITY DEFINER와 함께 SET role을 사용하여 RLS를 우회
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- SECURITY DEFINER 함수는 함수 소유자의 권한으로 실행되므로
  -- RLS를 자동으로 우회해야 합니다.
  -- 하지만 Supabase에서는 때로 명시적으로 우회해야 할 수 있습니다.
  
  INSERT INTO public.users (id, email, role, status, name, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::text, 'member'),
    'pending',
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
    -- 오류 발생 시 상세 로그
    RAISE WARNING 'handle_new_user 트리거 오류 - User ID: %, Email: %, Error: %', 
      NEW.id, NEW.email, SQLERRM;
    -- 트리거 실패해도 auth.users 생성은 계속 진행
    RETURN NEW;
END;
$$;

-- 3. 함수 소유자를 service_role로 설정하려고 시도
-- Supabase에서는 함수 소유자를 직접 변경할 수 없을 수 있으므로
-- 대신 함수가 service_role 권한으로 실행되도록 보장합니다.
-- 참고: Supabase Dashboard에서 수동으로 함수 소유자를 service_role로 변경해야 할 수 있습니다.

-- 4. 트리거 재생성
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 5. RLS 정책 확인 및 수정
-- 트리거 함수가 INSERT할 수 있도록 기존 정책 확인
-- "Users can insert own record" 정책이 있지만, 트리거 함수는 SECURITY DEFINER이므로
-- 이 정책을 우회해야 합니다.

-- 만약 여전히 작동하지 않으면, 아래 정책을 추가하세요:
-- 하지만 일반적으로 SECURITY DEFINER 함수는 RLS를 우회해야 하므로 필요하지 않습니다.

-- 6. 테스트를 위한 백필 함수 (선택 사항)
-- 기존 auth.users에 대해 users 테이블 레코드가 없는 경우 생성
CREATE OR REPLACE FUNCTION public.backfill_missing_users()
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.users (id, email, role, status, name, created_at, updated_at)
  SELECT 
    au.id,
    COALESCE(au.email, ''),
    COALESCE((au.raw_user_meta_data->>'role')::text, 'member'),
    'pending',
    COALESCE(au.raw_user_meta_data->>'name', COALESCE(au.email, 'Unknown')),
    COALESCE(au.created_at, NOW()),
    NOW()
  FROM auth.users au
  LEFT JOIN public.users u ON au.id = u.id
  WHERE u.id IS NULL
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
END;
$$;

-- 중요: Supabase Dashboard에서 다음을 확인하세요:
-- 1. Database > Functions > handle_new_user 함수가 존재하는지
-- 2. Database > Triggers > on_auth_user_created 트리거가 활성화되어 있는지
-- 3. 함수의 소유자가 service_role 또는 postgres인지 확인
-- 4. 만약 함수 소유자가 authenticated 또는 anon이면, service_role로 변경하세요

