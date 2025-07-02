// js/dataPreprocessor.js

/*
 * Este módulo atua como o "controlador de qualidade" dos dados de entrada.
 * Sua principal responsabilidade é pegar os dados brutos de uma planilha (seja de um arquivo Excel ou de texto colado),
 * limpá-los, validá-los e estruturá-los no formato correto antes de serem salvos no banco de dados.
 */


// Importa as configurações e mapeamentos do arquivo central de dados.
import { normalizedPseActions, emultis, pseTemaColumnMapping, psePraticaColumnMapping } from './data.js';

/**
 * Pré-processa os dados brutos da planilha, validando INEPs e mapeando ações.
 * @param {Array<Array<any>>} rawData - Dados brutos da planilha.
 * @param {string} dataType - O tipo de dados ('tema' ou 'pratica').
 * @param {Array<Object>} dynamicSchools - A lista de escolas carregada do Firestore.
 * @returns {Array<Object>} Um array de objetos prontos para serem salvos.
 */
export function preprocessPastedData(rawData, dataType, dynamicSchools) {
    if (!rawData || rawData.length < 1) {
        console.warn(`dataPreprocessor.js (${dataType}): Dados brutos estão vazios. Nenhum dado para processar.`);
        return [];
    }
    console.log(`dataPreprocessor.js (${dataType}): Iniciando pré-processamento.`, { rawData });

    let headers = [];
    let headerRowIndex = -1;
    const targetHeaderIdentifier = 'INEP (Escolas/Creche)';

    for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        if (row && Array.isArray(row) && row.includes(targetHeaderIdentifier)) {
            headers = row.map(h => String(h).trim());
            headerRowIndex = i;
            console.log(`dataPreprocessor.js: Cabeçalho '${targetHeaderIdentifier}' encontrado na linha ${i}.`, { headers });
            break;
        }
    }

    if (headerRowIndex === -1) {
        console.error(`dataPreprocessor.js: ERRO CRÍTICO - O cabeçalho '${targetHeaderIdentifier}' não foi encontrado.`);
        return [];
    }

    const initialDataRows = rawData.slice(headerRowIndex + 1);
    const inepColIndex = headers.indexOf(targetHeaderIdentifier);

    const processedData = [];
    let validRowsCount = 0;

    const excelHeaderToNormalizedKeyMap = (dataType === 'tema') ? pseTemaColumnMapping : psePraticaColumnMapping;

    initialDataRows.forEach((row, rowIndex) => {
        const schoolData = {};

        if (row && Array.isArray(row) && row.length > inepColIndex && row[inepColIndex]) {
            schoolData.inep = String(row[inepColIndex]).trim();

            const schoolInfoInFirestore = dynamicSchools.find(s => String(s.inep) === schoolData.inep);

            if (!schoolInfoInFirestore) {
                console.warn(`dataPreprocessor.js: INEP '${schoolData.inep}' da planilha (linha ${rowIndex + 1}) NÃO FOI ENCONTRADO na lista de escolas do sistema. Esta linha será ignorada.`);
                return;
            }

            const isValidEmulti = emultis.includes(schoolInfoInFirestore.eMulti.toUpperCase());
            if (!isValidEmulti) {
                console.warn(`dataPreprocessor.js: INEP '${schoolData.inep}' encontrado, mas sua eMulti '${schoolInfoInFirestore.eMulti}' não é válida. Linha ignorada.`);
                return;
            }

            schoolData.eMulti = schoolInfoInFirestore.eMulti;
            schoolData.schoolName = schoolInfoInFirestore.name;
            validRowsCount++;

            for (const excelHeader in excelHeaderToNormalizedKeyMap) {
                const actionKey = excelHeaderToNormalizedKeyMap[excelHeader];
                const columnIndex = headers.indexOf(excelHeader);

                if (columnIndex !== -1 && row.length > columnIndex && row[columnIndex] !== undefined) {
                    const cellValue = String(row[columnIndex]).trim().toLowerCase();
                    
                    // --- LÓGICA CORRIGIDA E MELHORADA ---
                    // Verifica se é um marcador de texto conhecido OU um número maior que zero.
                    const isTextMarker = ['x', 'v', 'ok', 'sim'].includes(cellValue);
                    const numericValue = parseInt(cellValue, 10);
                    const isNumericMarker = !isNaN(numericValue) && numericValue > 0;

                    schoolData[actionKey] = isTextMarker || isNumericMarker;
                    // --- FIM DA LÓGICA CORRIGIDA ---

                } else {
                    schoolData[actionKey] = false;
                }
            }
            
            processedData.push(schoolData);

        } else {
            const rowContent = Array.isArray(row) ? row.join(', ') : row;
            if (String(rowContent).trim() !== '') {
               console.warn(`dataPreprocessor.js: Linha ${rowIndex + 1} da planilha ignorada por falta de INEP ou formato inválido.`);
            }
        }
    });

    console.log(`dataPreprocessor.js: Pré-processamento concluído. Total de linhas válidas e processadas: ${validRowsCount}.`);
    return processedData;
}