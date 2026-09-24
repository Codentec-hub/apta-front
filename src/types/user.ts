export type Perfil = 'ADMIN' | 'GESTOR' | 'OPERACIONAL';

export interface User {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
  setor: { id: string; nome: string } | null;
}
