import type { NavItemConfig } from '@/types/nav';
import { paths } from '@/paths';

export const navItems = [
  { key: 'overview', title: 'Painel geral', href: paths.dashboard.overview, icon: 'house' },
  { key: 'clientes', title: 'Clientes', href: paths.dashboard.clientes, icon: 'buildings' },
  { key: 'obrigacoes', title: 'Obrigações', href: paths.dashboard.obrigacoes, icon: 'clipboard-text' },
  { key: 'demandas', title: 'Demandas', href: paths.dashboard.demandas, icon: 'kanban', label: 'Em breve' },
  { key: 'atendimento', title: 'Atendimento', href: paths.dashboard.atendimento, icon: 'headset' },
  { key: 'fiscal', title: 'Fiscal', href: paths.dashboard.fiscal, icon: 'receipt', label: 'Em breve' },
  { key: 'sieg', title: 'SIEG · Notas fiscais', href: paths.dashboard.sieg, icon: 'files' },
  { key: 'folha', title: 'Folha de Pagamento', href: paths.dashboard.folha, icon: 'wallet', label: 'Em breve' },
  { key: 'financeiro', title: 'Financeiro', href: paths.dashboard.financeiro, icon: 'bank', label: 'Em breve', perfis: ['ADMIN', 'GESTOR'] },
  { key: 'contabil', title: 'Contábil', href: paths.dashboard.contabil, icon: 'calculator', label: 'Em breve' },
  { key: 'automacao', title: 'Automação e IA', href: paths.dashboard.automacao, icon: 'robot', label: 'Em breve' },
] satisfies NavItemConfig[];

export const settingsNavItems = [
  { key: 'setores', perfis: ['ADMIN', 'GESTOR'], title: 'Setores', href: paths.dashboard.setores, icon: 'squares-four' },
  { key: 'feriados', perfis: ['ADMIN', 'GESTOR'], title: 'Feriados', href: paths.dashboard.feriados, icon: 'calendar' },
  { key: 'emails-cliente', perfis: ['ADMIN', 'GESTOR'], title: 'E-mails ao cliente', href: paths.dashboard.emailsCliente, icon: 'envelope' },
  { key: 'agentes', perfis: ['ADMIN', 'GESTOR'], title: 'Agentes de IA', href: paths.dashboard.agentes, icon: 'robot' },
  { key: 'usuarios', perfis: ['ADMIN'], title: 'Usuários', href: paths.dashboard.usuarios, icon: 'users-three' },
  {
    key: 'integracoes',
    title: 'Integrações',
    href: paths.dashboard.integracoes,
    icon: 'plugs-connected',
    label: 'Em breve',
    perfis: ['ADMIN', 'GESTOR'],
  },
] satisfies NavItemConfig[];

/** Itens que o perfil pode ver. */
export function itensDoPerfil(itens: NavItemConfig[], perfil: string | undefined): NavItemConfig[] {
  return itens.filter((i) => !i.perfis || (perfil !== undefined && (i.perfis as string[]).includes(perfil)));
}
