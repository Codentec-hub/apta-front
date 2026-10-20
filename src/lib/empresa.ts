// Formatação e validação de documentos e do "ID Empresa".

export function somenteDigitos(valor: string): string {
  return valor.replaceAll(/\D/g, '');
}

// ID Empresa com 3 dígitos, como no Acessórias: 7 → "007".
export function formatarCodigo(codigo: number): string {
  return String(codigo).padStart(3, '0');
}

function digitoVerificador(base: string, pesos: number[]): number {
  const soma = [...base].reduce((acc, d, i) => acc + Number(d) * pesos[i], 0);
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

export function cnpjValido(valor: string): boolean {
  const d = somenteDigitos(valor);
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
  const p1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const p2 = [6, ...p1];
  return (
    digitoVerificador(d.slice(0, 12), p1) === Number(d[12]) && digitoVerificador(d.slice(0, 13), p2) === Number(d[13])
  );
}

export function cpfValido(valor: string): boolean {
  const d = somenteDigitos(valor);
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  const calc = (n: number) => {
    let soma = 0;
    for (let i = 0; i < n; i++) soma += Number(d[i]) * (n + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return calc(9) === Number(d[9]) && calc(10) === Number(d[10]);
}

// CNPJ 00.000.000/0000-00 · CPF 000.000.000-00 · CAEPF (14 dígitos que não
// fecham como CNPJ) 000.000.000/000-00 · outros: como veio.
export function formatarDocumento(valor: string): string {
  const d = somenteDigitos(valor);
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  if (d.length === 14) {
    return cnpjValido(d)
      ? d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
      : d.replace(/(\d{3})(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return valor;
}

// Mensagem de erro, ou null se o documento for aceitável.
export function erroDocumento(valor: string): string | null {
  const d = somenteDigitos(valor);
  if (d.length === 11) return cpfValido(d) ? null : 'CPF inválido: confira os dígitos';
  if (d.length === 14) return null; // CNPJ ou CAEPF (o CAEPF tem outra conta de dígito)
  return 'Informe um CNPJ (14 dígitos), CPF (11) ou CAEPF (14)';
}

// Aviso (não bloqueia): 14 dígitos que não fecham como CNPJ podem ser CAEPF.
export function avisoDocumento(valor: string): string | null {
  const d = somenteDigitos(valor);
  return d.length === 14 && !cnpjValido(d) ? 'Não é um CNPJ válido. Se for CAEPF, pode salvar.' : null;
}

// Celular para exibição, como foi digitado ou com DDI: "(85) 99999-0001".
export function formatarCelular(valor: string): string {
  let d = somenteDigitos(valor);
  if (d.startsWith('55') && (d.length === 12 || d.length === 13)) d = d.slice(2);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return valor;
}
