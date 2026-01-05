-- RLS 정책 완전 재생성 마이그레이션
-- permission denied 오류 해결

-- 1. 기존 RLS 정책 모두 삭제
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own record" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Admins can delete all users" ON public.users;

-- 1-1. 기존 함수도 삭제 (있을 경우)
DROP FUNCTION IF EXISTS public.is_admin_user() CASCADE;

-- 2. RLS 활성화 확인
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. 정책 재생성 (명시적으로 authenticated 역할 지정)

-- 3-1. 사용자는 자신의 정보만 조회 가능
CREATE POLICY "Users can view own profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 3-2. 사용자는 자신의 정보만 업데이트 가능
CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 3-3. 사용자는 자신의 레코드를 삽입 가능 (회원가입 시)
CREATE POLICY "Users can insert own record"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 3-4. 관리자는 모든 사용자 정보 조회 가능
-- auth.users의 metadata에서 role 확인 (순환 참조 방지)
CREATE POLICY "Admins can view all users"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    -- auth.users의 metadata에서 role이 'admin'인지 확인
    -- 이렇게 하면 public.users를 조회하지 않아 순환 참조가 발생하지 않음
    (
      SELECT (raw_user_meta_data->>'role')::text = 'admin'
      FROM auth.users
      WHERE auth.users.id = auth.uid()
    )
    OR
    -- 또는 자신의 레코드 조회 (이미 "Users can view own profile" 정책으로 처리되지만 명시적으로 추가)
    auth.uid() = id
  );

-- 3-5. 관리자는 모든 사용자 정보 업데이트 가능
-- auth.users의 metadata만 사용하여 순환 참조 완전 방지
CREATE POLICY "Admins can update all users"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    -- auth.users의 metadata에서 role이 'admin'인지 확인 (순환 참조 없음)
    (
      SELECT (raw_user_meta_data->>'role')::text = 'admin'
      FROM auth.users
      WHERE auth.users.id = auth.uid()
    )
    OR auth.uid() = id
  )
  WITH CHECK (
    (
      SELECT (raw_user_meta_data->>'role')::text = 'admin'
      FROM auth.users
      WHERE auth.users.id = auth.uid()
    )
    OR auth.uid() = id
  );

-- 3-6. 관리자는 모든 사용자 정보 삭제 가능
CREATE POLICY "Admins can delete all users"
  ON public.users
  FOR DELETE
  TO authenticated
  USING (
    -- auth.users의 metadata에서 role이 'admin'인지 확인 (순환 참조 없음)
    (
      SELECT (raw_user_meta_data->>'role')::text = 'admin'
      FROM auth.users
      WHERE auth.users.id = auth.uid()
    )
  );

-- 4. 정책 확인 쿼리 (참고용)
/*
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;
*/

