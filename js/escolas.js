// escolas.js

// Importa funções do Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
// MODIFICADO: Importa diretamente Firestore, sem firebase-config.js
import { getFirestore, collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Importa dados do seu data.js
import { schools, emultis, allPseActions, priorityPseActions } from './data.js';

// Suas credenciais de configuração do Firebase (as mesmas em todos os arquivos JS)
const firebaseConfig = {
    apiKey: "AIzaSyDtF5zN7KLcoMvvOlYhP1Btn0hD_IcFUhs",
    authDomain: "pse-granja.firebaseapp.com",
    projectId: "pse-granja",
    storageBucket: "pse-granja.firebasestorage.app",
    messagingSenderId: "3638651287",
    appId: "1:3638651287:web:760797d66ed93cab0efcd2"
};

// Inicializa o Firebase (como era no plano original)
const app = initializeApp(firebaseConfig);
const db = getFirestore(app); // Obtém a instância do Firestore

const emultiSelectorContainer = document.getElementById('emulti-selector-container');
const selectedEmultiNameSpan = document.getElementById('selected-emulti-name');
const schoolsActivitiesTable = document.getElementById('schools-activities-table');
const headerInfoDiv = document.querySelector('.header-info');


let currentSelectedEmulti = emultis[0]; // Define a eMulti padrão como a primeira da lista

// Objeto para armazenar o estado das atividades por escola e ação (agora vindo do Firebase)
let schoolActivitiesStatus = {};

document.addEventListener('DOMContentLoaded', async () => {
    // Carrega a competência e então carrega os dados e renderiza a tabela
    await loadAndDisplayCompetencia();
    // Verifica se precisa recarregar os dados do Firebase
    const reloadNeeded = await shouldReloadData();
    if (reloadNeeded || Object.keys(schoolActivitiesStatus).length === 0) { // Recarrega se necessário ou se os dados ainda não foram carregados
        await loadActivitiesFromFirebase();
    }
    renderEmultiSelector();
    renderSchoolsActivitiesTable(currentSelectedEmulti);
});

/**
 * Carrega o status das atividades do Firebase Firestore.
 */
async function loadActivitiesFromFirebase() {
    schoolActivitiesStatus = {}; // Limpa o estado atual

    try {
        const pseActivitiesCollection = collection(db, 'pseActivities');
        const querySnapshot = await getDocs(pseActivitiesCollection);

        querySnapshot.forEach(doc => {
            const data = doc.data();
            // Garante que o INEP seja tratado como string para consistência com o `schools`
            schoolActivitiesStatus[String(data.inep)] = data;
        });
        console.log('Dados de atividades carregados do Firebase:', schoolActivitiesStatus);

    } catch (error) {
        console.error('Erro ao carregar atividades do Firebase:', error);
        alert('Não foi possível carregar os dados de atividades do servidor. Verifique o console para mais detalhes.');
    }
}

/**
 * Carrega a competência atual salva no Firestore e a exibe no cabeçalho.
 */
async function loadAndDisplayCompetencia() {
    try {
        // MODIFICADO: Usando a coleção e documento que admin.js já usa para competência
        const configDocRef = doc(db, 'appConfig', 'currentCompetencia');
        const docSnap = await getDoc(configDocRef);
        let competenciaText = 'Competência: Não definida';
        if (docSnap.exists()) {
            competenciaText = `Competência: ${docSnap.data().value}`;
        }

        // Verifica se o span já existe para não duplicar
        let competenciaSpan = document.getElementById('competencia-display');
        if (!competenciaSpan) {
            competenciaSpan = document.createElement('span');
            competenciaSpan.id = 'competencia-display';
            headerInfoDiv.insertBefore(competenciaSpan, headerInfoDiv.querySelector('.main-nav'));
        }
        competenciaSpan.textContent = competenciaText;
        
    } catch (error) {
        console.error("Erro ao carregar e exibir competência:", error);
    }
}

/**
 * Verifica se os dados precisam ser recarregados do Firebase com base no timestamp.
 * @returns {Promise<boolean>} True se os dados precisam ser recarregados, false caso contrário.
 */
async function shouldReloadData() {
    try {
        // MODIFICADO: Usando a coleção e documento que admin.js já usa para lastDataUpdate
        const lastUpdateDocRef = doc(db, 'appConfig', 'lastDataUpdate');
        const docSnap = await getDoc(lastUpdateDocRef);

        const lastFirebaseUpdate = docSnap.exists() ? docSnap.data().timestamp.toMillis() : 0;
        const lastSessionUpdate = localStorage.getItem('lastDataUpdateTimestamp'); // MODIFICADO: De sessionStorage para localStorage

        // Se nunca carregou na sessão ou o timestamp do Firebase é mais recente, recarrega
        if (!lastSessionUpdate || lastFirebaseUpdate > parseInt(lastSessionUpdate, 10)) {
            localStorage.setItem('lastDataUpdateTimestamp', lastFirebaseUpdate.toString()); // MODIFICADO: De sessionStorage para localStorage
            return true;
        }
        return false;
    } catch (error) {
        console.error("Erro ao verificar timestamp de atualização, forçando recarregamento:", error);
        return true; // Em caso de erro, por segurança, força o recarregamento
    }
}

/**
 * Renderiza os botões de seleção de eMulti.
 */
function renderEmultiSelector() {
    const buttonsGrid = emultiSelectorContainer.querySelector('.emulti-buttons-grid');
    buttonsGrid.innerHTML = '';

    emultis.forEach(eMultiName => {
        const button = document.createElement('button');
        button.classList.add('btn-emulti-selector');
        button.textContent = eMultiName;
        button.dataset.emulti = eMultiName;

        if (eMultiName.toUpperCase() === currentSelectedEmulti.toUpperCase()) {
            button.classList.add('active');
        }

        button.addEventListener('click', () => {
            currentSelectedEmulti = eMultiName.toUpperCase();
            document.querySelectorAll('.btn-emulti-selector').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            renderSchoolsActivitiesTable(currentSelectedEmulti);
        });
        buttonsGrid.appendChild(button);
    });
}

/**
 * Renderiza a tabela de escolas com suas atividades.
 * @param {string} emulti O nome da eMulti a ser filtrada (espera-se em caixa alta agora).
 */
function renderSchoolsActivitiesTable(emulti) {
    selectedEmultiNameSpan.textContent = emulti;
    const tableHead = schoolsActivitiesTable.querySelector('thead tr');
    const tableBody = schoolsActivitiesTable.querySelector('tbody');

    tableHead.innerHTML = '';
    tableBody.innerHTML = '';

    const allPseActionKeys = allPseActions.map(a => a.replace(/[^a-zA-Z0-9]/g, ''));
    const priorityPseActionKeys = priorityPseActions.map(a => a.replace(/[^a-zA-Z0-9]/g, ''));

    const orderedActions = [
        ...priorityPseActions.map(action => ({ name: action, key: action.replace(/[^a-zA-Z0-9]/g, ''), isPriority: true })),
        ...allPseActions.filter(action => !priorityPseActionKeys.includes(action.replace(/[^a-zA-Z0-9]/g, '')))
                         .map(action => ({ name: action, key: action.replace(/[^a-zA-Z0-9]/g, ''), isPriority: false }))
    ];

    const inepTh = document.createElement('th');
    inepTh.textContent = 'INEP';
    tableHead.appendChild(inepTh);

    const nameTh = document.createElement('th');
    nameTh.textContent = 'Nome da Escola';
    tableHead.appendChild(nameTh);

    orderedActions.forEach(action => {
        const th = document.createElement('th');
        th.textContent = action.name;
        if (action.isPriority) {
            th.classList.add('priority-action-column');
        }
        tableHead.appendChild(th);
    });

    const schoolsInEmulti = schools.filter(s => s.eMulti.toUpperCase() === emulti.toUpperCase());

    schoolsInEmulti.forEach(school => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${school.inep}</td>
            <td>${school.name}</td>
        `;

        orderedActions.forEach(action => {
            const td = document.createElement('td');
            const isPerformed = schoolActivitiesStatus[String(school.inep)] && schoolActivitiesStatus[String(school.inep)][action.key] === true;

            const statusIcon = document.createElement('i');
            statusIcon.classList.add('activity-status-icon', 'fas');
            if (isPerformed) {
                statusIcon.classList.add('fa-check-circle', 'checked');
            } else {
                statusIcon.classList.add('fa-times-circle', 'unchecked');
            }
            
            if (action.isPriority) {
                td.classList.add('priority-action-cell');
            }

            td.appendChild(statusIcon);
            row.appendChild(td);
        });
        tableBody.appendChild(row);
    });
}