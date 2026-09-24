import * as React from 'react';

export interface Paginacao<T> {
  pagina: number;
  linhasPorPagina: number;
  itensPaginados: T[];
  aoMudarPagina: (_event: unknown, novaPagina: number) => void;
  aoMudarLinhasPorPagina: (event: React.ChangeEvent<HTMLInputElement>) => void;
  resetarPagina: () => void;
}

export function usePaginacao<T>(itens: T[], linhasPorPaginaInicial = 10): Paginacao<T> {
  const [pagina, setPagina] = React.useState(0);
  const [linhasPorPagina, setLinhasPorPagina] = React.useState(linhasPorPaginaInicial);

  const itensPaginados = React.useMemo(
    () => itens.slice(pagina * linhasPorPagina, pagina * linhasPorPagina + linhasPorPagina),
    [itens, pagina, linhasPorPagina]
  );

  function aoMudarPagina(_event: unknown, novaPagina: number): void {
    setPagina(novaPagina);
  }

  function aoMudarLinhasPorPagina(event: React.ChangeEvent<HTMLInputElement>): void {
    setLinhasPorPagina(Number(event.target.value));
    setPagina(0);
  }

  function resetarPagina(): void {
    setPagina(0);
  }

  return { pagina, linhasPorPagina, itensPaginados, aoMudarPagina, aoMudarLinhasPorPagina, resetarPagina };
}
