-- RPC 함수 재생성: role 검증 강화 버전
-- 이전 버전을 완전히 대체합니다.

-- 기존 함수 삭제 (모든 오버로드)
DROP FUNCTION IF EXISTS public.create_user_record CASCADE;

-- RPC 함수 생성 (role 검증 강화)
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
BEGIN
  -- role 값 검증 및 정규화 (강화된 버전)
  -- 1단계: NULL/빈 문자열 처리
  IF p_role IS NULL OR TRIM(p_role) = '' THEN
    v_valid_role := 'member';
  ELSE
    -- 2단계: 대소문자 정규화 및 공백 제거
    v_valid_role := LOWER(TRIM(p_role));
  END IF;
  
  -- 3단계: 유효한 값인지 확인
  IF v_valid_role NOT IN ('admin', 'president', 'member') THEN
    -- 유효하지 않은 값이면 기본값 'member'로 설정
    RAISE WARNING 'Invalid role value: "%". Using default: member', p_role;
    v_valid_role := 'member';
  END IF;
  
  -- 4단계: 최종 검증 (이중 체크)
  IF v_valid_role IS NULL OR v_valid_role NOT IN ('admin', 'president', 'member') THEN
    RAISE EXCEPTION 'Role validation failed. Final role value: "%" (original: "%")', v_valid_role, p_role;
  END IF;
  
  -- RLS를 우회하여 직접 INSERT 수행
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
    RAISE EXCEPTION 'Check constraint violation: % (SQLSTATE: %). Role value attempted: "%"', SQLERRM, SQLSTATE, v_valid_role;
  WHEN OTHERS THEN
    -- 기타 에러 발생 시 상세 정보 반환
    RAISE EXCEPTION 'create_user_record 오류: % (SQLSTATE: %). Role value: "%"', SQLERRM, SQLSTATE, v_valid_role;
END;
$$;

-- 함수 실행 권한 부여
GRANT EXECUTE ON FUNCTION public.create_user_record(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_record(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.create_user_record(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;

-- 함수 소유자를 postgres로 변경 (RLS 우회를 위해)
ALTER FUNCTION public.create_user_record(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) OWNER TO postgres;

