-- 계좌 정보 테이블 (단일 행만 유지)
CREATE TABLE IF NOT EXISTS public.account_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank TEXT NOT NULL DEFAULT 'KB국민은행',
  account_number TEXT NOT NULL DEFAULT '123456-78-901234',
  account_holder TEXT NOT NULL DEFAULT '총동아리연합회',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_account_info_updated_at
  BEFORE UPDATE ON public.account_info
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 초기 데이터 삽입 (없는 경우에만)
INSERT INTO public.account_info (id, bank, account_number, account_holder)
SELECT gen_random_uuid(), 'KB국민은행', '123456-78-901234', '총동아리연합회'
WHERE NOT EXISTS (SELECT 1 FROM public.account_info);

-- RLS 활성화
ALTER TABLE public.account_info ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자는 조회 가능
CREATE POLICY "Authenticated users can view account info"
  ON public.account_info
  FOR SELECT
  TO authenticated
  USING (true);

-- 관리자만 수정 가능
CREATE POLICY "Admins can update account info"
  ON public.account_info
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

