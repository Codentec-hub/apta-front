import type { NavItemConfig } from '@/types/nav';
import { paths } from '@/paths';

export const navItems = [
  { key: 'overview', title: 'Painel geral', href: paths.dashboard.overview, icon: 'house' },
  { key: 'clientes', title: 'Clientes', href: paths.dashboard.clientes, icon: 'buildings' },
  { key: 'obrigacoes', title: 'Obrigações', href: paths.dashboard.obrigacoes, icon: 'clipboard-text' },
  { key: 'demandas', title: 'Demandas', href: paths.dashboard.demandas, icon: 'kanban', label: 'Em breve' },
  { key: 'atendimento', title: 'Atendimento', href: paths.dashboard.atendimento, icon: 'headset' },
  { key: 'fiscal', title: 'Fiscal', href: paths.dashboard.fiscal, icon: 'receipt', label: 'Em breve' },
  { key: 'folha', title: 'Folha de Pagamento', href: paths.dashboard.folha, icon: 'wallet', label: 'Em breve' },
  { key: 'financeiro', title: 'Financeiro', href: paths.dashboard.financeiro, icon: 'bank', label: 'Em breve' },
  { key: 'contabil', title: 'Contábil', href: paths.dashboard.contabil, icon: 'calculator', label: 'Em breve' },
  { key: 'automacao', title: 'Automação e IA', href: paths.dashboard.automacao, icon: 'robot', label: 'Em breve' },
] satisfies NavItemConfig[];

export const settingsNavItems = [
  { key: 'setores', title: 'Setores', href: paths.dashboard.setores, icon: 'squares-four' },
  { key: 'feriados', title: 'Feriados', href: paths.dashboard.feriados, icon: 'calendar' },
  { key: 'emails-cliente', title: 'E-mails ao cliente', href: paths.dashboard.emailsCliente, icon: 'envelope' },
  { key: 'agentes', title: 'Agentes de IA', href: paths.dashboard.agentes, icon: 'robot' },
  { key: 'usuarios', title: 'Usuários', href: paths.dashboard.usuarios, icon: 'users-three' },
  {
    key: 'integracoes',
    title: 'Integrações',
    href: paths.dashboard.integracoes,
    icon: 'plugs-connected',
    label: 'Em breve',
  },
] satisfies NavItemConfig[];
