-- 누락된 사용자 레코드 복구 마이그레이션
-- 트리거가 실행되지 않아 public.users에 레코드가 없는 auth.users 사용자들을 복구합니다.

-- 1. backfill_missing_users 함수가 존재하는지 확인하고 실행
DO $$
DECLARE
  v_result RECORD;
  v_row_count INTEGER;
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'backfill_missing_users'
  ) THEN
    -- 백필 함수 실행
    SELECT * INTO v_result FROM public.backfill_missing_users();
    RAISE NOTICE '백필 완료: 삽입된 레코드 수 = %, 오류 수 = %', 
      v_result.inserted_count, v_result.error_count;
  ELSE
    -- backfill_missing_users 함수가 없으면 간단한 백필 수행
    RAISE NOTICE 'backfill_missing_users 함수가 없습니다. 간단한 백필을 수행합니다.';
    
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
    SELECT 
      au.id,
      COALESCE(au.email, ''),
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
      'pending' as status,
      NULLIF(au.raw_user_meta_data->>'club_name', '') as club_name,
      NULLIF(au.raw_user_meta_data->>'phone_number', '') as phone_number,
      COALESCE(au.created_at, NOW()) as created_at,
      NOW() as updated_at
    FROM auth.users au
    LEFT JOIN public.users u ON au.id = u.id
    WHERE u.id IS NULL
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      name = COALESCE(EXCLUDED.name, users.name),
      updated_at = NOW();
    
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    RAISE NOTICE '백필 완료: % 개의 레코드가 처리되었습니다.', v_row_count;
  END IF;
END $$;

-- 2. 트리거가 제대로 설정되어 있는지 확인
DO $$
DECLARE
  v_trigger_exists BOOLEAN;
  v_function_exists BOOLEAN;
BEGIN
  -- 트리거 존재 확인
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'auth' 
    AND c.relname = 'users'
    AND t.tgname = 'on_auth_user_created'
  ) INTO v_trigger_exists;
  
  -- 함수 존재 확인
  SELECT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'handle_new_user'
  ) INTO v_function_exists;
  
  IF NOT v_trigger_exists THEN
    RAISE WARNING '트리거 on_auth_user_created가 존재하지 않습니다. 026_comprehensive_user_sync_fix.sql을 실행하세요.';
  END IF;
  
  IF NOT v_function_exists THEN
    RAISE WARNING '함수 handle_new_user가 존재하지 않습니다. 026_comprehensive_user_sync_fix.sql을 실행하세요.';
  END IF;
  
  IF v_trigger_exists AND v_function_exists THEN
    RAISE NOTICE '트리거와 함수가 정상적으로 설정되어 있습니다.';
  END IF;
END $$;

