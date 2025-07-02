// js/escolas.js (VERSÃO FINAL E CORRIGIDA)

// Importa as novas estruturas de dados. Note que 'priorityPseActions' foi removido.
import { emultis, normalizedPseActions, priorityActionGroups } from './data.js';

const emultiSelectorContainer = document.getElementById('emulti-selector-container');
const selectedEmultiNameSpan = document.getElementById('selected-emulti-name');
const schoolsActivitiesTable = document.getElementById('schools-activities-table');
const headerInfoDiv = document.querySelector('.header-info');
let currentSelectedEmulti = emultis[0];
let schoolActivitiesStatus = {};
let dynamicSchools = [];

document.addEventListener('DOMContentLoaded', async () => {
    // A lógica de inicialização não precisa de grandes mudanças.
    await loadSchoolsFromFirestore();
    if (dynamicSchools.length === 0) {
        // ... (lógica para quando não há escolas)
        return;
    }
    const reloadNeeded = await shouldReloadData();
    if (reloadNeeded || Object.keys(schoolActivitiesStatus).length === 0) {
        await loadActivitiesFromFirebase();
    }
    renderEmultiSelector();
    renderSchoolsActivitiesTable(currentSelectedEmulti);
});

async function loadSchoolsFromFirestore() {
    dynamicSchools = [];
    const querySnapshot = await firebase.firestore().collection('schools').get();
    querySnapshot.forEach(doc => dynamicSchools.push(doc.data()));
}

async function loadActivitiesFromFirebase() {
    schoolActivitiesStatus = {};
    const querySnapshot = await firebase.firestore().collection('pseActivities').get();
    querySnapshot.forEach(doc => {
        schoolActivitiesStatus[String(doc.data().inep)] = doc.data();
    });
}

async function shouldReloadData() {
    const docSnap = await firebase.firestore().collection('appConfig').doc('lastDataUpdate').get();
    const lastFirebaseUpdate = docSnap.exists ? docSnap.data().timestamp.toMillis() : 0;
    const lastSessionUpdate = localStorage.getItem('lastDataUpdateTimestamp');
    const reloadNeeded = !lastSessionUpdate || lastFirebaseUpdate >= parseInt(lastSessionUpdate, 10);
    if (reloadNeeded) {
        localStorage.setItem('lastDataUpdateTimestamp', lastFirebaseUpdate.toString());
    }
    return reloadNeeded;
}

function renderEmultiSelector() {
    const buttonsGrid = emultiSelectorContainer.querySelector('.emulti-buttons-grid');
    buttonsGrid.innerHTML = '';
    emultis.forEach(eMultiName => {
        if (dynamicSchools.some(s => s.eMulti.toUpperCase() === eMultiName.toUpperCase())) {
            const button = document.createElement('button');
            button.className = `btn-emulti-selector ${eMultiName.toUpperCase() === currentSelectedEmulti.toUpperCase() ? 'active' : ''}`;
            button.textContent = eMultiName;
            button.dataset.emulti = eMultiName;
            button.addEventListener('click', () => {
                currentSelectedEmulti = eMultiName.toUpperCase();
                document.querySelectorAll('.btn-emulti-selector').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                renderSchoolsActivitiesTable(currentSelectedEmulti);
            });
            buttonsGrid.appendChild(button);
        }
    });
}

function renderSchoolsActivitiesTable(emulti) {
    selectedEmultiNameSpan.textContent = emulti;
    const tableHead = schoolsActivitiesTable.querySelector('thead tr');
    const tableBody = schoolsActivitiesTable.querySelector('tbody');
    tableHead.innerHTML = '';
    tableBody.innerHTML = '';

    // ==========================================================
    // LÓGICA CORRIGIDA PARA OBTER AÇÕES PRIORITÁRIAS
    // Pega todas as chaves de ações de todos os grupos prioritários e cria uma lista única.
    const priorityActionKeys = priorityActionGroups.flatMap(group => group.actions);
    // ==========================================================

    const orderedActions = [
        ...normalizedPseActions.filter(action => priorityActionKeys.includes(action.key))
                               .map(action => ({ ...action, isPriority: true })),
        ...normalizedPseActions.filter(action => !priorityActionKeys.includes(action.key))
                               .map(action => ({ ...action, isPriority: false }))
    ];

    tableHead.innerHTML = `<th>INEP</th><th>Nome da Escola</th>`;
    orderedActions.forEach(action => {
        const th = document.createElement('th');
        th.textContent = action.name;
        if (action.isPriority) {
            th.classList.add('priority-action-column');
        }
        tableHead.appendChild(th);
    });

    const schoolsInEmulti = dynamicSchools.filter(s => s.eMulti.toUpperCase() === emulti.toUpperCase());
    if (schoolsInEmulti.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="${2 + orderedActions.length}" style="text-align:center;">Nenhuma escola para esta eMulti.</td></tr>`;
        return;
    }

    schoolsInEmulti.forEach(school => {
        const row = tableBody.insertRow();
        row.innerHTML = `<td>${school.inep}</td><td>${school.name}</td>`;
        orderedActions.forEach(action => {
            const cell = row.insertCell();
            const isPerformed = schoolActivitiesStatus[String(school.inep)]?.[action.key] === true;
            cell.innerHTML = `<i class="activity-status-icon fas ${isPerformed ? 'fa-check-circle checked' : 'fa-times-circle unchecked'}"></i>`;
            if (action.isPriority) {
                cell.classList.add('priority-action-cell');
            }
        });
    });
}