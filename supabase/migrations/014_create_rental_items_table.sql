-- 물품 관리 테이블
CREATE TABLE IF NOT EXISTS public.rental_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (price >= 0),
  available INTEGER NOT NULL DEFAULT 0 CHECK (available >= 0),
  total INTEGER NOT NULL DEFAULT 0 CHECK (total >= 0),
  description TEXT,
  deposit INTEGER NOT NULL DEFAULT 0 CHECK (deposit >= 0),
  image TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT available_not_exceed_total CHECK (available <= total)
);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rental_items_updated_at
  BEFORE UPDATE ON public.rental_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS 활성화
ALTER TABLE public.rental_items ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자는 조회 가능
CREATE POLICY "Authenticated users can view rental items"
  ON public.rental_items
  FOR SELECT
  TO authenticated
  USING (true);

-- 관리자만 수정/삭제 가능
CREATE POLICY "Admins can manage rental items"
  ON public.rental_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- 재고 차감 함수
CREATE OR REPLACE FUNCTION decrement_rental_item_available(
  item_id UUID,
  quantity INTEGER
)
RETURNS void AS $$
BEGIN
  UPDATE public.rental_items
  SET available = GREATEST(0, available - quantity)
  WHERE id = item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

