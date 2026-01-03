-- auth.users에 사용자가 생성될 때 자동으로 users 테이블에 레코드를 생성하는 트리거 함수
-- 이 함수는 auth.users에 INSERT가 발생할 때마다 자동으로 실행됩니다.

-- 트리거 함수 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role, status, name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::text, 'member'), -- metadata에서 role 가져오기, 없으면 'member'
    'active', -- 기본값: active
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), -- metadata에서 name 가져오기, 없으면 email
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 기존 auth.users의 사용자들에 대해 users 테이블에 레코드가 없는 경우 생성
-- (이미 생성된 사용자들을 위한 백필)
-- SECURITY DEFINER 함수로 실행하여 RLS를 우회
CREATE OR REPLACE FUNCTION public.backfill_users()
RETURNS void AS $$
BEGIN
  INSERT INTO public.users (id, email, role, status, name, created_at, updated_at)
  SELECT 
    au.id,
    au.email,
    COALESCE((au.raw_user_meta_data->>'role')::text, 'member') as role,
    'active' as status,
    COALESCE(au.raw_user_meta_data->>'name', au.email) as name,
    au.created_at,
    NOW() as updated_at
  FROM auth.users au
  LEFT JOIN public.users u ON au.id = u.id
  WHERE u.id IS NULL
  ON CONFLICT (id) DO UPDATE SET
    -- 이미 존재하는 경우 role이 'member'로 설정되어 있을 수 있으므로
    -- metadata에 role이 있으면 업데이트 (하지만 admin은 수동으로 설정해야 함)
    role = COALESCE(
      (SELECT (raw_user_meta_data->>'role')::text FROM auth.users WHERE id = EXCLUDED.id),
      users.role
    ),
    email = EXCLUDED.email,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 백필 함수 실행
SELECT public.backfill_users();

-- ⚠️ 중요: admin 사용자는 metadata에 role이 없을 수 있으므로
-- 백필 후 수동으로 role을 'admin'으로 설정해야 합니다.
-- 010_create_admin_user_now.sql 파일을 실행하세요.

-- 백필 함수는 일회성 실행이므로 삭제 (선택 사항)
-- DROP FUNCTION IF EXISTS public.backfill_users();

