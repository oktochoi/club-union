-- RPC 함수 최종 수정: role 검증 완전 강화
-- 모든 가능한 edge case 처리

-- 기존 함수 삭제
DROP FUNCTION IF EXISTS public.create_user_record(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) CASCADE;

-- RPC 함수 재생성 (role 검증 완전 강화)
CREATE OR REPLACE FUNCTION public.create_user_record(
  p_user_id UUID,
  p_email TEXT,
  p_name TEXT,
  p_club_name TEXT,
  p_phone_number TEXT,
  p_role TEXT
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_record JSONB;
  v_valid_role TEXT;
  v_role_cleaned TEXT;
BEGIN
  -- role 값 완전 정규화 (여러 단계)
  -- 1단계: NULL 처리
  IF p_role IS NULL THEN
    v_role_cleaned := 'member';
  ELSE
    -- 2단계: 공백 제거 (앞뒤, 중간 공백 모두)
    v_role_cleaned := TRIM(REGEXP_REPLACE(p_role, '\s+', ' ', 'g'));
    -- 3단계: 소문자 변환
    v_role_cleaned := LOWER(v_role_cleaned);
    -- 4단계: 특수 문자 제거 (알파벳과 숫자만)
    v_role_cleaned := REGEXP_REPLACE(v_role_cleaned, '[^a-z0-9]', '', 'g');
  END IF;
  
  -- 5단계: 빈 문자열 처리
  IF v_role_cleaned IS NULL OR v_role_cleaned = '' THEN
    v_role_cleaned := 'member';
  END IF;
  
  -- 6단계: 유효한 값인지 확인
  IF v_role_cleaned NOT IN ('admin', 'president', 'member') THEN
    -- 유효하지 않은 값이면 기본값 'member'로 설정
    RAISE WARNING 'Invalid role value: "%" (cleaned: "%"). Using default: member', p_role, v_role_cleaned;
    v_role_cleaned := 'member';
  END IF;
  
  -- 7단계: 최종 검증 (이중 체크)
  IF v_role_cleaned IS NULL OR v_role_cleaned NOT IN ('admin', 'president', 'member') THEN
    RAISE EXCEPTION 'Role validation failed. Original: "%", Cleaned: "%"', p_role, v_role_cleaned;
  END IF;
  
  -- 최종 role 값 할당
  v_valid_role := v_role_cleaned;
  
  -- 디버깅을 위한 로그 (개발 환경에서만)
  -- RAISE NOTICE 'Role validation: Original="%", Cleaned="%", Final="%"', p_role, v_role_cleaned, v_valid_role;
  
  -- RLS를 우회하여 직접 INSERT 수행
  BEGIN
    INSERT INTO public.users (
      id,
      email,
      name,
      club_name,
      phone_number,
      role,
      status,
      created_at,
      updated_at
    )
    VALUES (
      p_user_id,
      p_email,
      p_name,
      p_club_name,
      p_phone_number,
      v_valid_role,  -- 검증된 role 값만 사용
      'pending',
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      name = EXCLUDED.name,
      club_name = EXCLUDED.club_name,
      phone_number = EXCLUDED.phone_number,
      role = v_valid_role,  -- 검증된 role 값만 사용
      updated_at = NOW();
  EXCEPTION
    WHEN check_violation THEN
      -- 제약 조건 위반 시 상세 정보와 함께 재시도
      RAISE EXCEPTION 'Check constraint violation: % (SQLSTATE: %). Role value attempted: "%" (original: "%", cleaned: "%"). Valid values: admin, president, member', 
        SQLERRM, SQLSTATE, v_valid_role, p_role, v_role_cleaned;
  END;
  
  -- 생성된 레코드를 JSONB로 반환
  SELECT to_jsonb(u.*) INTO v_user_record
  FROM public.users u
  WHERE u.id = p_user_id;
  
  -- 레코드가 없으면 에러 발생
  IF v_user_record IS NULL THEN
    RAISE EXCEPTION '사용자 레코드를 찾을 수 없습니다. User ID: %', p_user_id;
  END IF;
  
  RETURN v_user_record;
EXCEPTION
  WHEN check_violation THEN
    -- 제약 조건 위반 시 상세 정보 반환
    RAISE EXCEPTION 'Check constraint violation: % (SQLSTATE: %). Role value attempted: "%" (original: "%", cleaned: "%")', 
      SQLERRM, SQLSTATE, v_valid_role, p_role, v_role_cleaned;
  WHEN OTHERS THEN
    -- 기타 에러 발생 시 상세 정보 반환
    RAISE EXCEPTION 'create_user_record 오류: % (SQLSTATE: %). Role value: "%" (original: "%", cleaned: "%")', 
      SQLERRM, SQLSTATE, v_valid_role, p_role, v_role_cleaned;
END;
$$;

-- 함수 실행 권한 부여
GRANT EXECUTE ON FUNCTION public.create_user_record(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_record(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.create_user_record(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;

-- 함수 소유자를 postgres로 변경 (RLS 우회를 위해)
ALTER FUNCTION public.create_user_record(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) OWNER TO postgres;

-- 제약 조건 확인 쿼리 (참고용)
-- 다음 쿼리로 users 테이블의 role 제약 조건을 확인할 수 있습니다:
/*
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.users'::regclass
  AND conname LIKE '%role%';
*/

