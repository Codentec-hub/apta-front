import type { NavItemConfig } from '@/types/nav';

export function isNavItemActive({
  disabled,
  external,
  href,
  matcher,
  pathname,
  ativoEm,
}: Pick<NavItemConfig, 'disabled' | 'external' | 'href' | 'matcher' | 'ativoEm'> & { pathname: string }): boolean {
  if (disabled || !href || external) {
    return false;
  }

  if (ativoEm?.some((caminho) => pathname === caminho || pathname.startsWith(`${caminho}/`))) {
    return true;
  }

  if (matcher) {
    if (matcher.type === 'startsWith') {
      return pathname.startsWith(matcher.href);
    }

    if (matcher.type === 'equals') {
      return pathname === matcher.href;
    }

    return false;
  }

  return pathname === href;
}
