-- 트리거 함수가 users 테이블에 INSERT할 수 있도록 RLS 정책 추가
-- SECURITY DEFINER 함수는 RLS를 우회해야 하지만, 명시적으로 정책을 추가하는 것이 더 안전합니다.

-- 기존 INSERT 정책 확인 및 수정
-- 트리거 함수가 INSERT할 수 있도록 허용하는 정책 추가

-- 트리거 함수가 INSERT할 수 있도록 하는 정책
-- 이 정책은 SECURITY DEFINER 함수가 RLS를 우회하지 못하는 경우를 위한 것입니다.
CREATE POLICY IF NOT EXISTS "Allow trigger function to insert users"
  ON public.users FOR INSERT
  WITH CHECK (true);  -- 모든 INSERT 허용 (트리거 함수용)

-- 하지만 위 정책은 너무 개방적이므로, 더 안전한 방법을 사용합니다:
-- 트리거 함수는 SECURITY DEFINER이므로 RLS를 우회해야 합니다.
-- 만약 여전히 작동하지 않으면, 아래 방법을 시도하세요:

-- 방법 1: RLS를 일시적으로 비활성화하는 정책 (권장하지 않음)
-- 방법 2: 트리거 함수가 service_role 권한으로 실행되도록 설정 (권장)

-- 위의 정책을 삭제하고 더 안전한 방법 사용
DROP POLICY IF EXISTS "Allow trigger function to insert users" ON public.users;

-- 대신: 트리거 함수가 올바르게 작동하는지 확인
-- SECURITY DEFINER 함수는 함수 소유자의 권한으로 실행되므로
-- 함수 소유자가 postgres 또는 service_role이면 RLS를 우회할 수 있어야 합니다.

