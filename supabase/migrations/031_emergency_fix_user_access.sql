-- 긴급 사용자 접근 복구 마이그레이션
-- 보안 취약점 수정 후 로그인 문제 해결

-- 1. SECURITY DEFINER 함수로 모든 auth.users에 대해 public.users 레코드 생성
-- RLS를 우회하여 직접 INSERT
CREATE OR REPLACE FUNCTION public.emergency_backfill_all_users()
RETURNS TABLE(
  inserted_count INTEGER,
  error_count INTEGER
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_user RECORD;
  v_inserted INTEGER := 0;
  v_errors INTEGER := 0;
BEGIN
  -- auth.users에 있지만 public.users에 없는 모든 사용자 처리
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
      CASE 
        WHEN LOWER(TRIM(COALESCE(au.raw_user_meta_data->>'role', ''))) IN ('admin', 'president', 'member') 
        THEN LOWER(TRIM(au.raw_user_meta_data->>'role'))
        ELSE 'member'
      END as role,
      COALESCE(au.raw_user_meta_data->>'club_name', NULL) as club_name,
      COALESCE(au.raw_user_meta_data->>'phone_number', NULL) as phone_number,
      COALESCE(au.created_at, NOW()) as created_at
    FROM auth.users au
    LEFT JOIN public.users u ON au.id = u.id
    WHERE u.id IS NULL
  LOOP
    BEGIN
      -- SECURITY DEFINER이므로 RLS를 우회하여 INSERT
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
        v_user.role,
        'pending', -- 기본 상태는 pending
        v_user.club_name,
        v_user.phone_number,
        v_user.created_at,
        NOW()
      )
      ON CONFLICT (id) DO NOTHING;
      
      v_inserted := v_inserted + 1;
    EXCEPTION
      WHEN OTHERS THEN
        v_errors := v_errors + 1;
        RAISE WARNING '사용자 레코드 생성 실패 - User ID: %, Email: %, Error: %', 
          v_user.id, v_user.email, SQLERRM;
    END;
  END LOOP;
  
  RETURN QUERY SELECT v_inserted, v_errors;
END;
$$;

-- 백필 함수 실행
DO $$
DECLARE
  v_result RECORD;
BEGIN
  SELECT * INTO v_result FROM public.emergency_backfill_all_users();
  RAISE NOTICE '백필 완료: % 명의 사용자 레코드가 생성되었습니다. 오류: % 건', 
    v_result.inserted_count, v_result.error_count;
END $$;

-- 2. RLS 정책 확인 및 복구
-- "Users can view own profile" 정책이 있는지 확인하고 없으면 생성
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
  ELSE
    RAISE NOTICE 'RLS 정책 "Users can view own profile" 이미 존재함';
  END IF;
END $$;

-- 3. 트리거 함수 확인 및 재생성 (필요시)
DO $$
BEGIN
  -- 트리거가 존재하는지 확인
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'auth' 
    AND c.relname = 'users'
    AND t.tgname = 'on_auth_user_created'
  ) THEN
    RAISE WARNING '트리거 on_auth_user_created가 없습니다. 026_comprehensive_user_sync_fix.sql을 실행하세요.';
  END IF;
  
  -- handle_new_user 함수가 존재하는지 확인
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'handle_new_user'
  ) THEN
    RAISE WARNING '함수 handle_new_user가 없습니다. 026_comprehensive_user_sync_fix.sql을 실행하세요.';
  END IF;
END $$;

-- 4. 현재 세션의 사용자 레코드 강제 생성 (긴급 복구)
-- 이 부분은 Supabase Dashboard에서 수동으로 실행해야 할 수 있습니다.
-- 현재 로그인한 사용자의 ID를 알고 있다면 아래 쿼리를 수정하여 실행하세요.
/*
-- 예시: 특정 사용자 ID로 레코드 생성
INSERT INTO public.users (
  id,
  email,
  name,
  role,
  status,
  created_at,
  updated_at
)
SELECT 
  au.id,
  COALESCE(au.email, ''),
  COALESCE(au.raw_user_meta_data->>'name', au.email, 'User'),
  COALESCE(LOWER(TRIM(au.raw_user_meta_data->>'role')), 'member'),
  'pending',
  COALESCE(au.created_at, NOW()),
  NOW()
FROM auth.users au
WHERE au.id = 'YOUR_USER_ID_HERE'  -- 여기에 실제 사용자 ID 입력
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  updated_at = NOW();
*/

-- 5. 모든 사용자 레코드 상태 확인 쿼리 (참고용)
/*
SELECT 
  au.id,
  au.email,
  CASE WHEN u.id IS NULL THEN '❌ 누락됨' ELSE '✅ 존재함' END as status,
  u.role,
  u.status as user_status
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
ORDER BY au.created_at DESC;
*/

