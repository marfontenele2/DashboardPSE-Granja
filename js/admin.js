// admin.js

// As instâncias 'firebase.firestore()' e 'firebase.auth()' são globais via CDN no HTML.

// Importa dados fixos e mapeamentos do seu data.js
// schools não é mais importado de data.js, será carregado do Firestore
import { emultis, allPseActions, priorityPseActions, pseTemaColumnMapping, psePraticaColumnMapping } from './data.js';
// Importa o módulo de autenticação para verificação de admin e criação de usuário
import { checkAdminAccess, createNewUserForAdmin } from './auth.js';

// Nenhuma inicialização de Firebase aqui, pois é feito no HTML

// Variáveis para elementos DOM (declaradas no escopo superior para serem acessíveis após DOMContentLoaded)
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

// Novos elementos DOM para gerenciamento de usuários
let manageUsersSection;
let usersTableBody;
let userListStatusDiv;

// NOVOS elementos DOM para cadastro de escolas
let registerSchoolSection;
let schoolInepInput;
let schoolNameInput;
let schoolEmultiSelect;
let registerSchoolBtn;
let registerSchoolStatusDiv;
let registeredSchoolsTableBody;
let schoolsListStatusDiv;

// Variável para armazenar a lista de escolas carregada do Firestore
let dynamicSchools = [];


document.addEventListener('DOMContentLoaded', async () => {
    // ATRIBUIÇÃO DAS VARIÁVEIS DOM: É crucial que estas atribuições ocorram APENAS após o DOM estar carregado.
    console.log("admin.js: DOM CONTENT LOADED - admin.js iniciado.");

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

    // Atribuições para os novos elementos de gerenciamento de usuários
    manageUsersSection = document.getElementById('manage-users-section');
    usersTableBody = document.getElementById('users-table') ? document.getElementById('users-table').querySelector('tbody') : null;
    userListStatusDiv = document.getElementById('user-list-status');

    // Atribuições para os NOVOS elementos de cadastro de escolas
    registerSchoolSection = document.getElementById('register-school-section');
    schoolInepInput = document.getElementById('schoolInepInput');
    schoolNameInput = document.getElementById('schoolNameInput');
    schoolEmultiSelect = document.getElementById('schoolEmultiSelect');
    registerSchoolBtn = document.getElementById('registerSchoolBtn');
    registerSchoolStatusDiv = document.getElementById('register-school-status');
    // Verifica se a tabela de escolas cadastradas existe
    registeredSchoolsTableBody = document.getElementById('registered-schools-table') ? document.getElementById('registered-schools-table').querySelector('tbody') : null;
    schoolsListStatusDiv = document.getElementById('schools-list-status');


    // Verifica o acesso de administrador ao carregar a página
    await checkAdminAccess();

    // Carrega a competência atual para exibir no campo
    await loadCurrentCompetencia();
    // Carrega a lista de usuários para a nova seção, se os elementos existirem
    if (usersTableBody && userListStatusDiv) {
        await loadAndDisplayUsers();
    } else {
        console.warn("admin.js: Elementos da tabela de usuários não encontrados. Gerenciamento de usuários não será inicializado.");
    }
    // NOVOS: Carrega as escolas do Firestore e popula o dropdown de eMultis, se os elementos existirem
    if (schoolEmultiSelect && registeredSchoolsTableBody && schoolsListStatusDiv) {
        populateEmultiSelect(); // Popula o select de eMultis
        await loadAndDisplaySchools(); // Carrega e exibe as escolas cadastradas
    } else {
        console.warn("admin.js: Elementos de cadastro/listagem de escolas não encontrados. Funcionalidade de escolas não será inicializada.");
    }


    // Listener para o botão de Processar e Salvar Dados (Excel)
    if (processFilesBtn) {
        processFilesBtn.addEventListener('click', async () => {
            console.log("admin.js: Botão 'Processar e Salvar Dados' (Excel) clicado!");

            const excelPraticaFile = excelPraticaUploadInput.files[0];
            const excelTemaFile = excelTemaUploadInput.files[0];

            if (!excelPraticaFile || !excelTemaFile) {
                uploadStatusDiv.textContent = 'Por favor, selecione ambos os arquivos Excel (Prática e Tema).';
                uploadStatusDiv.className = 'error';
                console.log("admin.js: Validação: Arquivos não selecionados.");
                return;
            }

            uploadStatusDiv.textContent = 'Processando arquivos... Isso pode levar um momento.';
            uploadStatusDiv.className = ''; // Limpa classes de status anteriores
            console.log("admin.js: Arquivos selecionados. Iniciando processamento.");

            try {
                // Antes de processar, garanta que a lista de escolas esteja carregada para validação INEP
                if (dynamicSchools.length === 0) {
                    await loadSchoolsFromFirestoreIntoDynamicSchools(); // Carrega schools para a variável global
                    if (dynamicSchools.length === 0) {
                        uploadStatusDiv.textContent = 'Erro: Nenhuma escola cadastrada no sistema. Por favor, cadastre as escolas primeiro.';
                        uploadStatusDiv.className = 'error';
                        return;
                    }
                }

                const rawPseTemaData = await readExcelFile(excelTemaFile, 0, 200);
                console.log("admin.js: --- DEBUG pseTema (FILE) ---");
                console.log("admin.js: Raw Data de pseTema (do readExcelFile):", rawPseTemaData);
                const processedPseTemaData = processExcelSheetData(rawPseTemaData, 'tema');
                console.log("admin.js: Dados de pseTema processados (após processExcelSheetData):", processedPseTemaData);
                console.log("admin.js: --- FIM DEBUG pseTema (FILE) ---");

                const rawPsePraticaData = await readExcelFile(excelPraticaFile, 0, 200);
                console.log("admin.js: --- DEBUG psePratica (FILE) ---");
                console.log("admin.js: Raw Data de psePratica (do readExcelFile):", rawPsePraticaData);
                const processedPsePraticaData = processExcelSheetData(rawPsePraticaData, 'pratica');
                console.log("admin.js: Dados de psePratica processados (após processExcelSheetData):", processedPsePraticaData);
                console.log("admin.js: --- FIM DEBUG psePratica (FILE) ---");

                await saveProcessedDataToFirestore(processedPseTemaData, processedPsePraticaData, uploadStatusDiv, 'full');
            } catch (error) {
                console.error('admin.js: ERRO GERAL NO UPLOAD/SAVE:', error);
                uploadStatusDiv.textContent = `Erro ao processar e salvar: ${error.message}. Verifique o console.`;
                uploadStatusDiv.className = 'error';
            }
        });
    } else {
        console.error("admin.js: Erro: Botão 'Processar e Salvar Dados' (ID: processFilesBtn) não encontrado no DOM.");
    }

    // Listener para o botão de Processar Dados Colados - TEMA
    if (processPastedTemaBtn) {
        processPastedTemaBtn.addEventListener('click', async () => {
            console.log("admin.js: Botão 'Processar Dados Colados - TEMA' clicado!");
            const pastedText = pastedTemaDataTextarea.value.trim();

            if (!pastedText) {
                pasteTemaStatusDiv.textContent = 'Por favor, cole os dados na área de texto do Tema.';
                pasteTemaStatusDiv.className = 'error';
                return;
            }

            pasteTemaStatusDiv.textContent = 'Processando dados colados...';
            pasteTemaStatusDiv.className = '';

            try {
                // Antes de processar, garanta que a lista de escolas esteja carregada para validação INEP
                if (dynamicSchools.length === 0) {
                    await loadSchoolsFromFirestoreIntoDynamicSchools(); // Carrega schools para a variável global
                    if (dynamicSchools.length === 0) {
                        pasteTemaStatusDiv.textContent = 'Erro: Nenhuma escola cadastrada no sistema. Por favor, cadastre as escolas primeiro.';
                        pasteTemaStatusDiv.className = 'error';
                        return;
                    }
                }

                const parsedDataRawRows = parsePastedData(pastedText);
                console.log("admin.js: --- DEBUG Pasted Data (TEMA) ---");
                console.log("admin.js: Dados colados analisados (Raw Rows):", parsedDataRawRows);
                const processedPastedTemaData = processExcelSheetData(parsedDataRawRows, 'tema');
                console.log("admin.js: Dados colados processados (após processExcelSheetData):", processedPastedTemaData);
                console.log("admin.js: --- FIM DEBUG Pasted Data (TEMA) ---");

                await saveProcessedDataToFirestore(processedPastedTemaData, [], pasteTemaStatusDiv, 'tema_only');

            } catch (error) {
                pasteTemaStatusDiv.textContent = `Erro ao processar dados colados: ${error.message}. Verifique o console.`;
                pasteTemaStatusDiv.className = 'error';
                console.error('admin.js: Erro ao colar dados (Tema):', error);
            }
        });
    } else {
        console.error("admin.js: Erro: Botão 'Processar Dados Colados - TEMA' (ID: processPastedTemaBtn) não encontrado no DOM.");
    }

    // Listener para o botão de Processar Dados Colados - PRÁTICA
    if (processPastedPraticaBtn) {
        processPastedPraticaBtn.addEventListener('click', async () => {
            console.log("admin.js: Botão 'Processar Dados Colados - PRÁTICA' clicado!");
            const pastedText = pastedPraticaDataTextarea.value.trim();

            if (!pastedText) {
                pastePraticaStatusDiv.textContent = 'Por favor, cole os dados na área de texto da Prática.';
                pastePraticaStatusDiv.className = 'error';
                return;
            }

            pastePraticaStatusDiv.textContent = 'Processando dados colados...';
            pastePraticaStatusDiv.className = '';

            try {
                // Antes de processar, garanta que a lista de escolas esteja carregada para validação INEP
                if (dynamicSchools.length === 0) {
                    await loadSchoolsFromFirestoreIntoDynamicSchools(); // Carrega schools para a variável global
                    if (dynamicSchools.length === 0) {
                        pastePraticaStatusDiv.textContent = 'Erro: Nenhuma escola cadastrada no sistema. Por favor, cadastre as escolas primeiro.';
                        pastePraticaStatusDiv.className = 'error';
                        return;
                    }
                }

                const parsedDataRawRows = parsePastedData(pastedText);
                console.log("admin.js: --- DEBUG Pasted Data (PRÁTICA) ---");
                console.log("admin.js: Dados colados analisados (Raw Rows):", parsedDataRawRows);
                const processedPastedPraticaData = processExcelSheetData(parsedDataRawRows, 'pratica');
                console.log("admin.js: Dados colados processados (após processExcelSheetData):", processedPastedPraticaData);
                console.log("admin.js: --- FIM DEBUG Pasted Data (PRÁTICA) ---");

                await saveProcessedDataToFirestore([], processedPastedPraticaData, pastePraticaStatusDiv, 'pratica_only');

            } catch (error) {
                pastePraticaStatusDiv.textContent = `Erro ao processar dados colados: ${error.message}. Verifique o console.`;
                pastePraticaStatusDiv.className = 'error';
                console.error('admin.js: Erro ao colar dados (Prática):', error);
            }
        });
    } else {
        console.error("admin.js: Erro: Botão 'Processar Dados Colados - PRÁTICA' (ID: processPastedPraticaBtn) não encontrado no DOM.");
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
                const db = firebase.firestore(); // Acessando a instância global do Firestore (compat)
                const configDocRef = db.collection('appConfig').doc('currentCompetencia'); // Usando sintaxe compat
                await configDocRef.set({ value: competencia, lastUpdated: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true }); // Usando sintaxe compat
                competenciaStatusDiv.textContent = 'Competência salva com sucesso!';
                competenciaStatusDiv.className = 'success';
            } catch (error) {
                competenciaStatusDiv.textContent = `Erro ao salvar competência: ${error.message}`;
                competenciaStatusDiv.className = 'error';
                console.error('admin.js: Erro ao salvar competência:', error);
            }
        });
    } else {
        console.error("admin.js: Erro: Botão 'Salvar Competência' (ID: saveCompetenciaBtn) não encontrado no DOM.");
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
            // Usa a lista dinâmica de escolas
            const schoolExists = dynamicSchools.some(s => String(s.inep) === inep);
            if (!schoolExists) {
                covidStatusDiv.textContent = `INEP ${inep} não encontrado nas escolas cadastradas. Por favor, cadastre a escola primeiro.`;
                covidStatusDiv.className = 'error';
                return;
            }

            covidStatusDiv.textContent = `Registrando ação COVID-19 para INEP: ${inep}...`;
            covidStatusDiv.className = ''; // Limpa classes de status anteriores

            try {
                const db = firebase.firestore(); // Acessando a instância global do Firestore (compat)
                const schoolDocRef = db.collection('pseActivities').doc(inep); // Usando sintaxe compat

                const docSnap = await schoolDocRef.get(); // Usando sintaxe compat
                let currentActivities = docSnap.exists ? docSnap.data() : { inep: inep }; // Usando .exists (compat)

                const covidActionKey = 'Covid19';

                currentActivities[covidActionKey] = true;

                if (!docSnap.exists) { // Usando .exists (compat)
                    // Usa a lista dinâmica de escolas
                    const schoolInfo = dynamicSchools.find(s => String(s.inep) === inep);
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

                await schoolDocRef.set({ ...currentActivities, lastUpdated: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true }); // Usando sintaxe compat e timestamp

                covidStatusDiv.textContent = `Ação COVID-19 registrada para INEP ${inep} com sucesso!`;
                covidStatusDiv.className = 'success';
                inepCovidInput.value = '';

            } catch (error) {
                covidStatusDiv.textContent = `Erro ao registrar ação COVID-19: ${error.message}`;
                covidStatusDiv.className = 'error';
                console.error('admin.js: Erro COVID-19:', error);
            }
        });
    } else {
        console.error("admin.js: Botão 'Registrar Ação COVID-19' (ID: registerCovidActionBtn) não encontrado no DOM.");
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
                const result = await createNewUserForAdmin(email, password, role);

                if (result.success) {
                    createUserStatusDiv.textContent = `Usuário ${email} (${role}) criado com sucesso!`;
                    newUserEmailInput.value = '';
                    newUserPasswordInput.value = '';
                    await loadAndDisplayUsers(); // Recarrega a lista de usuários após a criação
                } else {
                    let errorMessage = "Erro ao criar usuário.";
                    if (result.error.code === 'auth/email-already-in-use') {
                        errorMessage = "Este email já está em uso.";
                    } else if (result.error.code === 'auth/invalid-email') {
                        errorMessage = "Formato de email inválido.";
                    } else if (result.error.code === 'auth/weak-password') {
                        errorMessage = "Senha muito fraca (mín. 6 caracteres).";
                    }
                    createUserStatusDiv.textContent = `${errorMessage} (${result.error.message})`;
                    createUserStatusDiv.className = 'error';
                    console.error('admin.js: Erro ao criar usuário:', result.error);
                }

            } catch (error) {
                createUserStatusDiv.textContent = `Erro inesperado ao criar usuário: ${error.message}`;
                createUserStatusDiv.className = 'error';
                console.error('admin.js: Erro inesperado na criação de usuário:', error);
            }
        });
    } else {
        console.error("admin.js: Botão 'Criar Usuário' (ID: createUserBtn) não encontrado no DOM.");
    }

    // NOVOS: Listener para o botão Cadastrar Escola
    if (registerSchoolBtn) {
        registerSchoolBtn.addEventListener('click', async () => {
            const inep = schoolInepInput.value.trim();
            const name = schoolNameInput.value.trim();
            const emulti = schoolEmultiSelect.value;

            if (!inep || !name || emulti === 'selecione') { // 'selecione' é o valor default option
                registerSchoolStatusDiv.textContent = 'Por favor, preencha todos os campos.';
                registerSchoolStatusDiv.className = 'error';
                return;
            }

            registerSchoolStatusDiv.textContent = 'Cadastrando escola...';
            registerSchoolStatusDiv.className = '';

            try {
                const db = firebase.firestore();
                const schoolDocRef = db.collection('schools').doc(inep); // Coleção 'schools'

                const docSnap = await schoolDocRef.get();
                if (docSnap.exists) {
                    registerSchoolStatusDiv.textContent = `Erro: Escola com INEP ${inep} já cadastrada.`;
                    registerSchoolStatusDiv.className = 'error';
                    return;
                }

                await schoolDocRef.set({
                    inep: inep,
                    name: name,
                    eMulti: emulti,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                registerSchoolStatusDiv.textContent = `Escola ${name} (INEP: ${inep}) cadastrada com sucesso!`;
                registerSchoolStatusDiv.className = 'success';
                schoolInepInput.value = '';
                schoolNameInput.value = '';
                schoolEmultiSelect.value = 'selecione'; // Reseta o dropdown

                // Recarrega e exibe a lista de escolas cadastradas
                await loadAndDisplaySchools();

            } catch (error) {
                registerSchoolStatusDiv.textContent = `Erro ao cadastrar escola: ${error.message}`;
                registerSchoolStatusDiv.className = 'error';
                console.error('admin.js: Erro ao cadastrar escola:', error);
            }
        });
    } else {
        console.error("admin.js: Botão 'Cadastrar Escola' (ID: registerSchoolBtn) não encontrado no DOM.");
    }


    /**
     * Carrega a competência atual salva no Firestore e preenche o campo.
     */
    async function loadCurrentCompetencia() {
        if (!competenciaInput) {
            console.error("admin.js: Input de Competência (ID: competenciaInput) não encontrado no DOM. Não foi possível carregar a competência.");
            return;
        }
        try {
            const db = firebase.firestore(); // Acessando a instância global do Firestore (compat)
            const configDocRef = db.collection('appConfig').doc('currentCompetencia'); // Usando sintaxe compat
            const docSnap = await configDocRef.get(); // Usando sintaxe compat
            if (docSnap.exists) { // Usando .exists (compat)
                competenciaInput.value = docSnap.data().value;
            }
        } catch (error) {
            console.error("admin.js: Erro ao carregar competência:", error);
        }
    }

    /**
     * Carrega e exibe a lista de usuários (perfis) do Firestore.
     */
    async function loadAndDisplayUsers() {
        if (!usersTableBody || !userListStatusDiv) {
            console.warn("admin.js: Elementos da tabela de usuários ausentes. Não é possível carregar/exibir usuários.");
            return;
        }

        userListStatusDiv.textContent = 'Carregando usuários...';
        userListStatusDiv.className = 'status-message info';
        usersTableBody.innerHTML = ''; // Limpa a tabela antes de carregar

        try {
            const db = firebase.firestore();
            const userRolesCollection = db.collection('userRoles');
            const querySnapshot = await userRolesCollection.get();

            console.log("admin.js: User Roles Query Snapshot:", querySnapshot.docs.map(doc => ({ id: doc.id, data: doc.data() })));

            if (querySnapshot.empty) {
                userListStatusDiv.textContent = 'Nenhum usuário cadastrado (além do admin atual).';
                userListStatusDiv.className = 'status-message info';
                return;
            }

            querySnapshot.forEach(doc => {
                const userData = doc.data();
                const userId = doc.id; // UID do usuário
                const currentUser = firebase.auth().currentUser; // Usuário atualmente logado

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${userData.email}</td>
                    <td>${userData.role}</td>
                    <td>
                        <button class="remove-user-btn" data-uid="${userId}" ${currentUser && currentUser.uid === userId ? 'disabled' : ''}>
                            <i class="fas fa-trash"></i> Remover Perfil
                        </button>
                    </td>
                `;
                usersTableBody.appendChild(row);
            });

            document.querySelectorAll('.remove-user-btn').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const userIdToRemove = e.currentTarget.dataset.uid;
                    if (confirm(`Tem certeza que deseja remover o perfil deste usuário? (UID: ${userIdToRemove})\n\nATENÇÃO: Isso removerá apenas o perfil de acesso do sistema, não a conta de login do Firebase Authentication.`)) {
                        await removeUserRole(userIdToRemove);
                    }
                });
            });

            userListStatusDiv.textContent = `Usuários carregados com sucesso. Total: ${querySnapshot.size}`;
            userListStatusDiv.className = 'status-message success';

        } catch (error) {
            userListStatusDiv.textContent = `Erro ao carregar usuários: ${error.message}`;
            userListStatusDiv.className = 'status-message error';
            console.error('admin.js: Erro ao carregar usuários:', error);
        }
    }

    /**
     * Remove o perfil de um usuário da coleção 'userRoles' no Firestore.
     * @param {string} uid O UID do usuário cujo perfil será removido.
     */
    async function removeUserRole(uid) {
        const db = firebase.firestore();
        try {
            await db.collection('userRoles').doc(uid).delete();
            userListStatusDiv.textContent = `Perfil de usuário (UID: ${uid}) removido com sucesso.`;
            userListStatusDiv.className = 'status-message success';
            await loadAndDisplayUsers(); // Recarrega a lista de usuários após a remoção
        } catch (error) {
            userListStatusDiv.textContent = `Erro ao remover perfil: ${error.message}`;
            userListStatusDiv.className = 'status-message error';
            console.error('admin.js: Erro ao remover perfil do usuário:', error);
        }
    }


    /**
     * Popula o dropdown de eMultis para o cadastro de escolas.
     */
    function populateEmultiSelect() {
        if (!schoolEmultiSelect) {
            console.warn("admin.js: Elemento schoolEmultiSelect não encontrado. Não é possível popular eMultis.");
            return;
        }
        schoolEmultiSelect.innerHTML = '<option value="selecione">-- Selecione a eMulti --</option>'; // Opção padrão
        emultis.forEach(emulti => {
            const option = document.createElement('option');
            option.value = emulti;
            option.textContent = emulti;
            schoolEmultiSelect.appendChild(option);
        });
    }

    /**
     * Carrega a lista de escolas da coleção 'schools' do Firestore e as armazena em 'dynamicSchools'.
     * Em seguida, renderiza a tabela de escolas cadastradas.
     */
    async function loadAndDisplaySchools() {
        if (!registeredSchoolsTableBody || !schoolsListStatusDiv) {
            console.warn("admin.js: Elementos da tabela de escolas cadastradas ausentes. Não é possível carregar/exibir escolas.");
            return;
        }

        schoolsListStatusDiv.textContent = 'Carregando escolas cadastradas...';
        schoolsListStatusDiv.className = 'status-message info';
        registeredSchoolsTableBody.innerHTML = ''; // Limpa a tabela

        try {
            const db = firebase.firestore();
            const schoolsCollection = db.collection('schools');
            const querySnapshot = await schoolsCollection.get();

            dynamicSchools = []; // Limpa a lista dinâmica antes de preencher
            if (querySnapshot.empty) {
                schoolsListStatusDiv.textContent = 'Nenhuma escola cadastrada no sistema.';
                schoolsListStatusDiv.className = 'status-message info';
                return;
            }

            querySnapshot.forEach(doc => {
                const schoolData = doc.data();
                dynamicSchools.push(schoolData); // Adiciona à lista dinâmica
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${schoolData.inep}</td>
                    <td>${schoolData.name}</td>
                    <td>${schoolData.eMulti}</td>
                    <td>
                        <button class="remove-school-btn" data-inep="${schoolData.inep}">
                            <i class="fas fa-trash"></i> Remover
                        </button>
                    </td>
                `;
                registeredSchoolsTableBody.appendChild(row);
            });

            // Adiciona event listeners aos botões de remover escola
            document.querySelectorAll('.remove-school-btn').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const inepToRemove = e.currentTarget.dataset.inep;
                    if (confirm(`Tem certeza que deseja remover a escola com INEP ${inepToRemove}?\n\nATENÇÃO: Isso removerá a escola da lista mestra e de todos os cálculos. As atividades vinculadas a este INEP no Firestore (coleção 'pseActivities') NÃO serão removidas automaticamente.`)) {
                        await removeSchool(inepToRemove);
                    }
                });
            });

            schoolsListStatusDiv.textContent = `Escolas cadastradas carregadas com sucesso. Total: ${dynamicSchools.length}`;
            schoolsListStatusDiv.className = 'status-message success';

        } catch (error) {
            schoolsListStatusDiv.textContent = `Erro ao carregar escolas: ${error.message}`;
            schoolsListStatusDiv.className = 'status-message error';
            console.error('admin.js: Erro ao carregar escolas:', error);
        }
    }

    /**
     * Remove uma escola da coleção 'schools' no Firestore.
     * @param {string} inep O INEP da escola a ser removida.
     */
    async function removeSchool(inep) {
        const db = firebase.firestore();
        try {
            await db.collection('schools').doc(inep).delete();
            schoolsListStatusDiv.textContent = `Escola (INEP: ${inep}) removida com sucesso.`;
            schoolsListStatusDiv.className = 'status-message success';
            // Recarrega a lista de escolas após a remoção
            await loadAndDisplaySchools();
        } catch (error) {
            schoolsListStatusDiv.textContent = `Erro ao remover escola: ${error.message}`;
            schoolsListStatusDiv.className = 'status-message error';
            console.error('admin.js: Erro ao remover escola:', error);
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
                        e: { r: endRangeRowIndex, c: 25 } // Lê até a coluna Z
                    });
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
     * @param {Array<Array<any>>>} rawData Dados brutos da planilha lidos.
     * @param {string} dataType 'tema' ou 'pratica' para selecionar o mapeamento correto de colunas.
     * @returns {Array<Object>} Array de objetos com INEP e status das ações.
     */
    function processExcelSheetData(rawData, dataType) {
        if (!rawData || rawData.length < 1) {
            console.warn(`admin.js: processExcelSheetData (${dataType}): RawData está vazio ou mal formatado.`);
            return [];
        }
        console.log(`admin.js: DEBUG processExcelSheetData (${dataType}): RawData de entrada:`, rawData);

        // --- Lógica para encontrar a linha de cabeçalho real ---
        let headers = [];
        let headerRowIndex = -1;
        const targetHeaderIdentifier = 'INEP (Escolas/Creche)';

        for (let i = 0; i < rawData.length; i++) {
            const row = rawData[i];
            if (row && Array.isArray(row) && row.includes(targetHeaderIdentifier)) {
                headers = row.map(h => String(h).trim());
                headerRowIndex = i;
                console.log(`admin.js: DEBUG processExcelSheetData (${dataType}): Cabeçalho '${targetHeaderIdentifier}' ENCONTRADO na linha ${i}:`, headers);
                break;
            }
        }

        if (headerRowIndex === -1) {
            console.error(`admin.js: processExcelSheetData (${dataType}): Cabeçalho '${targetHeaderIdentifier}' NÃO encontrado em nenhuma das linhas lidas do Excel/texto.`);
            return [];
        }

        const initialDataRows = rawData.slice(headerRowIndex + 1);
        const dataRows = initialDataRows.filter(row => {
            const inepColIndex = headers.indexOf(targetHeaderIdentifier);
            const hasInep = (inepColIndex !== -1 && row.length > inepColIndex && String(row[inepColIndex] || '').trim() !== '');
            const hasAnyContent = row.some(cell => String(cell || '').trim() !== '');
            return hasInep || hasAnyContent;
        });


        console.log(`admin.js: processExcelSheetData (${dataType}): Número de linhas de dados APÓS cabeçalho (e filtro):`, dataRows.length);

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
            'Antropometria': 'Antropometria',
            'Aplicação tópica de flúor': 'Aplicação tópica de flúor',
            'Desenvolvimento da linguagem': 'Desenvolvimento da linguagem',
            'Escovação dental supervisionad': 'Escovação dental supervisionada',
            'Práticas corporais / atividade': 'Práticas corporais / atividade física',
            'Saúde auditiva': 'Saúde Auditiva',
            'Saúde ocular': 'Saúde Ocular',
            'Verificação da situação vacina': 'Verificação da situação vacinal',
        };


        dataRows.forEach((row, rowIndex) => {
            const schoolData = {};
            let inepFoundAndValid = false;

            const inepColumnIndex = headers.indexOf(targetHeaderIdentifier);

            if (row && Array.isArray(row) && row.length > inepColumnIndex && row[inepColumnIndex]) {
                schoolData.inep = String(row[inepColIndex]).trim();
                // AGORA USA A LISTA DE ESCOLAS DINÂMICAS CARREGADA DO FIRESTORE
                const schoolInfo = dynamicSchools.find(s => String(s.inep) === schoolData.inep);
                if (schoolInfo) {
                    schoolData.eMulti = schoolInfo.eMulti;
                    schoolData.name = schoolInfo.name; // Garante que o nome da escola seja o da lista mestra
                    inepFoundAndValid = true;
                } else {
                    console.warn(`admin.js: processExcelSheetData (${dataType}): INEP ${schoolData.inep} na linha de dados ${rowIndex + (headerRowIndex + 2)} do Excel/texto NÃO encontrado na lista de escolas cadastradas no Firestore. Ignorando esta linha.`);
                    return;
                }

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
                console.warn(`admin.js: processExcelSheetData (${dataType}): Linha de dados ${rowIndex + (headerRowIndex + 2)} do Excel/texto sem INEP válido ou vazio na coluna esperada. Pulando.`);
            }

            if (inepFoundAndValid) {
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
        const rows = pastedText.split(/\r?\n/).filter(line => line.trim() !== '');
        const rawRows = rows.map(row => row.split('\t').map(cell => cell.trim()));
        return rawRows;
    }

    /**
     * Função genérica para salvar dados processados no Firestore.
     * @param {Array<Object>} processedPseTemaData Dados processados do Tema.
     * @param {Array<Object>} processedPsePraticaData Dados processados da Prática.
     * @param {HTMLElement} statusDiv O elemento DIV para exibir o status.
     * @param {string} [mode='full'] 'full' para upload de ambos, 'tema_only' para só tema, 'pratica_only' para só pratica.
     */
    async function saveProcessedDataToFirestore(processedPseTemaData, processedPsePraticaData, statusDiv, mode = 'full') {
        const db = firebase.firestore(); // Acessando a instância global do Firestore (compat)
        const batch = db.batch(); // Inicia um lote de operações para atualizações atômicas
        const pseActivitiesCollectionRef = db.collection('pseActivities'); // Referência à coleção de atividades

        const mergedActivitiesData = {}; // Objeto para mesclar os dados de Tema e Prática

        // Mescla dados de pseTema (se aplicável ao modo de operação)
        if (mode === 'full' || mode === 'tema_only') {
            processedPseTemaData.forEach(item => {
                if (item.inep) {
                    mergedActivitiesData[item.inep] = { ...item }; // Copia todos os campos do item
                }
            });
        }

        // Mescla dados de psePratica (se aplicável ao modo de operação)
        if (mode === 'full' || mode === 'pratica_only') {
            processedPsePraticaData.forEach(item => {
                if (item.inep) {
                    // Se o INEP já existe (do Tema), mescla; senão, cria um novo
                    if (mergedActivitiesData[item.inep]) {
                        Object.assign(mergedActivitiesData[item.inep], item);
                    } else {
                        mergedActivitiesData[item.inep] = { ...item };
                    }
                }
            });
        }

        const totalProcessedEntries = Object.keys(mergedActivitiesData).length;

        // Se nenhum dado válido foi processado, zerar as atividades no Firestore para as escolas existentes
        if (totalProcessedEntries === 0 && processedPseTemaData.length === 0 && processedPsePraticaData.length === 0) {
            console.log("admin.js: Detectado: Arquivos/dados processados estão vazios. Zerando atividades para escolas cadastradas.");
            // Agora usa dynamicSchools para zerar, não mais a lista estática
            dynamicSchools.forEach(school => {
                const inep = String(school.inep);
                const schoolDocRef = db.collection('pseActivities').doc(inep);

                let activitiesToSet = {
                    inep: inep,
                    eMulti: school.eMulti,
                    schoolName: school.name // Usa o nome da escola da lista dinâmica
                };
                allPseActions.forEach(actionName => {
                    const actionKey = actionName.replace(/[^a-zA-Z0-9]/g, '');
                    activitiesToSet[actionKey] = false;
                });
                batch.set(schoolDocRef, activitiesToSet, { merge: true });
            });

            await batch.commit();
            statusDiv.textContent = 'Arquivos/dados processados vazios. Todas as atividades das escolas cadastradas foram zeradas no Firebase!';
            statusDiv.className = 'success';

            const configDocRef = db.collection('appConfig').doc('lastDataUpdate');
            await configDocRef.set({ timestamp: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
            return;
        }

        console.log("admin.js: Processando e salvando dados (normalmente).");
        // Agora itera sobre as escolas da lista dinâmica para garantir que todas tenham um documento de atividade
        dynamicSchools.forEach(school => {
            const inep = String(school.inep);
            const schoolDocRef = db.collection('pseActivities').doc(inep);

            let activitiesForSchool = {
                inep: inep,
                eMulti: school.eMulti,
                schoolName: school.name // Usa o nome da escola da lista dinâmica
            };

            allPseActions.forEach(actionName => {
                const actionKey = actionName.replace(/[^a-zA-Z0-9]/g, '');
                // Garante que o valor seja SEMPRE um booleano (true ou false), nunca undefined.
                // Verifica se a ação está explicitamente marcada como true nos dados mesclados para este INEP.
                activitiesForSchool[actionKey] = !!(mergedActivitiesData[inep] && mergedActivitiesData[inep][actionKey]);
            });

            batch.set(schoolDocRef, activitiesForSchool, { merge: true });
        });

        await batch.commit();
        statusDiv.textContent = 'Dados processados e salvos no Firebase com sucesso!';
        statusDiv.className = 'success';

        const configDocRef = db.collection('appConfig').doc('lastDataUpdate');
        await configDocRef.set({ timestamp: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
    }
});