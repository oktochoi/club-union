-- 'leader' 역할을 'president'로 변경하는 마이그레이션
-- 기존 데이터베이스에 'leader' 역할이 있는 경우 'president'로 업데이트

-- 1. users 테이블의 CHECK 제약조건 업데이트
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'president', 'member'));

-- 2. 기존 'leader' 역할을 'president'로 변경
UPDATE users SET role = 'president' WHERE role = 'leader';

-- 3. 인덱스는 자동으로 업데이트되므로 별도 작업 불필요

