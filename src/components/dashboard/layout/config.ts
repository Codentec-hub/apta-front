import type { NavItemConfig } from '@/types/nav';
import { paths } from '@/paths';

export const navItems = [
  { key: 'overview', title: 'Painel geral', href: paths.dashboard.overview, icon: 'house' },
  { key: 'clientes', title: 'Clientes', href: paths.dashboard.clientes, icon: 'buildings' },
  { key: 'obrigacoes', title: 'Obrigações', href: paths.dashboard.obrigacoes, icon: 'clipboard-text' },
  { key: 'demandas', title: 'Demandas', href: paths.dashboard.demandas, icon: 'kanban', label: 'Em breve' },
  { key: 'atendimento', title: 'Atendimento', href: paths.dashboard.atendimento, icon: 'headset' },
  { key: 'leads', title: 'Leads', href: paths.dashboard.leads, icon: 'funil' },
  { key: 'agenda', title: 'Agenda', href: paths.dashboard.agenda, icon: 'agenda' },
  { key: 'fiscal', title: 'Fiscal', href: paths.dashboard.fiscal, icon: 'receipt', label: 'Em breve' },
  { key: 'sieg', title: 'Notas fiscais', href: paths.dashboard.sieg, icon: 'files' },
  { key: 'folha', title: 'Folha de Pagamento', href: paths.dashboard.folha, icon: 'wallet', label: 'Em breve' },
  { key: 'financeiro', title: 'Financeiro', href: paths.dashboard.financeiro, icon: 'bank', label: 'Em breve', perfis: ['ADMIN', 'GESTOR'] },
  { key: 'contabil', title: 'Contábil', href: paths.dashboard.contabil, icon: 'calculator', label: 'Em breve' },
  { key: 'automacao', title: 'Automação e IA', href: paths.dashboard.automacao, icon: 'robot', label: 'Em breve' },
] satisfies NavItemConfig[];

/** Páginas de Configurações (menu lateral da própria página), por grupo. */
export const settingsNavItems = [
  { key: 'escritorio', grupo: 'Escritório', perfis: ['ADMIN', 'GESTOR'], title: 'Dados do escritório', href: paths.dashboard.escritorio, icon: 'escritorio' },
  { key: 'usuarios', grupo: 'Escritório', perfis: ['ADMIN'], title: 'Usuários e perfis', href: paths.dashboard.usuarios, icon: 'users-three' },
  { key: 'setores', grupo: 'Escritório', perfis: ['ADMIN', 'GESTOR'], title: 'Setores', href: paths.dashboard.setores, icon: 'squares-four' },
  { key: 'feriados', grupo: 'Escritório', perfis: ['ADMIN', 'GESTOR'], title: 'Feriados', href: paths.dashboard.feriados, icon: 'calendar' },
  { key: 'emails-cliente', grupo: 'Comunicação com o cliente', perfis: ['ADMIN', 'GESTOR'], title: 'E-mails ao cliente', href: paths.dashboard.emailsCliente, icon: 'envelope' },
  { key: 'leads-agendamento', grupo: 'Comunicação com o cliente', perfis: ['ADMIN', 'GESTOR'], title: 'Leads e agendamento', href: paths.dashboard.leadsConfiguracao, icon: 'funil' },
  { key: 'agentes', grupo: 'Comunicação com o cliente', perfis: ['ADMIN', 'GESTOR'], title: 'Agentes de IA', href: paths.dashboard.agentes, icon: 'robot' },
  { key: 'integracoes', grupo: 'Sistema', perfis: ['ADMIN', 'GESTOR'], title: 'Integrações', href: paths.dashboard.integracoes, icon: 'plugs-connected' },
  { key: 'auditoria', grupo: 'Sistema', perfis: ['ADMIN', 'GESTOR'], title: 'Auditoria', href: paths.dashboard.auditoria, icon: 'historico' },
] satisfies NavItemConfig[];

/** Rodapé do menu principal: um só item "Configurações" que abre a página com o menu acima. */
export const rodapeNavItems = [
  {
    key: 'configuracoes',
    perfis: ['ADMIN', 'GESTOR'],
    title: 'Configurações',
    href: paths.dashboard.configuracoes,
    icon: 'engrenagem',
    ativoEm: [paths.dashboard.configuracoes, ...settingsNavItems.map((i) => i.href)],
  },
] satisfies NavItemConfig[];

/**
 * Itens que o perfil pode ver. Os marcados "Em breve" (telas ainda em
 * construção) ficam fora do menu até serem liberados — basta tirar o label.
 */
export function itensDoPerfil(itens: NavItemConfig[], perfil: string | undefined): NavItemConfig[] {
  return itens.filter(
    (i) => i.label !== 'Em breve' && (!i.perfis || (perfil !== undefined && (i.perfis as string[]).includes(perfil)))
  );
}
