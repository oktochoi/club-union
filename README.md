# Club Union - 총동아리연합회 통합 관리 시스템

총동아리연합회를 위한 통합 관리 시스템입니다. 시설 예약, 장비 대여, 공지사항, 건의사항 등 동아리 활동에 필요한 모든 서비스를 한 곳에서 제공합니다.

## 주요 기능

### 사용자 기능
- **시설 예약**: 동아리방, 공연장 등 다양한 시설을 온라인으로 예약
- **장비 대여**: 음향장비, 프로젝터 등 필요한 장비를 합리적인 가격으로 대여
- **공지사항**: 중요한 공지사항과 행사 정보를 실시간으로 확인
- **건의사항**: 동아리 활동 개선을 위한 건의사항 제출

### 관리자 기능
- **사용자 관리**: 회원가입 승인/거절, 사용자 상태 관리
- **시설 관리**: 시설 추가/수정/삭제, 예약 현황 확인 및 승인/거절
- **장비 관리**: 대여 물품 추가/수정/삭제, 재고 관리, 대여 신청 승인/거절/반납 처리
- **계좌 관리**: 전역 계좌 정보 관리 (은행, 계좌번호, 예금주)

## 기술 스택

- **Frontend**: Next.js 15 (App Router), React, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Row Level Security)
- **Deployment**: Vercel

## 시작하기

### 필수 요구사항

- Node.js 18 이상
- npm, yarn, pnpm 또는 bun
- Supabase 계정 및 프로젝트

### 설치

```bash
# 의존성 설치
npm install
# 또는
yarn install
# 또는
pnpm install
```

### 환경 변수 설정

`.env.local` 파일을 생성하고 다음 환경 변수를 설정하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_anon_key
```

환경 변수는 Supabase Dashboard > Settings > API에서 확인할 수 있습니다.

### 데이터베이스 마이그레이션

Supabase Dashboard > SQL Editor에서 다음 순서로 마이그레이션 파일을 실행하세요:

1. `supabase/migrations/001_create_users_table.sql` - 사용자 테이블 생성
2. `supabase/migrations/009_create_user_trigger.sql` - 사용자 자동 생성 트리거
3. `supabase/migrations/011_update_role_leader_to_president.sql` - 역할 업데이트
4. `supabase/migrations/012_create_facilities_table.sql` - 시설 테이블 생성
5. `supabase/migrations/013_create_reservations_table.sql` - 예약 테이블 생성
6. `supabase/migrations/014_create_rental_items_table.sql` - 대여 물품 테이블 생성
7. `supabase/migrations/015_create_rental_requests_table.sql` - 대여 신청 테이블 생성
8. `supabase/migrations/016_create_account_info_table.sql` - 계좌 정보 테이블 생성
9. `supabase/migrations/017_add_returned_status_to_rental_requests.sql` - 반납 상태 추가

### 개발 서버 실행

```bash
npm run dev
# 또는
yarn dev
# 또는
pnpm dev
# 또는
bun dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 프로젝트 구조

```
club-union/
├── src/
│   ├── app/                    # Next.js App Router 페이지
│   │   ├── admin/              # 관리자 페이지
│   │   │   ├── facilities/     # 시설 관리
│   │   │   ├── rentals/        # 장비 대여 관리
│   │   │   ├── reservations/   # 예약 관리
│   │   │   └── users/          # 사용자 관리
│   │   ├── login/              # 로그인
│   │   ├── register/           # 회원가입
│   │   ├── reservation/        # 시설 예약
│   │   ├── office-hour/        # 장비 대여
│   │   ├── user/               # 사용자 대시보드
│   │   └── page.tsx            # 환영 페이지
│   ├── components/             # 재사용 가능한 컴포넌트
│   ├── lib/                    # 라이브러리 및 유틸리티
│   │   └── supabase/           # Supabase 관련 함수
│   ├── hooks/                  # React 커스텀 훅
│   ├── types/                  # TypeScript 타입 정의
│   └── utils/                  # 유틸리티 함수
├── supabase/
│   └── migrations/             # 데이터베이스 마이그레이션 파일
├── middleware.ts               # Next.js 미들웨어 (인증 처리)
└── next.config.ts              # Next.js 설정
```

## 주요 기능 설명

### 인증 시스템
- Supabase Authentication을 사용한 이메일/비밀번호 로그인
- 역할 기반 접근 제어 (관리자, 회장, 회원)
- 미들웨어를 통한 자동 인증 확인 및 리다이렉트

### 보안
- Row Level Security (RLS)로 데이터베이스 레벨 보안
- 사용자는 자신의 데이터만 접근 가능
- 관리자는 모든 데이터 접근 가능
- 프로덕션 환경에서 console.log 자동 제거

### 시설 예약
- 7일간의 시간표로 시설 예약 현황 확인
- 실시간 예약 가능 여부 표시
- 관리자 승인/거절 시스템

### 장비 대여
- 대여 물품 목록 및 재고 확인
- 대여 신청 및 관리자 승인/거절
- 반납 완료 처리 및 자동 재고 복구

## 배포

### Vercel 배포

1. GitHub에 프로젝트 푸시
2. Vercel에 프로젝트 연결
3. 환경 변수 설정:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
4. 배포 완료

### 빌드

```bash
npm run build
```

프로덕션 빌드를 생성합니다.

## 사용자 역할

- **관리자 (admin)**: 모든 기능 접근 가능
- **회장 (president)**: 일반 사용자 기능 + 동아리 관리
- **회원 (member)**: 일반 사용자 기능

## 라이선스

이 프로젝트는 비공개 프로젝트입니다.

## 문의

프로젝트 관련 문의사항이 있으시면 관리자에게 연락해주세요.
