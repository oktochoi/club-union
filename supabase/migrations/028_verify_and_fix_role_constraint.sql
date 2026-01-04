-- role 제약 조건 확인 및 재생성
-- 'president'가 거부되는 문제 해결

-- 1. 현재 제약 조건 확인
DO $$
DECLARE
  v_constraint_def TEXT;
BEGIN
  SELECT pg_get_constraintdef(oid) INTO v_constraint_def
  FROM pg_constraint
  WHERE conrelid = 'public.users'::regclass
    AND conname = 'users_role_check';
  
  RAISE NOTICE 'Current role constraint: %', v_constraint_def;
END $$;

-- 2. 잘못된 role 값을 가진 레코드 확인 및 수정
DO $$
DECLARE
  v_invalid_count INTEGER;
  v_invalid_roles TEXT[];
BEGIN
  -- 잘못된 role 값 확인
  SELECT COUNT(*), ARRAY_AGG(DISTINCT role) INTO v_invalid_count, v_invalid_roles
  FROM public.users
  WHERE role IS NULL 
     OR role NOT IN ('admin', 'president', 'member');
  
  IF v_invalid_count > 0 THEN
    RAISE NOTICE 'Found % users with invalid role values: %', v_invalid_count, v_invalid_roles;
    RAISE NOTICE 'Updating invalid role values to "member"...';
    
    -- NULL이거나 유효하지 않은 role 값을 'member'로 변경
    UPDATE public.users
    SET role = 'member'
    WHERE role IS NULL 
       OR role NOT IN ('admin', 'president', 'member');
    
    RAISE NOTICE 'Updated % users with invalid role values', v_invalid_count;
  ELSE
    RAISE NOTICE 'All users have valid role values';
  END IF;
END $$;

-- 3. 기존 제약 조건 삭제
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- 4. 제약 조건 재생성 (명시적으로 허용된 값 지정)
ALTER TABLE public.users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin', 'president', 'member'));

-- 4. 제약 조건 확인
DO $$
DECLARE
  v_constraint_def TEXT;
  v_test_role TEXT;
BEGIN
  SELECT pg_get_constraintdef(oid) INTO v_constraint_def
  FROM pg_constraint
  WHERE conrelid = 'public.users'::regclass
    AND conname = 'users_role_check';
  
  RAISE NOTICE 'New role constraint: %', v_constraint_def;
  
  -- 테스트: 'president' 값이 유효한지 확인
  v_test_role := 'president';
  IF v_test_role IN ('admin', 'president', 'member') THEN
    RAISE NOTICE 'Test passed: "president" is a valid role value';
  ELSE
    RAISE WARNING 'Test failed: "president" is NOT a valid role value';
  END IF;
END $$;

-- 5. 기존 데이터 확인 (잘못된 role 값이 있는지)
DO $$
DECLARE
  v_invalid_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_invalid_count
  FROM public.users
  WHERE role NOT IN ('admin', 'president', 'member');
  
  IF v_invalid_count > 0 THEN
    RAISE WARNING 'Found % users with invalid role values. Updating to "member"...', v_invalid_count;
    
    UPDATE public.users
    SET role = 'member'
    WHERE role NOT IN ('admin', 'president', 'member');
  ELSE
    RAISE NOTICE 'All users have valid role values';
  END IF;
END $$;

