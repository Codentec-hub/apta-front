import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Paliativo temporário (Fase B do SIEG): o callback OAuth cadastrado no
// SIEG para o nosso clientId está apontando pro frontend em vez da API
// (api.contabilidadeapta.com.br/sieg/oauth/callback) -- confirmado com o
// suporte deles ainda pendente (feriado). Enquanto isso, se o SIEG cair
// aqui com AccessToken+state na URL, repassa pro callback real da API.
// Remover depois que o suporte corrigir o cadastro.
export function middleware(request: NextRequest): NextResponse {
  const { searchParams } = request.nextUrl;
  const accessToken = searchParams.get('AccessToken');
  const state = searchParams.get('state');

  if (accessToken && state) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.contabilidadeapta.com.br';
    const destino = new URL('/sieg/oauth/callback', apiUrl);
    destino.search = request.nextUrl.search;
    return NextResponse.redirect(destino);
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/dashboard/:path*',
};
