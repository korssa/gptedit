import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // 1. static-fallback 경로는 무조건 예외 처리 (리다이렉트 루프 방지)
  if (pathname.startsWith('/static-fallback')) {
    return NextResponse.next();
  }

  // ✅ 무조건 공개해야 하는 경로들 - 인증 우회
  const PUBLIC_PATHS = [
    '/manifest.json',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
  ]
  
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/api/public') ||
    PUBLIC_PATHS.includes(pathname) ||
    /^\/icon(-\d+x\d+)?\.png$/.exec(pathname) ||     // icon.png, icon-192x192.png ...
    /^\/apple-icon(-\d+x\d+)?\.png$/.exec(pathname)  // apple-icon-180x180.png ...
  ) {
    return NextResponse.next()
  }

  // 2. 구형 브라우저/기기 감지 (User-Agent 기반)
  const ua = req.headers.get('user-agent') || '';
  // Android 8.x 또는 Chrome 70 미만, 기타 React/Suspense 미지원 환경 감지
  const isOldAndroid = /Android 8\./.test(ua);
  const chromeMatch = ua.match(/Chrome\/(\d+)/);
  const chromeVer = chromeMatch ? parseInt(chromeMatch[1], 10) : null;
  const isOldChrome = chromeVer !== null && chromeVer < 70;
  // 기타: (필요시 추가)

  if (isOldAndroid || isOldChrome) {
    // 정적 폴백 페이지로 리다이렉트
    const url = req.nextUrl.clone();
    url.pathname = '/static-fallback/index.html';
    return NextResponse.redirect(url, 302);
  }

  // ... 나머지 기존 로직 (관리자 차단 등)
  return NextResponse.next()
}

export const config = {
  // 매처는 너무 넓히지 말고 기본은 전체, 위의 if로 우회
  matcher: ['/((?!_next/static|_next/image).*)'],
}
