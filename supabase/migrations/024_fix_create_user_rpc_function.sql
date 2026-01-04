-- RPC 함수 재생성: 회원가입 후 users 테이블에 레코드를 생성
-- SECURITY DEFINER로 실행되어 RLS를 우회합니다.
-- 이전 버전과 호환성을 위해 기존 함수를 삭제하고 재생성

-- 기존 함수 삭제
DROP FUNCTION IF EXISTS public.create_user_record(UUID, TEXT, TEXT, TEXT, TEXT, TEXT);

-- RPC 함수 생성
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
BEGIN
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
    p_role,
    'pending',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    club_name = EXCLUDED.club_name,
    phone_number = EXCLUDED.phone_number,
    role = EXCLUDED.role,
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
  WHEN OTHERS THEN
    -- 에러 발생 시 상세 정보 반환
    RAISE EXCEPTION 'create_user_record 오류: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END;
$$;

-- 함수 실행 권한 부여
GRANT EXECUTE ON FUNCTION public.create_user_record(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_record(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.create_user_record(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;

-- 함수 소유자를 postgres로 변경 (RLS 우회를 위해)
ALTER FUNCTION public.create_user_record(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) OWNER TO postgres;

