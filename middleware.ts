import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/middleware';

export async function middleware(request: NextRequest) {
  // 환경 변수 확인
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  // 환경 변수가 없으면 에러 메시지와 함께 계속 진행 (개발 환경)
  if (!supabaseUrl || !supabaseKey) {
    console.error('⚠️ Supabase 환경 변수가 설정되지 않았습니다.');
    console.error('📝 .env.local 파일에 NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY를 설정하세요.');
    console.error('🔗 https://supabase.com/dashboard/project/_/settings/api');
    
    // 환경 변수가 없어도 개발을 계속할 수 있도록 공개 경로는 허용
    const { pathname } = request.nextUrl;
    const publicPaths = ['/login', '/register'];
    const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));
    
    if (!isPublicPath) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    return NextResponse.next();
  }

  // Supabase 클라이언트 생성
  const { supabase, response } = createClient(request);

  // 세션 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // 공개 경로 (인증 불필요)
  const publicPaths = ['/login', '/register', '/'];
  const isPublicPath = publicPaths.some((path) => pathname === path || (path !== '/' && pathname.startsWith(path)));

  // 관리자 전용 경로
  const adminPaths = ['/admin'];
  const isAdminPath = adminPaths.some((path) => pathname.startsWith(path));

  // 인증이 필요한 경로
  const protectedPaths = ['/reservation', '/office-hour', '/notice', '/suggestion', '/user'];
  const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path));

  // 홈 페이지
  const isHomePage = pathname === '/';

  // 루트 경로이고 이미 로그인한 경우
  if (isHomePage && user) {
    // users 테이블에서 사용자 정보 확인
    const { data: userData } = await supabase
      .from('users')
      .select('role, status')
      .eq('id', user.id)
      .single();

    if (userData) {
      // 관리자는 admin 페이지로, 일반 사용자는 /user로
      if (userData.role === 'admin') {
        return NextResponse.redirect(new URL('/admin', request.url));
      } else {
        return NextResponse.redirect(new URL('/user', request.url));
      }
    }
  }

  // 공개 경로(로그인/회원가입)이고 이미 로그인한 경우
  if ((pathname === '/login' || pathname === '/register') && user) {
    const { data: userData } = await supabase
      .from('users')
      .select('role, status')
      .eq('id', user.id)
      .single();

    if (userData) {
      if (userData.role === 'admin') {
        return NextResponse.redirect(new URL('/admin', request.url));
      } else {
        return NextResponse.redirect(new URL('/user', request.url));
      }
    }
  }

  // 인증이 필요한 경로인데 로그인하지 않은 경우
  if (isProtectedPath && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 관리자 전용 경로인데 로그인하지 않은 경우
  if (isAdminPath && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 로그인한 사용자의 경우 users 테이블에서 정보 확인
  if (user) {
    // 먼저 자신의 정보만 조회 (RLS 정책으로 인해 안전)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, status')
      .eq('id', user.id)
      .single();

    // users 테이블 조회 에러 처리
    if (userError) {
      console.error('users 테이블 조회 오류:', userError);
      // RLS 정책 문제일 수 있으므로, 관리자 경로는 일단 허용
      // 공개 경로가 아니고 관리자 경로도 아니면 홈으로 리다이렉트
      if (!isPublicPath && !isAdminPath) {
        return NextResponse.redirect(new URL('/', request.url));
      }
      // 관리자 경로는 일단 통과 (나중에 페이지에서 확인)
      return response;
    }

    if (userData) {
      // 승인되지 않은 사용자는 로그인/회원가입 페이지만 접근 가능
      if (userData.status !== 'active' && !isPublicPath) {
        return NextResponse.redirect(new URL('/login?status=pending', request.url));
      }

      // 관리자 전용 경로인데 관리자가 아닌 경우
      if (isAdminPath && userData.role !== 'admin') {
        return NextResponse.redirect(new URL('/', request.url));
      }
    } else {
      // users 테이블에 레코드가 없는 경우 (회원가입 미완료)
      if (!isPublicPath) {
        return NextResponse.redirect(new URL('/register', request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

