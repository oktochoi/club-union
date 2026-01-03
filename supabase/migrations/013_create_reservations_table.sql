-- 예약(reservations) 테이블 생성
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  facility_name TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  purpose TEXT NOT NULL,
  participants INTEGER NOT NULL DEFAULT 1,
  contact TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  rejection_reason TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_facility_id ON reservations(facility_id);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_facility_date ON reservations(facility_id, date);

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) 활성화
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- 정책 생성: 사용자는 자신의 예약을 조회할 수 있음
CREATE POLICY "Users can view own reservations"
  ON reservations FOR SELECT
  USING (auth.uid() = user_id);

-- 정책 생성: 사용자는 자신의 예약을 생성할 수 있음
CREATE POLICY "Users can create own reservations"
  ON reservations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 정책 생성: 관리자는 모든 예약을 조회할 수 있음
CREATE POLICY "Admins can view all reservations"
  ON reservations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 정책 생성: 관리자는 모든 예약을 수정할 수 있음 (승인/거절)
CREATE POLICY "Admins can update all reservations"
  ON reservations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 정책 생성: 관리자는 모든 예약을 삭제할 수 있음
CREATE POLICY "Admins can delete all reservations"
  ON reservations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

