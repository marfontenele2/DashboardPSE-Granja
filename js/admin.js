// js/admin.js (VERSÃO COM OPÇÃO DE APAGAR DADOS)

import { emultis, pseTemaColumnMapping, psePraticaColumnMapping } from './data.js';
import { checkAdminAccess, createNewUserForAdmin } from './auth.js';
import { preprocessPastedData } from './dataPreprocessor.js';

let allHealthTeams = [];
let allSchools = [];

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await checkAdminAccess();
        initializeAdminPage();
    } catch (error) {
        console.error("Admin Page: Acesso negado ou erro na verificação.", error.message);
    }
});

function initializeAdminPage() {
    setupTabs();
    setupEventListeners();
    loadInitialData();
}

function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));
            button.classList.add('active');
            document.getElementById(button.dataset.tab).classList.add('active');
        });
    });
}

async function loadInitialData() {
    await loadAndDisplayHealthTeams();
    await loadAndDisplaySchools();
    await loadAndDisplayUsers();
    await loadCurrentCompetencia();
}

function setupEventListeners() {
    document.getElementById('processPastedTemaBtn').addEventListener('click', () => handlePasteData('tema'));
    document.getElementById('processPastedPraticaBtn').addEventListener('click', () => handlePasteData('pratica'));
    document.getElementById('registerSchoolBtn').addEventListener('click', handleRegisterSchool);
    document.getElementById('registerHealthTeamBtn').addEventListener('click', handleRegisterHealthTeam);
    document.getElementById('createUserBtn').addEventListener('click', handleCreateUser);
    document.getElementById('saveCompetenciaBtn').addEventListener('click', handleSaveCompetencia);
    document.getElementById('edit-school-form').addEventListener('submit', handleUpdateSchool);
    document.getElementById('modal-cancel-btn').addEventListener('click', closeEditModal);
    document.getElementById('edit-school-modal').addEventListener('click', (e) => { if (e.target.id === 'edit-school-modal') closeEditModal(); });
    
    // NOVO: Listener para o botão de apagar dados
    document.getElementById('clearAllActivitiesBtn').addEventListener('click', handleClearAllActivities);
}

// --- GESTÃO DE EQUIPAS DE SAÚDE (Sem alterações) ---
async function loadAndDisplayHealthTeams() {
    const tableBody = document.getElementById('registered-health-teams-table').querySelector('tbody');
    tableBody.innerHTML = '<tr><td colspan="2">A carregar equipas...</td></tr>';
    try {
        const querySnapshot = await firebase.firestore().collection('healthTeams').get();
        allHealthTeams = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => a.name.localeCompare(b.name));
        tableBody.innerHTML = '';
        if (allHealthTeams.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="2">Nenhuma equipa de saúde registada.</td></tr>';
        } else {
            allHealthTeams.forEach(team => {
                const row = tableBody.insertRow();
                row.innerHTML = `<td>${team.name}</td><td><button class="action-btn edit-btn" data-id="${team.id}" data-name="${team.name}">Editar</button><button class="action-btn remove-btn" data-id="${team.id}">Remover</button></td>`;
                row.querySelector('.edit-btn').addEventListener('click', e => handleEditHealthTeam(e.currentTarget.dataset.id, e.currentTarget.dataset.name));
                row.querySelector('.remove-btn').addEventListener('click', e => handleRemoveHealthTeam(e.currentTarget.dataset.id));
            });
        }
    } catch(error) {
        console.error("Erro ao carregar equipas de saúde:", error);
        tableBody.innerHTML = `<tr><td colspan="2" style="color: red;">Falha ao carregar dados.</td></tr>`;
    }
}
async function handleRegisterHealthTeam() {
    const nameInput = document.getElementById('healthTeamNameInput');
    const name = nameInput.value.trim();
    if (!name) { alert('Digite o nome da equipa.'); return; }
    await firebase.firestore().collection('healthTeams').add({ name });
    nameInput.value = '';
    loadAndDisplayHealthTeams();
}
async function handleEditHealthTeam(id, currentName) {
    const newName = prompt('Digite o novo nome para a equipa:', currentName);
    if (newName && newName.trim() && newName.trim() !== currentName) {
        await firebase.firestore().collection('healthTeams').doc(id).update({ name: newName.trim() });
        loadAndDisplayHealthTeams();
    }
}
async function handleRemoveHealthTeam(id) {
    if (confirm('Tem a certeza que deseja remover esta equipa?')) {
        await firebase.firestore().collection('healthTeams').doc(id).delete();
        loadAndDisplayHealthTeams();
    }
}

// --- GESTÃO DE ESCOLAS (Sem alterações) ---
function populateEmultiSelect(selectElementId, selectedValue = '') {
    const select = document.getElementById(selectElementId);
    select.innerHTML = `<option value="">-- Selecione a eMulti --</option>`;
    emultis.forEach(e => {
        select.innerHTML += `<option value="${e}" ${e === selectedValue ? 'selected' : ''}>${e}</option>`;
    });
}
function populateHealthTeamSelect(selectElementId, selectedValue = '') {
    const select = document.getElementById(selectElementId);
    select.innerHTML = '<option value="">-- Selecione a Equipa de Saúde --</option>';
    allHealthTeams.forEach(team => {
        select.innerHTML += `<option value="${team.name}" ${team.name === selectedValue ? 'selected' : ''}>${team.name}</option>`;
    });
}
async function loadAndDisplaySchools() {
    const tableBody = document.getElementById('registered-schools-table').querySelector('tbody');
    tableBody.innerHTML = '<tr><td colspan="5">A carregar escolas...</td></tr>';
    try {
        const querySnapshot = await firebase.firestore().collection('schools').get();
        allSchools = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => a.name.localeCompare(b.name));
        tableBody.innerHTML = '';
        if (allSchools.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5">Nenhuma escola registada.</td></tr>';
        } else {
            allSchools.forEach(school => {
                const row = tableBody.insertRow();
                row.innerHTML = `<td>${school.inep}</td><td>${school.name}</td><td>${school.eMulti}</td><td>${school.healthTeam || 'N/A'}</td><td><button class="action-btn edit-btn" data-inep="${school.inep}">Editar</button><button class="action-btn remove-btn" data-inep="${school.inep}">Remover</button></td>`;
                row.querySelector('.edit-btn').addEventListener('click', e => openEditModal(e.currentTarget.dataset.inep));
                row.querySelector('.remove-btn').addEventListener('click', e => handleRemoveSchool(e.currentTarget.dataset.inep));
            });
        }
        populateEmultiSelect('schoolEmultiSelect');
        populateHealthTeamSelect('schoolHealthTeamSelect');
    } catch (error) {
        console.error("Erro ao carregar escolas:", error);
        tableBody.innerHTML = `<tr><td colspan="5" style="color: red;">Falha ao carregar dados.</td></tr>`;
    }
}
async function handleRegisterSchool() {
    const inep = document.getElementById('schoolInepInput').value.trim();
    const name = document.getElementById('schoolNameInput').value.trim();
    const emulti = document.getElementById('schoolEmultiSelect').value;
    const healthTeam = document.getElementById('schoolHealthTeamSelect').value;
    if (!inep || !name || !emulti || !healthTeam) { alert('Preencha todos os campos.'); return; }
    await firebase.firestore().collection('schools').doc(inep).set({ inep, name, eMulti: emulti, healthTeam });
    document.getElementById('schoolInepInput').value = '';
    document.getElementById('schoolNameInput').value = '';
    loadAndDisplaySchools();
}
async function handleRemoveSchool(inep) {
    if (confirm('Tem a certeza que deseja remover esta escola?')) {
        await firebase.firestore().collection('schools').doc(inep).delete();
        loadAndDisplaySchools();
    }
}
function openEditModal(inep) {
    const school = allSchools.find(s => s.inep === inep);
    if (!school) { return; }
    document.getElementById('edit-school-inep').value = school.inep;
    document.getElementById('edit-school-name').value = school.name;
    populateEmultiSelect('edit-school-emulti', school.eMulti);
    populateHealthTeamSelect('edit-school-health-team', school.healthTeam);
    document.getElementById('edit-school-modal').style.display = 'flex';
}
function closeEditModal() {
    document.getElementById('edit-school-modal').style.display = 'none';
}
async function handleUpdateSchool(event) {
    event.preventDefault();
    const inep = document.getElementById('edit-school-inep').value;
    const updatedData = {
        name: document.getElementById('edit-school-name').value.trim(),
        eMulti: document.getElementById('edit-school-emulti').value,
        healthTeam: document.getElementById('edit-school-health-team').value,
    };
    if (!updatedData.name || !updatedData.eMulti || !updatedData.healthTeam) { alert('Todos os campos devem ser preenchidos.'); return; }
    await firebase.firestore().collection('schools').doc(inep).update(updatedData);
    closeEditModal();
    loadAndDisplaySchools();
}

// --- GESTÃO DE UTILIZADORES (Sem alterações) ---
async function loadAndDisplayUsers() {
    const tableBody = document.getElementById('users-table').querySelector('tbody');
    tableBody.innerHTML = '<tr><td colspan="3">A carregar utilizadores...</td></tr>';
    try {
        const querySnapshot = await firebase.firestore().collection('userRoles').get();
        tableBody.innerHTML = '';
        if(querySnapshot.empty) { 
            tableBody.innerHTML = '<tr><td colspan="3">Nenhum utilizador com perfil definido.</td></tr>'; 
            return; 
        }
        const users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        users.forEach(userData => {
            const row = tableBody.insertRow();
            row.innerHTML = `<td>${userData.email}</td><td>${userData.role}</td><td><button class="action-btn remove-btn" data-uid="${userData.id}">Remover</button></td>`;
            row.querySelector('.remove-btn').addEventListener('click', e => removeUserRole(e.currentTarget.dataset.uid, userData.email));
        });
    } catch(error) {
        console.error("Erro ao carregar utilizadores:", error);
        tableBody.innerHTML = `<tr><td colspan="3" style="color: red;">Falha ao carregar dados.</td></tr>`;
    }
}
async function handleCreateUser() {
    const email = document.getElementById('newUserEmail').value.trim();
    const password = document.getElementById('newUserPassword').value.trim();
    const role = document.getElementById('newUserRole').value;
    if (!email || !password || password.length < 6) { alert('Preencha o email e a palavra-passe (mín. 6 caracteres).'); return; }
    await createNewUserForAdmin(email, password, role);
    document.getElementById('newUserEmail').value = '';
    document.getElementById('newUserPassword').value = '';
    loadAndDisplayUsers();
}
async function removeUserRole(uid, email) {
    if (confirm(`Tem a certeza que deseja remover o perfil de acesso do utilizador ${email}?`)) {
        await firebase.firestore().collection('userRoles').doc(uid).delete();
        loadAndDisplayUsers();
    }
}

// --- UPLOAD DE DADOS & CONFIGURAÇÕES ---

async function handlePasteData(type) {
    const textarea = type === 'tema' ? document.getElementById('pastedTemaDataTextarea') : document.getElementById('pastedPraticaDataTextarea');
    const statusDiv = type === 'tema' ? document.getElementById('paste-tema-status') : document.getElementById('paste-pratica-status');
    const pastedText = textarea.value.trim();
    if (!pastedText) { 
        statusDiv.textContent = `Cole os dados na área de texto.`; 
        return; 
    }
    
    statusDiv.textContent = 'A processar...';
    try {
        const parsedData = pastedText.split(/\r?\n/).filter(line => line.trim() !== '').map(row => row.split('\t').map(cell => cell.trim()));
        const processedData = preprocessPastedData(parsedData, type, allSchools); 
        if(processedData.length === 0) {
            statusDiv.textContent = 'Nenhum dado válido encontrado.';
            return;
        }
        
        const db = firebase.firestore();
        const batch = db.batch();

        processedData.forEach(schoolData => {
            const docRef = db.collection('pseActivities').doc(String(schoolData.inep));
            // A lógica de merge: true permite que o upload seja acumulativo por defeito
            batch.set(docRef, schoolData, { merge: true });
        });
        
        await batch.commit();
        
        await db.collection('appConfig').doc('lastDataUpdate').set({ 
            timestamp: firebase.firestore.FieldValue.serverTimestamp() 
        });
        
        statusDiv.textContent = `Dados de ${processedData.length} escolas foram adicionados/atualizados com sucesso!`;
        textarea.value = '';

    } catch(error) {
        statusDiv.textContent = `Erro: ${error.message}`;
        console.error("Erro em handlePasteData:", error);
    }
}

async function handleSaveCompetencia() {
    const input = document.getElementById('competenciaInput');
    const competencia = input.value.trim();
    if(!competencia) { alert('O campo competência não pode estar vazio.'); return; }
    await firebase.firestore().collection('appConfig').doc('currentCompetencia').set({ value: competencia });
    alert('Competência salva com sucesso!');
}

async function loadCurrentCompetencia() {
    const input = document.getElementById('competenciaInput');
    const doc = await firebase.firestore().collection('appConfig').doc('currentCompetencia').get();
    if(doc.exists) {
        input.value = doc.data().value;
    }
}

// NOVO: Função para apagar todos os dados de atividades
async function handleClearAllActivities() {
    const confirmationText = "APAGAR TUDO";
    const userInput = prompt(`Esta ação é IRREVERSÍVEL e irá apagar TODOS os registos de atividades de TODAS as escolas.\n\nPara confirmar, digite "${confirmationText}" na caixa abaixo.`);

    if (userInput !== confirmationText) {
        alert("Operação cancelada.");
        return;
    }

    const statusDiv = document.getElementById('clear-activities-status');
    statusDiv.textContent = "A apagar todos os dados... Isto pode demorar um pouco.";
    statusDiv.className = 'status-message';

    try {
        const db = firebase.firestore();
        const activitiesCollection = db.collection('pseActivities');
        const snapshot = await activitiesCollection.get();

        if (snapshot.empty) {
            statusDiv.textContent = "Nenhum dado de atividade para apagar.";
            return;
        }

        // Apaga os documentos em lotes para evitar sobrecarga
        const batchArray = [];
        batchArray.push(db.batch());
        let operationCount = 0;
        let batchIndex = 0;

        snapshot.docs.forEach(doc => {
            batchArray[batchIndex].delete(doc.ref);
            operationCount++;
            // O Firestore limita as operações de batch a 500
            if (operationCount === 499) {
                batchArray.push(db.batch());
                batchIndex++;
                operationCount = 0;
            }
        });

        await Promise.all(batchArray.map(batch => batch.commit()));

        // Atualiza o timestamp para forçar a recarga nos dashboards
        await db.collection('appConfig').doc('lastDataUpdate').set({
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        statusDiv.textContent = `Sucesso! ${snapshot.size} registos de atividades foram apagados.`;
        statusDiv.classList.add('success');
        alert("Todos os dados de atividades foram apagados com sucesso.");

    } catch (error) {
        console.error("Erro ao apagar todas as atividades:", error);
        statusDiv.textContent = `Erro ao apagar dados: ${error.message}`;
        statusDiv.classList.add('error');
        alert("Ocorreu um erro ao apagar os dados. Verifique a consola para mais detalhes.");
    }
}
