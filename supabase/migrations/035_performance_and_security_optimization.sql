-- 성능 및 보안 최적화 마이그레이션
-- 모든 성능 이슈와 보안 이슈를 수정합니다

-- ============================================
-- 1. 외래키 인덱스 추가 (성능 최적화)
-- ============================================

-- rental_requests 테이블의 외래키에 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_rental_requests_item_id ON public.rental_requests(item_id);
CREATE INDEX IF NOT EXISTS idx_rental_requests_user_id ON public.rental_requests(user_id);

-- ============================================
-- 2. RLS 정책 최적화 (성능 최적화)
-- auth.uid()를 (select auth.uid())로 변경하여 매 행마다 재평가되지 않도록 함
-- ============================================

-- users 테이블 정책 최적화
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can insert own record" ON public.users;
CREATE POLICY "Users can insert own record"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
CREATE POLICY "Admins can update all users"
  ON public.users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

-- facilities 테이블 정책 최적화
DROP POLICY IF EXISTS "Authenticated users can view facilities" ON public.facilities;
CREATE POLICY "Authenticated users can view facilities"
  ON public.facilities FOR SELECT
  TO authenticated
  USING ((select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "Admins can insert facilities" ON public.facilities;
CREATE POLICY "Admins can insert facilities"
  ON public.facilities FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update facilities" ON public.facilities;
CREATE POLICY "Admins can update facilities"
  ON public.facilities FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete facilities" ON public.facilities;
CREATE POLICY "Admins can delete facilities"
  ON public.facilities FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

-- reservations 테이블 정책 최적화
DROP POLICY IF EXISTS "Users can view own reservations" ON public.reservations;
CREATE POLICY "Users can view own reservations"
  ON public.reservations FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create own reservations" ON public.reservations;
CREATE POLICY "Users can create own reservations"
  ON public.reservations FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins can view all reservations" ON public.reservations;
CREATE POLICY "Admins can view all reservations"
  ON public.reservations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update all reservations" ON public.reservations;
CREATE POLICY "Admins can update all reservations"
  ON public.reservations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete all reservations" ON public.reservations;
CREATE POLICY "Admins can delete all reservations"
  ON public.reservations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

-- rental_items 테이블 정책 최적화
DROP POLICY IF EXISTS "Authenticated users can view rental items" ON public.rental_items;
CREATE POLICY "Authenticated users can view rental items"
  ON public.rental_items FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can manage rental items" ON public.rental_items;
CREATE POLICY "Admins can manage rental items"
  ON public.rental_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

-- rental_requests 테이블 정책 최적화
DROP POLICY IF EXISTS "Users can view own rental requests" ON public.rental_requests;
CREATE POLICY "Users can view own rental requests"
  ON public.rental_requests FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins can view all rental requests" ON public.rental_requests;
CREATE POLICY "Admins can view all rental requests"
  ON public.rental_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Authenticated users can create rental requests" ON public.rental_requests;
CREATE POLICY "Authenticated users can create rental requests"
  ON public.rental_requests FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins can update rental requests" ON public.rental_requests;
CREATE POLICY "Admins can update rental requests"
  ON public.rental_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete rental requests" ON public.rental_requests;
CREATE POLICY "Admins can delete rental requests"
  ON public.rental_requests FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

-- account_info 테이블 정책 최적화
DROP POLICY IF EXISTS "Authenticated users can view account info" ON public.account_info;
CREATE POLICY "Authenticated users can view account info"
  ON public.account_info FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can update account info" ON public.account_info;
CREATE POLICY "Admins can update account info"
  ON public.account_info FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

-- ============================================
-- 3. 사용되지 않는 인덱스 제거 (선택적)
-- ============================================

-- 사용되지 않는 인덱스 제거 (성능에 큰 영향은 없지만 정리)
-- 주의: 실제로 사용되지 않는지 확인 후 제거하는 것이 안전합니다
-- DROP INDEX IF EXISTS idx_facilities_name;
-- DROP INDEX IF EXISTS idx_reservations_facility_id;
-- DROP INDEX IF EXISTS idx_reservations_date;
-- DROP INDEX IF EXISTS idx_reservations_status;

-- 참고: 인덱스는 나중에 필요할 수 있으므로 주석 처리했습니다.
-- 실제로 사용되지 않는다고 확인되면 주석을 해제하여 제거할 수 있습니다.

-- ============================================
-- 4. check_is_admin() 함수 최적화
-- ============================================

-- check_is_admin() 함수도 최적화
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
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = (select auth.uid()) AND role = 'admin'
  ) INTO v_is_admin;
  
  RETURN COALESCE(v_is_admin, false);
END;
$$;

-- ============================================
-- 완료 메시지
-- ============================================

-- 성능 최적화 완료:
-- ✅ 외래키 인덱스 추가 완료
-- ✅ RLS 정책 최적화 완료 (auth.uid() → (select auth.uid()))
-- ⚠️  사용되지 않는 인덱스는 주석 처리 (필요시 수동 제거)
-- 
-- 보안 최적화:
-- ⚠️  비밀번호 유출 보호는 Supabase 대시보드에서 활성화 필요
--    Settings > Auth > Password > Enable leaked password protection

