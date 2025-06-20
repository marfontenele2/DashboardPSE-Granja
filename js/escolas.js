// escolas.js

// As instâncias 'firebase.firestore()' e 'firebase.auth()' são globais via CDN no HTML.

// Importa dados fixos e mapeamentos do seu data.js
// schools NÃO É MAIS IMPORTADO DE data.js, será carregado dinamicamente do Firestore.
import { emultis, allPseActions, priorityPseActions } from './data.js';

// Nenhuma inicialização de Firebase aqui, pois é feito no HTML

// Referências aos elementos do DOM
const emultiSelectorContainer = document.getElementById('emulti-selector-container');
const selectedEmultiNameSpan = document.getElementById('selected-emulti-name');
const schoolsActivitiesTable = document.getElementById('schools-activities-table');
const headerInfoDiv = document.querySelector('.header-info'); // Adicionado para exibir a competência no cabeçalho

// Variável de estado para a eMulti atualmente selecionada
let currentSelectedEmulti = emultis[0]; // Define a eMulti padrão como a primeira da lista

// Objeto para armazenar o estado das atividades por escola e ação (agora vindo do Firebase)
let schoolActivitiesStatus = {};
// NOVA: Armazenará a lista de escolas carregada do Firestore
let dynamicSchools = [];

// Executa quando o DOM estiver completamente carregado
document.addEventListener('DOMContentLoaded', async () => {
    // Carrega a competência
    await loadAndDisplayCompetencia();
    // Primeiro, carregamos a lista de escolas dinâmicas
    await loadSchoolsFromFirestore();

    // Se não houver escolas cadastradas, exibe mensagem e não tenta carregar atividades
    if (dynamicSchools.length === 0) {
        selectedEmultiNameSpan.textContent = "Nenhuma eMulti selecionada";
        emultiSelectorContainer.innerHTML = `<p style="text-align: center; color: var(--granja-dark-gray);">Nenhuma escola cadastrada para exibir. Cadastre escolas no Painel Admin.</p>`;
        schoolsActivitiesTable.querySelector('thead tr').innerHTML = '<th>INEP</th><th>Nome da Escola</th>';
        schoolsActivitiesTable.querySelector('tbody').innerHTML = `<tr><td colspan="2" style="text-align:center;">Nenhuma escola cadastrada.</td></tr>`;
        return;
    }

    // Verifica se precisa recarregar os dados de atividades do Firebase
    const reloadNeeded = await shouldReloadData();
    if (reloadNeeded || Object.keys(schoolActivitiesStatus).length === 0) { // Recarrega se necessário ou se os dados ainda não foram carregados
        await loadActivitiesFromFirebase();
    }
    renderEmultiSelector(); // Renderiza os botões das eMultis
    renderSchoolsActivitiesTable(currentSelectedEmulti); // Renderiza a tabela da eMulti padrão
});

/**
 * NOVA: Carrega a lista de escolas da coleção 'schools' do Firestore.
 * As escolas são armazenadas em 'dynamicSchools'.
 */
async function loadSchoolsFromFirestore() {
    dynamicSchools = []; // Limpa a lista antes de carregar
    try {
        const db = firebase.firestore();
        const querySnapshot = await db.collection('schools').get();
        querySnapshot.forEach(doc => {
            dynamicSchools.push(doc.data());
        });
        console.log('Escolas: Escolas carregadas do Firestore:', dynamicSchools);
    } catch (error) {
        console.error('Escolas: Erro ao carregar escolas do Firestore:', error);
        alert('Não foi possível carregar a lista de escolas. Verifique o console.');
    }
}

/**
 * Carrega o status das atividades das escolas do Firebase Firestore.
 * Os dados são armazenados em 'schoolActivitiesStatus'.
 */
async function loadActivitiesFromFirebase() {
    schoolActivitiesStatus = {}; // Limpa o estado atual
    try {
        const db = firebase.firestore(); // Acessando a instância global do Firestore (compat)
        const pseActivitiesCollection = db.collection('pseActivities'); // Usando sintaxe compat
        const querySnapshot = await pseActivitiesCollection.get(); // Usando sintaxe compat

        querySnapshot.forEach(doc => {
            const data = doc.data();
            schoolActivitiesStatus[String(data.inep)] = data;
        });
        console.log('Escolas: Dados de atividades carregados do Firebase:', schoolActivitiesStatus);

    } catch (error) {
        console.error('Escolas: Erro ao carregar atividades do Firebase:', error);
        alert('Não foi possível carregar os dados de atividades do servidor. Verifique o console para mais detalhes.');
    }
}

/**
 * Carrega a competência atual salva no Firestore e a exibe no cabeçalho.
 * Similar à função em main.js para consistência visual.
 */
async function loadAndDisplayCompetencia() {
    try {
        const db = firebase.firestore(); // Acessando a instância global do Firestore (compat)
        const configDocRef = db.collection('appConfig').doc('currentCompetencia'); // Usando sintaxe compat
        const docSnap = await configDocRef.get(); // Usando sintaxe compat
        let competenciaText = 'Competência: Não definida';
        if (docSnap.exists) { // Usando .exists (compat)
            competenciaText = `Competência: ${docSnap.data().value}`;
        }

        // Verifica se o span já existe para não duplicar
        let competenciaSpan = document.getElementById('competencia-display');
        if (!competenciaSpan) {
            competenciaSpan = document.createElement('span');
            competenciaSpan.id = 'competencia-display';
            // Insere antes do menu principal no header-info
            headerInfoDiv.insertBefore(competenciaSpan, headerInfoDiv.querySelector('.main-nav'));
        }
        competenciaSpan.textContent = competenciaText;

    } catch (error) {
        console.error("Escolas: Erro ao carregar e exibir competência:", error);
    }
}

/**
 * Verifica se os dados precisam ser recarregados do Firebase com base no timestamp.
 * Reutiliza a lógica de lastDataUpdate para manter a consistência de dados entre páginas.
 * @returns {Promise<boolean>} True se os dados precisam ser recarregados, false caso contrário.
 */
async function shouldReloadData() {
    try {
        const db = firebase.firestore(); // Acessando a instância global do Firestore (compat)
        const lastUpdateDocRef = db.collection('appConfig').doc('lastDataUpdate'); // Usando sintaxe compat
        const docSnap = await lastUpdateDocRef.get(); // Usando sintaxe compat

        const lastFirebaseUpdate = docSnap.exists && docSnap.data().timestamp ? docSnap.data().timestamp.toMillis() : 0;
        const lastSessionUpdate = localStorage.getItem('lastDataUpdateTimestamp');

        console.log(`Escolas: Last Firebase Update Timestamp: ${lastFirebaseUpdate}`);
        console.log(`Escolas: Last Session Update Timestamp: ${lastSessionUpdate}`);

        if (!lastSessionUpdate || lastFirebaseUpdate > parseInt(lastSessionUpdate, 10)) {
            localStorage.setItem('lastDataUpdateTimestamp', lastFirebaseUpdate.toString());
            console.log("Escolas: Recarregamento de dados necessário.");
            return true;
        }
        console.log("Escolas: Recarregamento de dados NÃO necessário.");
        return false;
    } catch (error) {
        console.error("Escolas: Erro ao verificar timestamp de atualização, forçando recarregamento:", error);
        return true; // Em caso de erro, por segurança, força o recarregamento
    }
}

/**
 * Renderiza os botões de seleção de eMulti no contêiner 'emulti-selector-container'.
 */
function renderEmultiSelector() {
    const buttonsGrid = emultiSelectorContainer.querySelector('.emulti-buttons-grid');
    buttonsGrid.innerHTML = ''; // Limpa o conteúdo anterior

    // Se não houver escolas cadastradas, a mensagem já foi exibida pelo DOMContentLoaded
    if (dynamicSchools.length === 0) {
        return;
    }

    // Garante que o currentSelectedEmulti seja uma eMulti válida das escolas cadastradas, ou a primeira eMulti disponível.
    const uniqueEmultisInSchools = [...new Set(dynamicSchools.map(s => s.eMulti.toUpperCase()))];
    if (!uniqueEmultisInSchools.includes(currentSelectedEmulti.toUpperCase())) {
        currentSelectedEmulti = uniqueEmultisInSchools.length > 0 ? uniqueEmultisInSchools[0] : (emultis.length > 0 ? emultis[0].toUpperCase() : '');
    }

    emultis.forEach(eMultiName => {
        // Renderiza o botão apenas se houver escolas cadastradas para aquela eMulti
        if (dynamicSchools.some(s => s.eMulti.toUpperCase() === eMultiName.toUpperCase())) {
            const button = document.createElement('button');
            button.classList.add('btn-emulti-selector');
            button.textContent = eMultiName;
            button.dataset.emulti = eMultiName; // Armazena o nome da eMulti no dataset

            // Adiciona a classe 'active' se for a eMulti atualmente selecionada
            if (eMultiName.toUpperCase() === currentSelectedEmulti.toUpperCase()) {
                button.classList.add('active');
            }

            // Adiciona o event listener para trocar a eMulti selecionada
            button.addEventListener('click', () => {
                currentSelectedEmulti = eMultiName.toUpperCase(); // Atualiza a eMulti selecionada
                // Remove a classe 'active' de todos os botões e adiciona ao clicado
                document.querySelectorAll('.btn-emulti-selector').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                renderSchoolsActivitiesTable(currentSelectedEmulti); // Rerrenderiza a tabela para a nova eMulti
            });
            buttonsGrid.appendChild(button);
        }
    });
}

/**
 * Renderiza a tabela de escolas e suas atividades para a eMulti selecionada.
 * Inclui cabeçalhos dinâmicos para as ações e ícones de status.
 * @param {string} emulti O nome da eMulti a ser filtrada (espera-se em caixa alta agora).
 */
function renderSchoolsActivitiesTable(emulti) {
    selectedEmultiNameSpan.textContent = emulti; // Atualiza o nome da eMulti exibida
    const tableHead = schoolsActivitiesTable.querySelector('thead tr');
    const tableBody = schoolsActivitiesTable.querySelector('tbody');

    tableHead.innerHTML = ''; // Limpa cabeçalhos anteriores
    tableBody.innerHTML = ''; // Limpa linhas anteriores

    // Se não houver escolas cadastradas, a mensagem já foi exibida pelo DOMContentLoaded
    if (dynamicSchools.length === 0) {
        return;
    }

    // Mapeia nomes de ações para chaves padronizadas (sem caracteres especiais)
    const allPseActionKeys = allPseActions.map(a => a.replace(/[^a-zA-Z0-9]/g, ''));
    const priorityPseActionKeys = priorityPseActions.map(a => a.replace(/[^a-zA-Z0-9]/g, ''));

    // Ordena as ações para exibir as prioritárias primeiro
    const orderedActions = [
        ...priorityPseActions.map(action => ({ name: action, key: action.replace(/[^a-zA-Z0-9]/g, ''), isPriority: true })),
        ...allPseActions.filter(action => !priorityPseActionKeys.includes(action.replace(/[^a-zA-Z0-9]/g, '')))
                         .map(action => ({ name: action, key: action.replace(/[^a-zA-Z0-9]/g, ''), isPriority: false }))
    ];

    // Adiciona cabeçalhos fixos (INEP, Nome da Escola)
    const inepTh = document.createElement('th');
    inepTh.textContent = 'INEP';
    tableHead.appendChild(inepTh);

    const nameTh = document.createElement('th');
    nameTh.textContent = 'Nome da Escola';
    tableHead.appendChild(nameTh);

    // Adiciona cabeçalhos dinâmicos para cada ação
    orderedActions.forEach(action => {
        const th = document.createElement('th');
        th.textContent = action.name;
        if (action.isPriority) {
            th.classList.add('priority-action-column'); // Adiciona classe para destaque visual
        }
        tableHead.appendChild(th);
    });

    // Filtra as escolas da lista dinâmica que pertencem à eMulti selecionada
    const schoolsInEmulti = dynamicSchools.filter(s => s.eMulti.toUpperCase() === emulti.toUpperCase());

    if (schoolsInEmulti.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="${2 + orderedActions.length}" style="text-align:center;">Nenhuma escola encontrada para a eMulti "${emulti}".</td></tr>`;
        return;
    }


    // Preenche as linhas da tabela com os dados das escolas e status das atividades
    schoolsInEmulti.forEach(school => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${school.inep}</td>
            <td>${school.name}</td>
        `;

        orderedActions.forEach(action => {
            const td = document.createElement('td');
            // Verifica se a atividade foi realizada (true) para a escola e ação específicas
            const isPerformed = schoolActivitiesStatus[String(school.inep)] && schoolActivitiesStatus[String(school.inep)][action.key] === true;

            const statusIcon = document.createElement('i');
            statusIcon.classList.add('activity-status-icon', 'fas');
            if (isPerformed) {
                statusIcon.classList.add('fa-check-circle', 'checked'); // Ícone de "verificado"
            } else {
                statusIcon.classList.add('fa-times-circle', 'unchecked'); // Ícone de "não verificado"
            }

            if (action.isPriority) {
                td.classList.add('priority-action-cell'); // Adiciona classe para destaque visual da célula
            }

            td.appendChild(statusIcon);
            row.appendChild(td);
        });
        tableBody.appendChild(row);
    });
}