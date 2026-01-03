-- 사용자 테이블 생성
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'president', 'member')),
  club_name TEXT,
  phone_number TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_club_name ON users(club_name);

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_at 트리거 생성
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 정책 생성: 사용자는 자신의 정보만 조회 가능
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- 정책 생성: 사용자는 자신의 정보만 업데이트 가능
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 정책 생성: 모든 사용자는 자신의 레코드를 삽입 가능 (회원가입 시)
CREATE POLICY "Users can insert own record"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 정책 생성: 관리자는 모든 사용자 정보 조회 가능
-- 순환 참조를 피하기 위해 auth.users의 metadata에서 role 확인
-- 참고: 자신의 정보는 "Users can view own profile" 정책으로 이미 처리됨
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (
    -- auth.users의 metadata에서 role이 'admin'인 경우
    (
      SELECT (raw_user_meta_data->>'role')::text = 'admin'
      FROM auth.users
      WHERE auth.users.id = auth.uid()
    )
  );

-- 정책 생성: 관리자는 모든 사용자 정보 업데이트 가능
CREATE POLICY "Admins can update all users"
  ON users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 정책 생성: 관리자는 모든 사용자 정보 삭제 가능
CREATE POLICY "Admins can delete all users"
  ON users FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

