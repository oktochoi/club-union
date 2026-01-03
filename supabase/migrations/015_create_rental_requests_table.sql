-- 대여 신청 테이블
CREATE TABLE IF NOT EXISTS public.rental_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.rental_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  rental_date DATE NOT NULL,
  return_date DATE NOT NULL,
  total_price INTEGER NOT NULL CHECK (total_price >= 0),
  deposit INTEGER NOT NULL DEFAULT 0 CHECK (deposit >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  applicant TEXT NOT NULL,
  club TEXT,
  contact TEXT NOT NULL,
  purpose TEXT,
  admin_notes TEXT,
  rejection_reason TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT return_date_after_rental_date CHECK (return_date >= rental_date)
);

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_rental_requests_updated_at
  BEFORE UPDATE ON public.rental_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS 활성화
ALTER TABLE public.rental_requests ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 신청만 조회 가능
CREATE POLICY "Users can view own rental requests"
  ON public.rental_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 관리자는 모든 신청 조회 가능
CREATE POLICY "Admins can view all rental requests"
  ON public.rental_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- 인증된 사용자는 신청 생성 가능
CREATE POLICY "Authenticated users can create rental requests"
  ON public.rental_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 관리자는 신청 수정 가능 (승인/거절)
CREATE POLICY "Admins can update rental requests"
  ON public.rental_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- 관리자는 신청 삭제 가능
CREATE POLICY "Admins can delete rental requests"
  ON public.rental_requests
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

