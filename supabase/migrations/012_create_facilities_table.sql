-- 시설(facilities) 테이블 생성
CREATE TABLE IF NOT EXISTS facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  capacity TEXT NOT NULL,
  equipment TEXT,
  time_slots TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_facilities_name ON facilities(name);
CREATE INDEX IF NOT EXISTS idx_facilities_status ON facilities(status);

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_facilities_updated_at
  BEFORE UPDATE ON facilities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) 활성화
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;

-- 정책 생성: 모든 인증된 사용자는 시설을 조회할 수 있음
CREATE POLICY "Authenticated users can view facilities"
  ON facilities FOR SELECT
  USING (auth.role() = 'authenticated');

-- 정책 생성: 관리자만 시설을 추가할 수 있음
CREATE POLICY "Admins can insert facilities"
  ON facilities FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 정책 생성: 관리자만 시설을 수정할 수 있음
CREATE POLICY "Admins can update facilities"
  ON facilities FOR UPDATE
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

-- 정책 생성: 관리자만 시설을 삭제할 수 있음
CREATE POLICY "Admins can delete facilities"
  ON facilities FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

