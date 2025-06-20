// admin.js

// Importa funções do Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
// MODIFICADO AQUI: Adicionado serverTimestamp aos imports do firestore
import { getFirestore, doc, setDoc, collection, writeBatch, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


// Importa dados fixos e mapeamentos do seu data.js
import { schools, allPseActions, priorityPseActions, pseTemaColumnMapping, psePraticaColumnMapping } from './data.js';
// Importa o módulo de autenticação para verificação de admin
import { checkAdminAccess } from './auth.js';


// Suas credenciais de configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDtF5zN7KLcoMvvOlYhP1Btn0hD_IcFUhs",
  authDomain: "pse-granja.firebaseapp.com",
  projectId: "pse-granja",
  storageBucket: "pse-granja.firebasestorage.app",
  messagingSenderId: "3638651287",
  appId: "1:3638651287:web:760797d66ed93cab0efcd2"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);


// Variáveis para elementos DOM
let excelPraticaUploadInput;
let excelTemaUploadInput;
let processFilesBtn;
let uploadStatusDiv;

let pastedTemaDataTextarea;
let processPastedTemaBtn;
let pasteTemaStatusDiv;

let pastedPraticaDataTextarea;
let processPastedPraticaBtn;
let pastePraticaStatusDiv;


let competenciaInput;
let saveCompetenciaBtn;
let competenciaStatusDiv;

let inepCovidInput;
let registerCovidActionBtn;
let covidStatusDiv;

let newUserEmailInput;
let newUserPasswordInput;
let newUserRoleSelect;
let createUserBtn;
let createUserStatusDiv;


document.addEventListener('DOMContentLoaded', async () => {
    // ATRIBUIÇÃO DAS VARIÁVEIS DOM
    console.log("DOM CONTENT LOADED - admin.js iniciado.");

    excelPraticaUploadInput = document.getElementById('excelPraticaUpload');
    excelTemaUploadInput = document.getElementById('excelTemaUpload');
    processFilesBtn = document.getElementById('processFilesBtn');
    uploadStatusDiv = document.getElementById('upload-status');


    pastedTemaDataTextarea = document.getElementById('pastedTemaDataTextarea');
    processPastedTemaBtn = document.getElementById('processPastedTemaBtn');
    pasteTemaStatusDiv = document.getElementById('paste-tema-status');

    pastedPraticaDataTextarea = document.getElementById('pastedPraticaDataTextarea');
    processPastedPraticaBtn = document.getElementById('processPastedPraticaBtn');
    pastePraticaStatusDiv = document.getElementById('paste-pratica-status');


    competenciaInput = document.getElementById('competenciaInput');
    saveCompetenciaBtn = document.getElementById('saveCompetenciaBtn');
    competenciaStatusDiv = document.getElementById('competencia-status');

    inepCovidInput = document.getElementById('inepCovidInput');
    registerCovidActionBtn = document.getElementById('registerCovidActionBtn');
    covidStatusDiv = document.getElementById('covid-status');

    newUserEmailInput = document.getElementById('newUserEmail');
    newUserPasswordInput = document.getElementById('newUserPassword');
    newUserRoleSelect = document.getElementById('newUserRole');
    createUserBtn = document.getElementById('createUserBtn');
    createUserStatusDiv = document.getElementById('create-user-status');


    // Verifica o acesso de administrador ao carregar a página
    await checkAdminAccess();

    // Carrega a competência atual para exibir no campo
    await loadCurrentCompetencia();

    // Listener para o botão de Processar e Salvar Dados (Excel)
    if (processFilesBtn) {
        processFilesBtn.addEventListener('click', async () => {
            console.log("Botão 'Processar e Salvar Dados' (Excel) clicado!");
            
            const excelPraticaFile = excelPraticaUploadInput.files[0];
            const excelTemaFile = excelTemaUploadInput.files[0];

            if (!excelPraticaFile || !excelTemaFile) {
                uploadStatusDiv.textContent = 'Por favor, selecione ambos os arquivos Excel (Prática e Tema).';
                uploadStatusDiv.className = 'error';
                console.log("Validação: Arquivos não selecionados.");
                return;
            }

            uploadStatusDiv.textContent = 'Processando arquivos... Isso pode levar um momento.';
            uploadStatusDiv.className = '';
            console.log("Arquivos selecionados. Iniciando processamento.");

            try {
                // readExcelFile agora lê um range maior e sem assumir cabeçalho
                // Lendo as primeiras 200 linhas para garantir que o cabeçalho e todos os dados sejam lidos
                const rawPseTemaData = await readExcelFile(excelTemaFile, 0, 200);
                console.log("--- DEBUG pseTema (FILE) ---");
                console.log("Raw Data de pseTema (do readExcelFile):", rawPseTemaData);
                const processedPseTemaData = processExcelSheetData(rawPseTemaData, 'tema');
                console.log("Dados de pseTema processados (após processExcelSheetData):", processedPseTemaData);
                console.log("--- FIM DEBUG pseTema (FILE) ---");

                const rawPsePraticaData = await readExcelFile(excelPraticaFile, 0, 200);
                console.log("--- DEBUG psePratica (FILE) ---");
                console.log("Raw Data de psePratica (do readExcelFile):", rawPsePraticaData);
                const processedPsePraticaData = processExcelSheetData(rawPsePraticaData, 'pratica');
                console.log("Dados de psePratica processados (após processExcelSheetData):", processedPsePraticaData);
                console.log("--- FIM DEBUG psePratica (FILE) ---");

                // =================================================================
                // Salvar Dados no Firestore
                // =================================================================
                await saveProcessedDataToFirestore(processedPseTemaData, processedPsePraticaData, uploadStatusDiv, 'full');
            } catch (error) {
                console.error('ERRO GERAL NO UPLOAD/SAVE:', error);
                uploadStatusDiv.textContent = `Erro ao processar e salvar: ${error.message}. Verifique o console.`;
                uploadStatusDiv.className = 'error';
            }
        });
    } else {
        console.error("Erro: Botão 'Processar e Salvar Dados' (ID: processFilesBtn) não encontrado no DOM.");
    }

    // Listener para o botão de Processar Dados Colados - TEMA
    if (processPastedTemaBtn) {
        processPastedTemaBtn.addEventListener('click', async () => {
            console.log("Botão 'Processar Dados Colados - TEMA' clicado!");
            const pastedText = pastedTemaDataTextarea.value.trim();

            if (!pastedText) {
                pasteTemaStatusDiv.textContent = 'Por favor, cole os dados na área de texto do Tema.';
                pasteTemaStatusDiv.className = 'error';
                return;
            }

            pasteTemaStatusDiv.textContent = 'Processando dados colados...';
            pasteTemaStatusDiv.className = '';

            try {
                const parsedDataRawRows = parsePastedData(pastedText);
                console.log("--- DEBUG Pasted Data (TEMA) ---");
                console.log("Dados colados analisados (Raw Rows):", parsedDataRawRows);
                const processedPastedTemaData = processExcelSheetData(parsedDataRawRows, 'tema');
                console.log("Dados colados processados (após processExcelSheetData):", processedPastedTemaData);
                console.log("--- FIM DEBUG Pasted Data (TEMA) ---");

                await saveProcessedDataToFirestore(processedPastedTemaData, [], pasteTemaStatusDiv, 'tema_only');

            } catch (error) {
                pasteTemaStatusDiv.textContent = `Erro ao processar dados colados: ${error.message}. Verifique o console.`;
                pasteTemaStatusDiv.className = 'error';
                console.error('Erro ao colar dados (Tema):', error);
            }
        });
    } else {
        console.error("Erro: Botão 'Processar Dados Colados - TEMA' (ID: processPastedTemaBtn) não encontrado no DOM.");
    }

    // Listener para o botão de Processar Dados Colados - PRÁTICA
    if (processPastedPraticaBtn) {
        processPastedPraticaBtn.addEventListener('click', async () => {
            console.log("Botão 'Processar Dados Colados - PRÁTICA' clicado!");
            const pastedText = pastedPraticaDataTextarea.value.trim();

            if (!pastedText) {
                pastePraticaStatusDiv.textContent = 'Por favor, cole os dados na área de texto da Prática.';
                pastePraticaStatusDiv.className = 'error';
                return;
            }

            pastePraticaStatusDiv.textContent = 'Processando dados colados...';
            pastePraticaStatusDiv.className = '';

            try {
                const parsedDataRawRows = parsePastedData(pastedText);
                console.log("--- DEBUG Pasted Data (PRÁTICA) ---");
                console.log("Dados colados analisados (Raw Rows):", parsedDataRawRows);
                const processedPastedPraticaData = processExcelSheetData(parsedDataRawRows, 'pratica');
                console.log("Dados colados processados (após processExcelSheetData):", processedPastedPraticaData);
                console.log("--- FIM DEBUG Pasted Data (PRÁTICA) ---");

                await saveProcessedDataToFirestore([], processedPastedPraticaData, pastePraticaStatusDiv, 'pratica_only');

            } catch (error) {
                pastePraticaStatusDiv.textContent = `Erro ao processar dados colados: ${error.message}. Verifique o console.`;
                pastePraticaStatusDiv.className = 'error';
                console.error('Erro ao colar dados (Prática):', error);
            }
        });
    } else {
        console.error("Erro: Botão 'Processar Dados Colados - PRÁTICA' (ID: processPastedPraticaBtn) não encontrado no DOM.");
    }


    // Listener para o botão de Salvar Competência
    if (saveCompetenciaBtn) {
        saveCompetenciaBtn.addEventListener('click', async () => {
            const competencia = competenciaInput.value.trim();
            if (!competencia) {
                competenciaStatusDiv.textContent = 'Por favor, digite a competência.';
                competenciaStatusDiv.className = 'error';
                return;
            }

            competenciaStatusDiv.textContent = 'Salvando competência...';
            competenciaStatusDiv.className = '';

            try {
                const configDocRef = doc(db, 'appConfig', 'currentCompetencia');
                await setDoc(configDocRef, { value: competencia, lastUpdated: serverTimestamp() });
                competenciaStatusDiv.textContent = 'Competência salva com sucesso!';
                competenciaStatusDiv.className = 'success';
            } catch (error) {
                competenciaStatusDiv.textContent = `Erro ao salvar competência: ${error.message}`;
                competenciaStatusDiv.className = 'error';
                console.error('Erro ao salvar competência:', error);
            }
        });
    } else {
        console.error("Erro: Botão 'Salvar Competência' (ID: saveCompetenciaBtn) não encontrado no DOM.");
    }


    // Listener para o botão de Registrar Ação COVID-19
    if (registerCovidActionBtn) {
        registerCovidActionBtn.addEventListener('click', async () => {
            const inep = inepCovidInput.value.trim();

            if (!inep) {
                covidStatusDiv.textContent = 'Por favor, digite o INEP da escola.';
                covidStatusDiv.className = 'error';
                return;
            }
            
            const schoolExists = schools.some(s => String(s.inep) === inep);
            if (!schoolExists) {
                covidStatusDiv.textContent = `INEP ${inep} não encontrado nas escolas cadastradas.`;
                covidStatusDiv.className = 'error';
                return;
            }

            covidStatusDiv.textContent = `Registrando ação COVID-19 para INEP: ${inep}...`;
            covidStatusDiv.className = '';

            try {
                const schoolDocRef = doc(db, 'pseActivities', inep);
                
                const docSnap = await getDoc(schoolDocRef);
                let currentActivities = docSnap.exists() ? docSnap.data() : { inep: inep };

                const covidActionKey = 'Covid19';

                currentActivities[covidActionKey] = true;

                if (!docSnap.exists()) {
                    const schoolInfo = schools.find(s => String(s.inep) === inep);
                    if (schoolInfo) {
                        currentActivities.eMulti = schoolInfo.eMulti;
                        currentActivities.schoolName = schoolInfo.name;
                    }
                    allPseActions.forEach(actionName => {
                        const actionKey = actionName.replace(/[^a-zA-Z0-9]/g, '');
                        if (currentActivities[actionKey] === undefined) {
                            currentActivities[actionKey] = false;
                        }
                    });
                }

                await setDoc(schoolDocRef, { ...currentActivities, lastUpdated: serverTimestamp() }, { merge: true });
                
                covidStatusDiv.textContent = `Ação COVID-19 registrada para INEP ${inep} com sucesso!`;
                covidStatusDiv.className = 'success';
                inepCovidInput.value = '';
                
            } catch (error) {
                covidStatusDiv.textContent = `Erro ao registrar ação COVID-19: ${error.message}`;
                covidStatusDiv.className = 'error';
                console.error('Erro COVID-19:', error);
            }
        });
    } else {
        console.error("Erro: Botão 'Registrar Ação COVID-19' (ID: registerCovidActionBtn) não encontrado no DOM.");
    }

    // Listener para o botão de Criar Usuário
    if (createUserBtn) {
        createUserBtn.addEventListener('click', async () => {
            const email = newUserEmailInput.value.trim();
            const password = newUserPasswordInput.value.trim();
            const role = newUserRoleSelect.value;

            if (!email || !password || password.length < 6) {
                createUserStatusDiv.textContent = 'Por favor, preencha email e senha (mín. 6 caracteres).';
                createUserStatusDiv.className = 'error';
                return;
            }

            createUserStatusDiv.textContent = 'Criando usuário...';
            createUserStatusDiv.className = '';

            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                await setDoc(doc(db, 'userRoles', user.uid), {
                    email: email,
                    role: role,
                    createdAt: serverTimestamp()
                });

                createUserStatusDiv.textContent = `Usuário <span class="math-inline">\{email\} \(</span>{role}) criado com sucesso!`;
                createUserStatusDiv.className = 'success';
                newUserEmailInput.value = '';
                newUserPasswordInput.value = '';

            } catch (error) {
                let errorMessage = "Erro ao criar usuário.";
                if (error.code === 'auth/email-already-in-use') {
                    errorMessage = "Este email já está em uso.";
                } else if (error.code === 'auth/invalid-email') {
                    errorMessage = "Formato de email inválido.";
                } else if (error.code === 'auth/weak-password') {
                    errorMessage = "Senha muito fraca (mín. 6 caracteres).";
                }
                createUserStatusDiv.textContent = `<span class="math-inline">\{errorMessage\} \(</span>{error.message})`;
                createUserStatusDiv.className = 'error';
                console.error('Erro ao criar usuário:', error);
            }
        });
    } else {
        console.error("Erro: Botão 'Criar Usuário' (ID: createUserBtn) não encontrado no DOM.");
    }


    /**
     * Carrega a competência atual salva no Firestore e preenche o campo.
     */
    async function loadCurrentCompetencia() {
        if (!competenciaInput) {
            console.error("Input de Competência (ID: competenciaInput) não encontrado no DOM. Não foi possível carregar a competência.");
            return;
        }
        try {
            const configDocRef = doc(db, 'appConfig', 'currentCompetencia');
            const docSnap = await getDoc(configDocRef);
            if (docSnap.exists()) {
                competenciaInput.value = docSnap.data().value;
            }
        } catch (error) {
            console.error("Erro ao carregar competência:", error);
        }
    }


    /**
     * Função para ler um arquivo Excel usando SheetJS.
     * @param {File} file O arquivo Excel.
     * @param {number} startRangeRowIndex O índice da linha a partir da qual a leitura deve começar (0-indexed).
     * @param {number} endRangeRowIndex O índice da última linha a ser lida (0-indexed).
     * @returns {Promise<Array<Array<any>>>} Uma promise que resolve com os dados brutos da planilha.
     */
    function readExcelFile(file, startRangeRowIndex, endRangeRowIndex) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    
                    const range = XLSX.utils.encode_range({
                        s: { r: startRangeRowIndex, c: 0 },
                        e: { r: endRangeRowIndex, c: 25 } // Lê até a coluna Z (c=25)
                    });
                    // header: undefined para que o sheet_to_json retorne dados brutos (arrays de arrays)
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { range: range, raw: false, header: undefined });
                    resolve(jsonData);
                } catch (error) {
                    reject(new Error("Erro ao ler o arquivo Excel: " + error.message));
                }
            };
            reader.onerror = (error) => {
                reject(new Error("Erro do FileReader: " + error.message));
            };
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Função genérica para processar dados de planilha (Excel ou colado).
     * Procura o cabeçalho 'INEP (Escolas/Creche)' e mapeia ações.
     * @param {Array<Array<any>>} rawData Dados brutos da planilha lidos.
     * @param {string} dataType 'tema' ou 'pratica' para selecionar o mapeamento correto de colunas.
     * @returns {Array<Object>} Array de objetos com INEP e status das ações.
     */
    function processExcelSheetData(rawData, dataType) {
        if (!rawData || rawData.length < 1) {
            console.warn(`processExcelSheetData (${dataType}): RawData está vazio ou mal formatado.`);
            return [];
        }

        // --- Lógica para encontrar a linha de cabeçalho real ---
        let headers = [];
        let headerRowIndex = -1;
        const targetHeaderIdentifier = 'INEP (Escolas/Creche)';

        // Procura a linha de cabeçalho nas primeiras linhas do rawData
        for (let i = 0; i < rawData.length; i++) {
            const row = rawData[i];
            // Verifica se a linha é um array e contém o identificador
            if (row && Array.isArray(row) && row.includes(targetHeaderIdentifier)) {
                headers = row;
                headerRowIndex = i;
                break;
            }
        }

        if (headerRowIndex === -1) {
            console.error(`processExcelSheetData (<span class="math-inline">\{dataType\}\)\: Cabeçalho '</span>{targetHeaderIdentifier}' não encontrado em nenhuma das linhas lidas do Excel/texto. Verifique o conteúdo.`);
            return [];
        }

        const dataRows = rawData.slice(headerRowIndex + 1); // Dados começam após a linha de cabeçalho

        console.log(`processExcelSheetData (${dataType}): Cabeçalho ENCONTRADO em rawData[`, headerRowIndex, "]:", headers);
        console.log(`processExcelSheetData (${dataType}): Número de linhas de dados APÓS cabeçalho:`, dataRows.length);

        const processedData = [];
        const excelActionColumnsMap = (dataType === 'tema') ? {
            'Agravos negligenciados': 'Doenças Negligenciadas',
            'Alimentação saudável': 'Alimentação Saudável',
            'Cidadania e direitos humanos': 'Cultura de Paz',
            'Dependência química / tabaco /': 'Drogas',
            'Prevenção da violência e promo': 'Prevenção de Violências e Acidentes',
            'Saúde ambiental': 'Saúde Ambiental',
            'Saúde bucal': 'Saúde Bucal',
            'Saúde mental': 'Saúde Mental',
            'Saúde sexual e reprodutiva': 'Saúde Sexual/HIV/IST',
            'Semana saúde na escola': 'Semana saúde na escola',
        } : { // dataType === 'pratica'
            'Antropometria': 'Alimentação Saudável',
            'Aplicação tópica de flúor': 'Saúde Bucal',
            'Desenvolvimento da linguagem': 'Saúde Auditiva',
            'Escovação dental supervisionad': 'Saúde Bucal',
            'Práticas corporais / atividade': 'Atividade Física',
            'Saúde auditiva': 'Saúde Auditiva',
            'Saúde ocular': 'Saúde Ocular',
            'Verificação da situação vacina': 'Situação Vacinal',
        };
        

        dataRows.forEach((row, rowIndex) => {
            const schoolData = {};
            let inepFound = false;

            const inepColumnIndex = headers.indexOf(targetHeaderIdentifier);
            
            if (row && Array.isArray(row) && row.length > inepColumnIndex && row[inepColumnIndex]) {
                schoolData.inep = String(row[inepColumnIndex]).trim();
                const schoolInfo = schools.find(s => String(s.inep) === schoolData.inep);
                if (schoolInfo) {
                    schoolData.eMulti = schoolInfo.eMulti;
                    schoolData.schoolName = schoolInfo.name;
                } else {
                    console.warn(`processExcelSheetData (${dataType}): INEP ${schoolData.inep} na linha de dados ${rowIndex + (headerRowIndex + 2)} do Excel/texto não encontrado em data.js/schools. Ignorando.`);
                    return;
                }
                inepFound = true;

                for (const excelHeader in excelActionColumnsMap) {
                    const actionSystemName = excelActionColumnsMap[excelHeader];
                    const actionKey = actionSystemName.replace(/[^a-zA-Z0-9]/g, '');
                    const columnIndex = headers.indexOf(excelHeader);

                    if (columnIndex !== -1 && row.length > columnIndex && row[columnIndex] !== undefined) {
                        const cellValue = String(row[columnIndex]).trim().toLowerCase();
                        schoolData[actionKey] = (cellValue === 'x' || cellValue === 'v' || cellValue === 'ok' || cellValue === 'sim');
                    } else {
                        schoolData[actionKey] = false;
                    }
                }
            } else {
                console.warn(`processExcelSheetData (${dataType}): Linha de dados ${rowIndex + (headerRowIndex + 2)} do Excel/texto sem INEP válido ou vazio. Pulando.`);
            }
            
            if (inepFound) {
                processedData.push(schoolData);
            }
        });
        return processedData;
    }

    /**
     * Função para analisar o texto colado de uma planilha (tab-delimitado) e retornar como rawData.
     * @param {string} pastedText O texto colado.
     * @returns {Array<Array<string>>} rawRows array, similar ao retorno de readExcelFile.
     */
    function parsePastedData(pastedText) {
        const rows = pastedText.split(/\r?\n/).filter(line => line.trim() !== ''); // Divide em linhas e remove linhas vazias
        const rawRows = rows.map(row => row.split('\t').map(cell => cell.trim())); // Divide em células por tab e remove espaços
        return rawRows; // Retorna um array de arrays, similar ao retorno de SheetJS
    }

    /**
     * Função genérica para salvar dados processados no Firestore.
     * @param {Array<Object>} processedPseTemaData Dados processados do Tema.
     * @param {Array<Object>} processedPsePraticaData Dados processados da Prática.
     * @param {HTMLElement} statusDiv O elemento DIV para exibir o status.
     * @param {string} [mode='full'] 'full' para upload de ambos, 'tema_only' para só tema, 'pratica_only' para só pratica.
     */
    async function saveProcessedDataToFirestore(processedPseTemaData, processedPsePraticaData, statusDiv, mode = 'full') {
        const batch = writeBatch(db);
        const pseActivitiesCollectionRef = collection(db, 'pseActivities');

        const mergedActivitiesData = {};

        // Mescla dados de pseTema (se aplicável ao modo)
        if (mode === 'full' || mode === 'tema_only') {
            processedPseTemaData.forEach(item => {
                if (item.inep) {
                    mergedActivitiesData[item.inep] = { ...item };
                }
            });
        }

        // Mescla dados de psePratica (se aplicável ao modo)
        if (mode === 'full' || mode === 'pratica_only') {
            processedPsePraticaData.forEach(item => {
                if (item.inep) {
                    if (mergedActivitiesData[item.inep]) {
                        Object.assign(mergedActivitiesData[item.inep], item);
                    } else {
                        mergedActivitiesData[item.inep] = { ...item };
                    }
                }
            });
        }
        
        const totalProcessedEntries = Object.keys(mergedActivitiesData).length;
        if (totalProcessedEntries === 0 && processedPseTemaData.length === 0 && processedPsePraticaData.length === 0) {
            console.log("Detectado: Arquivos/dados processados estão vazios. Zerando atividades.");
            schools.forEach(school => {
                const inep = String(school.inep);
                const schoolDocRef = doc(pseActivitiesCollectionRef, inep);
                
                let activitiesToSet = {
                    inep: inep,
                    eMulti: school.eMulti,
                    schoolName: school.name
                };
                allPseActions.forEach(actionName => {
                    const actionKey = actionName.replace(/[^a-zA-Z0-9]/g, '');
                    activitiesToSet[actionKey] = false;
                });
                batch.set(schoolDocRef, activitiesToSet, { merge: true });
            });

            await batch.commit();
            statusDiv.textContent = 'Arquivos/dados processados vazios. Todas as atividades das escolas foram zeradas no Firebase!';
            statusDiv.className = 'success';
            
            // ATUALIZA O TIMESTAMP DE LAST_UPDATE DO APP
            const configDocRef = doc(db, 'appConfig', 'lastDataUpdate');
            await setDoc(configDocRef, { timestamp: serverTimestamp() }, { merge: true });
            return;
        }

        console.log("Processando e salvando dados (normalmente).");
        schools.forEach(school => {
            const inep = String(school.inep);
            const schoolDocRef = doc(pseActivitiesCollectionRef, inep);
            
            let activitiesForSchool = {
                inep: inep,
                eMulti: school.eMulti,
                schoolName: school.name
            };

            allPseActions.forEach(actionName => {
                const actionKey = actionName.replace(/[^a-zA-Z0-9]/g, '');
                // Garante que o valor seja SEMPRE um booleano (true ou false), nunca undefined.
                // Verifica se a ação está explicitamente marcada como true nos dados mesclados
                activitiesForSchool[actionKey] = !!(mergedActivitiesData[inep] && mergedActivitiesData[inep][actionKey]);
            });
            
            batch.set(schoolDocRef, activitiesForSchool, { merge: true });
        });

        await batch.commit();
        statusDiv.textContent = 'Dados processados e salvos no Firebase com sucesso!';
        statusDiv.className = 'success';

        // ATUALIZA O TIMESTAMP DE LAST_UPDATE DO APP
        const configDocRef = doc(db, 'appConfig', 'lastDataUpdate');
        await setDoc(configDocRef, { timestamp: serverTimestamp() }, { merge: true });
    }
});