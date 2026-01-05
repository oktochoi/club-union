-- 보안 취약점 수정 마이그레이션
-- 1. users 테이블 RLS 명시적 활성화 확인
-- 2. 함수들의 role mutable search_path 문제 수정

-- 1. public.users 테이블 RLS 명시적 활성화
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 1-1. RLS 정책 확인 및 복구 (없으면 생성)
-- "Users can view own profile" 정책
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile"
      ON public.users FOR SELECT
      USING (auth.uid() = id);
    RAISE NOTICE 'RLS 정책 "Users can view own profile" 생성 완료';
  END IF;
END $$;

-- "Users can update own profile" 정책
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
      ON public.users FOR UPDATE
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
    RAISE NOTICE 'RLS 정책 "Users can update own profile" 생성 완료';
  END IF;
END $$;

-- "Users can insert own record" 정책
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'Users can insert own record'
  ) THEN
    CREATE POLICY "Users can insert own record"
      ON public.users FOR INSERT
      WITH CHECK (auth.uid() = id);
    RAISE NOTICE 'RLS 정책 "Users can insert own record" 생성 완료';
  END IF;
END $$;

-- "Admins can view all users" 정책
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'Admins can view all users'
  ) THEN
    CREATE POLICY "Admins can view all users"
      ON public.users FOR SELECT
      USING (
        (
          SELECT (raw_user_meta_data->>'role')::text = 'admin'
          FROM auth.users
          WHERE auth.users.id = auth.uid()
        )
      );
    RAISE NOTICE 'RLS 정책 "Admins can view all users" 생성 완료';
  END IF;
END $$;

-- "Admins can update all users" 정책
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'Admins can update all users'
  ) THEN
    CREATE POLICY "Admins can update all users"
      ON public.users FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid() AND role = 'admin'
        )
      );
    RAISE NOTICE 'RLS 정책 "Admins can update all users" 생성 완료';
  END IF;
END $$;

-- "Admins can delete all users" 정책
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'Admins can delete all users'
  ) THEN
    CREATE POLICY "Admins can delete all users"
      ON public.users FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid() AND role = 'admin'
        )
      );
    RAISE NOTICE 'RLS 정책 "Admins can delete all users" 생성 완료';
  END IF;
END $$;

-- 2. update_updated_at_column 함수 수정 (SET search_path 추가)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 3. decrement_rental_item_available 함수 수정 (SET search_path 추가)
CREATE OR REPLACE FUNCTION public.decrement_rental_item_available(
  item_id UUID,
  quantity INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.rental_items
  SET available = GREATEST(0, available - quantity)
  WHERE id = item_id;
END;
$$;

-- 4. increment_rental_item_available 함수 수정 (SET search_path 추가)
CREATE OR REPLACE FUNCTION public.increment_rental_item_available(
  item_id UUID,
  quantity INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.rental_items
  SET available = LEAST(total, available + quantity)
  WHERE id = item_id;
END;
$$;

-- 5. handle_new_user 트리거 함수에 SET search_path 추가 (보안 강화)
-- 기존 함수가 존재하는 경우에만 수정
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'handle_new_user'
  ) THEN
    -- 함수가 이미 SET search_path를 가지고 있는지 확인
    -- 있으면 그대로 두고, 없으면 추가
    EXECUTE 'ALTER FUNCTION public.handle_new_user() SET search_path = public';
    RAISE NOTICE 'handle_new_user 함수에 search_path 설정 완료';
  END IF;
END $$;

-- 6. backfill_users 함수에 SET search_path 추가 (보안 강화)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'backfill_users'
  ) THEN
    EXECUTE 'ALTER FUNCTION public.backfill_users() SET search_path = public';
    RAISE NOTICE 'backfill_users 함수에 search_path 설정 완료';
  END IF;
END $$;

-- 7. backfill_missing_users 함수에 SET search_path 추가 (보안 강화)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'backfill_missing_users'
  ) THEN
    EXECUTE 'ALTER FUNCTION public.backfill_missing_users() SET search_path = public';
    RAISE NOTICE 'backfill_missing_users 함수에 search_path 설정 완료';
    
    -- 누락된 사용자 레코드 백필 실행
    PERFORM public.backfill_missing_users();
    RAISE NOTICE '백필 함수 실행 완료';
  ELSE
    RAISE NOTICE 'backfill_missing_users 함수가 없습니다. 026_comprehensive_user_sync_fix.sql을 먼저 실행하세요.';
  END IF;
END $$;

-- 참고: HaveIBeenPwned 기능은 Supabase 대시보드에서 활성화해야 합니다.
-- Authentication > Settings > Password > "Check for compromised passwords" 옵션을 활성화하세요.

