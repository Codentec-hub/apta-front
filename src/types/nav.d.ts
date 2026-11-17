export interface NavItemConfig {
  key: string;
  title?: string;
  disabled?: boolean;
  external?: boolean;
  label?: string;
  icon?: string;
  href?: string;
  items?: NavItemConfig[];
  // Matcher cannot be a function in order
  // to be able to use it on the server.
  // If you need to match multiple paths,
  // can extend it to accept multiple matchers.
  matcher?: { type: 'startsWith' | 'equals'; href: string };
  /** Fica destacado também nestes caminhos (ex.: "Configurações" em /dashboard/usuarios). */
  ativoEm?: string[];
  /** Grupo na página de Configurações. */
  grupo?: string;
  /** Só aparece para estes perfis (sem a lista, aparece para todos). */
  perfis?: ('ADMIN' | 'GESTOR' | 'OPERACIONAL')[];
}
