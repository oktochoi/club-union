-- RLS 정책 수정: 트리거 함수가 INSERT할 수 있도록 허용
-- SECURITY DEFINER 함수는 RLS를 우회해야 하지만, 때로는 명시적으로 정책이 필요합니다.

-- 기존 INSERT 정책 확인
-- "Users can insert own record" 정책은 auth.uid() = id를 체크하는데,
-- 트리거 함수 실행 시에는 auth.uid()가 NULL일 수 있습니다.

-- 트리거 함수가 INSERT할 수 있도록 하는 정책 추가
-- SECURITY DEFINER 함수는 함수 소유자의 권한으로 실행되므로,
-- 함수 소유자가 service_role이면 RLS를 우회할 수 있어야 합니다.
-- 하지만 Supabase에서는 때로 명시적으로 정책이 필요할 수 있습니다.

-- 중요: SECURITY DEFINER 함수는 함수 소유자의 권한으로 실행되므로,
-- 함수 소유자가 service_role이면 RLS를 우회할 수 있어야 합니다.
-- 하지만 Supabase에서는 때로 명시적으로 정책이 필요할 수 있습니다.

-- 참고: 트리거 함수는 SECURITY DEFINER이므로 RLS를 우회해야 합니다.
-- 만약 여전히 작동하지 않으면, 함수 소유자를 service_role로 변경해야 합니다.

-- 중요: Supabase Dashboard에서 다음을 확인하세요:
-- 1. Database > Functions > handle_new_user 함수 선택
-- 2. 함수 소유자가 service_role인지 확인
-- 3. 만약 소유자가 authenticated 또는 anon이면, service_role로 변경하세요

-- 대신: 트리거 함수가 올바르게 설정되었는지 확인하는 쿼리
-- 이 쿼리는 트리거 함수의 소유자를 확인합니다.
DO $$
DECLARE
  func_owner TEXT;
BEGIN
  SELECT pg_get_userbyid(proowner) INTO func_owner
  FROM pg_proc
  WHERE proname = 'handle_new_user' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
  
  IF func_owner IS NOT NULL THEN
    RAISE NOTICE 'handle_new_user 함수 소유자: %', func_owner;
    IF func_owner != 'service_role' AND func_owner != 'postgres' THEN
      RAISE WARNING '함수 소유자가 service_role 또는 postgres가 아닙니다. RLS를 우회하지 못할 수 있습니다.';
    END IF;
  END IF;
END $$;

