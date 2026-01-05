-- 간단한 RLS 정책 (관리자 정책 없이)
-- permission denied 오류 해결을 위한 최소한의 정책

-- 1. 기존 RLS 정책 모두 삭제
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own record" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Admins can delete all users" ON public.users;

-- 2. RLS 활성화 확인
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. 최소한의 정책만 생성 (순환 참조 없음)

-- 3-1. 사용자는 자신의 정보만 조회 가능
CREATE POLICY "Users can view own profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 3-2. 사용자는 자신의 정보만 업데이트 가능
CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 3-3. 사용자는 자신의 레코드를 삽입 가능 (회원가입 시)
CREATE POLICY "Users can insert own record"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 참고: 관리자 정책은 나중에 추가할 수 있습니다.
-- 일단 기본 정책만으로 로그인이 작동하는지 확인하세요.

-- 4. 정책 확인 (실행 후 확인용)
-- 다음 쿼리로 정책이 제대로 생성되었는지 확인할 수 있습니다:
/*
SELECT 
  policyname,
  cmd as operation,
  qual as using_expression
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;
*/

