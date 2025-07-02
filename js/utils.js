// js/utils.js

/*
 * Este arquivo é a sua "caixa de ferramentas".
 * Ele contém funções pequenas e genéricas que podem ser úteis em qualquer parte do projeto.
 * São funções que não têm uma responsabilidade de negócio específica, mas ajudam a realizar tarefas comuns,
 * como formatação de texto, cálculos simples, etc.
 * Manter essas funções aqui evita a repetição de código.
 */


/**
 * Formata um número para um formato de porcentagem (ex: 0.75 => "75.0%").
 * @param {number} value - O valor numérico (entre 0 e 1).
 * @returns {string} O valor formatado como string de porcentagem.
 */
export function formatPercentage(value) {
  // Valida se a entrada é um número antes de tentar formatar.
  if (typeof value !== 'number' || isNaN(value)) {
    return 'N/A'; // Retorna 'N/A' se o valor for inválido.
  }
  // toFixed(1) garante uma casa decimal.
  return `${(value * 100).toFixed(1)}%`;
}

/**
 * Cria uma pausa (delay) na execução do código.
 * É muito útil para depuração, para simular uma rede lenta, ou para
 * aguardar a conclusão de uma animação.
 * @param {number} ms - O tempo de espera em milissegundos.
 * @returns {Promise<void>}
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}