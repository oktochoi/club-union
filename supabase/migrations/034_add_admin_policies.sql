-- 관리자 정책 추가 마이그레이션
-- 033_simple_rls_policies.sql 실행 후 이 마이그레이션을 실행하세요
-- 순환 참조 없이 관리자가 모든 사용자를 조회/수정/삭제할 수 있도록 함

-- 1. 기존 관리자 정책 삭제 (있을 경우)
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Admins can delete all users" ON public.users;

-- 2. SECURITY DEFINER 함수 생성 (순환 참조 방지)
-- 이 함수는 RLS를 우회하여 관리자 여부를 확인합니다
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- SECURITY DEFINER이므로 RLS를 우회하여 public.users를 직접 조회
  -- 이렇게 하면 순환 참조 없이 관리자 여부를 확인할 수 있습니다
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  ) INTO v_is_admin;
  
  RETURN COALESCE(v_is_admin, false);
END;
$$;

-- 3. 관리자 정책 생성

-- 3-1. 관리자는 모든 사용자 정보 조회 가능
CREATE POLICY "Admins can view all users"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    public.check_is_admin()
    OR auth.uid() = id  -- 자신의 정보는 항상 조회 가능
  );

-- 3-2. 관리자는 모든 사용자 정보 업데이트 가능
CREATE POLICY "Admins can update all users"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    public.check_is_admin()
    OR auth.uid() = id  -- 자신의 정보는 항상 업데이트 가능
  )
  WITH CHECK (
    public.check_is_admin()
    OR auth.uid() = id
  );

-- 3-3. 관리자는 모든 사용자 정보 삭제 가능
CREATE POLICY "Admins can delete all users"
  ON public.users
  FOR DELETE
  TO authenticated
  USING (
    public.check_is_admin()
  );

-- 참고: 
-- - check_is_admin() 함수는 auth.users의 metadata만 확인하므로 순환 참조가 발생하지 않습니다
-- - 관리자로 설정하려면 auth.users의 raw_user_meta_data에 role: 'admin'을 추가하세요
-- - 또는 public.users 테이블에서 직접 role을 'admin'으로 설정하세요

