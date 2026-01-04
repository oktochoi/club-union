# Supabase Auth → Users Table 동기화 문제 분석 및 해결

## 문제 현상

- ✅ `auth.users`에는 유저가 정상적으로 생성됨
- ❌ `public.users`에는 신규 유저 레코드가 생성되지 않음
- ⚠️ 노트북에서는 정상 작동, 다른 기기/신규 유저에서는 실패

## 원인 분석

### 1. 트리거 함수 문제

**현재 상태:**
- `handle_new_user()` 트리거 함수가 존재하지만 제대로 작동하지 않음
- 여러 버전의 트리거 함수가 혼재되어 있음 (009, 018, 019, 021)
- 함수 소유자가 `authenticated` 또는 `anon`일 수 있어 RLS를 우회하지 못함

**문제점:**
- `SECURITY DEFINER`로 설정되어 있어도 함수 소유자가 잘못되면 RLS를 우회하지 못함
- 트리거가 비활성화되었을 수 있음
- 트리거 함수 내부에서 오류가 발생해도 조용히 실패할 수 있음

### 2. RLS 정책 문제

**현재 정책:**
```sql
CREATE POLICY "Users can insert own record"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);
```

**문제점:**
- 트리거 함수는 `SECURITY DEFINER`이므로 이 정책을 우회해야 하지만, 함수 소유자가 잘못되면 우회하지 못함
- 트리거 실행 시점에 `auth.uid()`가 NULL일 수 있음 (트리거는 시스템 레벨에서 실행)

### 3. NOT NULL 제약 조건 문제

**현재 제약 조건:**
- `email TEXT NOT NULL` - OAuth 로그인 시 email이 null일 수 있음
- `name TEXT NOT NULL` - metadata에 name이 없을 수 있음
- `role TEXT NOT NULL` - metadata에 role이 없을 수 있음

**문제점:**
- OAuth 로그인 시 email이 null이면 INSERT 실패
- metadata에 필수 정보가 없으면 기본값 처리 필요

### 4. 신규 유저만 실패하는 이유

**가능한 원인:**
1. **트리거 비활성화**: 트리거가 비활성화되었거나 삭제됨
2. **함수 소유자 문제**: 함수 소유자가 `authenticated` 또는 `anon`이면 RLS를 우회하지 못함
3. **RLS 정책 변경**: 최근 RLS 정책이 변경되어 트리거 함수의 INSERT를 막음
4. **트리거 함수 오류**: 함수 내부에서 오류가 발생하지만 조용히 실패

**노트북에서 정상 작동하는 이유:**
- 이미 생성된 유저는 `public.users`에 레코드가 있어서 문제가 없음
- 로컬 환경과 프로덕션 환경의 설정이 다를 수 있음

## 해결 방법

### 1. 트리거 함수 재생성 (권장)

`supabase/migrations/026_comprehensive_user_sync_fix.sql` 파일을 실행하세요.

**주요 개선사항:**
- ✅ `SECURITY DEFINER`로 RLS 우회 보장
- ✅ 함수 소유자를 `postgres`로 설정
- ✅ OAuth 로그인 시 email null 처리
- ✅ 모든 NOT NULL 제약 조건 충족
- ✅ role 검증 및 정규화
- ✅ 상세한 오류 로깅
- ✅ 기존 누락된 레코드 백필

### 2. RPC 함수 사용 (현재 구현)

현재 코드는 트리거 대신 RPC 함수(`create_user_record`)를 사용하고 있습니다.

**장점:**
- 트리거보다 명시적이고 제어 가능
- 오류 처리 및 재시도 가능
- 클라이언트에서 직접 호출 가능

**단점:**
- 클라이언트 코드에서 호출해야 함
- 네트워크 오류 시 실패 가능
- 트리거보다 느림

### 3. 하이브리드 접근 (최적)

**트리거 + RPC 함수 병행:**
- 트리거: 기본 동기화 (자동)
- RPC 함수: 트리거 실패 시 대체 (수동)

현재 코드는 이미 이 방식을 사용하고 있습니다.

## 권장 Supabase Auth + User Table 구조

### 1. 트리거 기반 자동 동기화

```sql
-- 트리거 함수: auth.users → public.users 자동 동기화
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, status, ...)
  VALUES (...)
  ON CONFLICT (id) DO UPDATE SET ...;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '트리거 오류: %', SQLERRM;
    RETURN NEW; -- 트리거 실패해도 auth.users 생성은 계속
END;
$$;

-- 함수 소유자를 postgres로 설정 (중요!)
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- 트리거 생성
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### 2. RPC 함수 기반 수동 동기화 (백업)

```sql
-- RPC 함수: 트리거 실패 시 수동 호출
CREATE OR REPLACE FUNCTION public.create_user_record(...)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.users (...)
  VALUES (...)
  ON CONFLICT (id) DO UPDATE SET ...;
  RETURN to_jsonb(...);
END;
$$;

ALTER FUNCTION public.create_user_record(...) OWNER TO postgres;
```

### 3. 클라이언트 코드

```typescript
// 1. Supabase Auth에 사용자 생성
const { data: authData } = await supabase.auth.signUp({...});

// 2. 트리거가 자동으로 public.users에 레코드 생성
// 3. 트리거 실패 시 RPC 함수로 수동 생성
if (!userData) {
  await supabase.rpc('create_user_record', {...});
}
```

### 4. RLS 정책

```sql
-- 사용자는 자신의 레코드만 조회/수정 가능
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 트리거 함수는 SECURITY DEFINER이므로 RLS를 우회
-- 별도의 INSERT 정책이 필요 없음
```

## 체크리스트

### Supabase Dashboard 확인 사항

1. **Database > Functions**
   - [ ] `handle_new_user` 함수가 존재하는지 확인
   - [ ] 함수 소유자가 `postgres` 또는 `service_role`인지 확인
   - [ ] 함수가 `SECURITY DEFINER`로 설정되어 있는지 확인

2. **Database > Triggers**
   - [ ] `on_auth_user_created` 트리거가 존재하는지 확인
   - [ ] 트리거가 활성화되어 있는지 확인 (enabled = true)
   - [ ] 트리거가 `handle_new_user` 함수를 호출하는지 확인

3. **Database > Tables > users > RLS**
   - [ ] RLS가 활성화되어 있는지 확인
   - [ ] INSERT 정책이 올바르게 설정되어 있는지 확인
   - [ ] `SECURITY DEFINER` 함수가 RLS를 우회할 수 있는지 확인

4. **Database > Tables > users > Constraints**
   - [ ] NOT NULL 제약 조건 확인
   - [ ] CHECK 제약 조건 확인 (role, status)

### 테스트 방법

1. **신규 사용자 회원가입**
   ```sql
   -- auth.users에 생성되었는지 확인
   SELECT id, email FROM auth.users WHERE email = 'test@example.com';
   
   -- public.users에 생성되었는지 확인
   SELECT id, email FROM public.users WHERE email = 'test@example.com';
   ```

2. **트리거 함수 수동 테스트**
   ```sql
   -- 트리거 함수 직접 호출 (테스트용)
   SELECT public.handle_new_user();
   ```

3. **RPC 함수 수동 테스트**
   ```sql
   -- RPC 함수 직접 호출 (테스트용)
   SELECT public.create_user_record(
     'user-id'::uuid,
     'test@example.com',
     'Test User',
     NULL,
     NULL,
     'member'
   );
   ```

## 재발 방지

1. **트리거 함수 모니터링**
   - Supabase 로그에서 트리거 오류 확인
   - 정기적으로 누락된 레코드 확인

2. **백필 함수 실행**
   - 주기적으로 `backfill_missing_users()` 함수 실행
   - 누락된 레코드 자동 복구

3. **클라이언트 코드 개선**
   - 트리거 실패 시 RPC 함수로 자동 대체
   - 오류 로깅 및 모니터링 강화

4. **문서화**
   - 트리거 및 RPC 함수 사용법 문서화
   - 문제 발생 시 대응 절차 문서화

