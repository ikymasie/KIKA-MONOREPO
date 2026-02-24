import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const publicRoutes = ['/', '/auth/signin', '/auth/admin/signin', '/auth/error', '/regulator/auth/signin', '/directory', '/directory/search'];

export default withAuth(
    function middleware(req) {
        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ req, token }) => {
                const { pathname } = req.nextUrl;

                // Always allow public routes
                if (publicRoutes.includes(pathname) || pathname.startsWith('/directory') || pathname.startsWith('/api/') || pathname.startsWith('/_next/')) {
                    return true;
                }

                // All other routes require a valid session token (NextAuth)
                return !!token;
            },
        },
        pages: {
            signIn: '/auth/signin',
        }
    }
);

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (public folder)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
