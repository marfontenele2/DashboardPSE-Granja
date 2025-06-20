// utils.js
// Este arquivo conterá funções utilitárias que podem ser usadas em várias partes do código.

/**
 * Formata um número para porcentagem com uma casa decimal.
 * @param {number} value O valor a ser formatado (ex: 0.75 para 75%).
 * @returns {string} O valor formatado como string de porcentagem.
 */
export function formatPercentage(value) {
  if (typeof value !== 'number' || isNaN(value)) {
    return 'N/A';
  }
  return `${(value * 100).toFixed(1)}%`;
}

/**
 * Simula um atraso de tempo. Útil para testes ou para simular carregamento.
 * @param {number} ms O tempo em milissegundos para esperar.
 * @returns {Promise<void>} Uma Promise que resolve após o tempo especificado.
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// TODO: Adicionar mais funções utilitárias conforme necessário.
// Ex: validarEmail, formatarData, funções para manipulação de arrays, etc.