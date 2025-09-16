import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // Permitir acesso a rotas públicas
    if (req.nextUrl.pathname.startsWith('/auth/')) {
      return NextResponse.next();
    }
    
    // Redirecionar usuários não autenticados para login
    if (!req.nextauth.token && req.nextUrl.pathname !== '/auth/signin') {
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Permitir acesso a rotas públicas
        if (req.nextUrl.pathname.startsWith('/auth/')) {
          return true;
        }
        
        // Para outras rotas, verificar se há token
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
