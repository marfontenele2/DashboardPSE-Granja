// js/main.js (VERSÃO FINAL E COMPLETA)

import { emultis, normalizedPseActions, priorityActionGroups } from './data.js';

const seletorIndicadorContainer = document.getElementById('seletor-indicador-container');
const visaoGeralContainer = document.getElementById('visao-geral-container');
const gradePrincipal = document.getElementById('grade-principal');
const headerInfoDiv = document.querySelector('.header-info');
let indicadorSelecionado = 'indicador1';
let firebaseActivitiesData = {};
let dynamicSchools = [];

// Funções Auxiliares e de Carregamento (sem alterações)
function getPontuacao(totalAtingido, totalEscolas) { if (totalEscolas === 0) return 0; return (totalAtingido / totalEscolas) * 100; }
function getStatusInfoByPercentage(percentage) { if (percentage >= 50) return { classe: 'status-otimo-acao', texto: 'Ótimo', icone: 'fa-star' }; if (percentage >= 25) return { classe: 'status-bom-acao', texto: 'Bom', icone: 'fa-check-circle' }; return { classe: 'status-insuficiente', texto: 'Insuficiente', icone: 'fa-times-circle' }; }
function formatarNumero(num) { return num.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }); }
async function loadSchoolsFromFirestore() { dynamicSchools = []; const querySnapshot = await firebase.firestore().collection('schools').get(); querySnapshot.forEach(doc => dynamicSchools.push(doc.data())); }
async function loadActivitiesFromFirebaseForDashboard() { firebaseActivitiesData = {}; const querySnapshot = await firebase.firestore().collection('pseActivities').get(); querySnapshot.forEach(doc => { firebaseActivitiesData[String(doc.data().inep)] = doc.data(); }); }
async function shouldReloadData() { const docSnap = await firebase.firestore().collection('appConfig').doc('lastDataUpdate').get(); const lastFirebaseUpdate = docSnap.exists ? docSnap.data().timestamp.toMillis() : 0; const lastSessionUpdate = localStorage.getItem('lastDataUpdateTimestamp'); const reloadNeeded = !lastSessionUpdate || lastFirebaseUpdate >= parseInt(lastSessionUpdate, 10); if (reloadNeeded) { localStorage.setItem('lastDataUpdateTimestamp', lastFirebaseUpdate.toString()); } return reloadNeeded; }

// Funções de Renderização (ATUALIZADAS)
function renderizarSeletorDeIndicador() {
    seletorIndicadorContainer.innerHTML = `<button class="btn-indicador-aba ${indicadorSelecionado === 'indicador1' ? 'active' : ''}" data-id="indicador1">Indicador 1: Escolas com Atividade</button><button class="btn-indicador-aba ${indicadorSelecionado === 'indicador2' ? 'active' : ''}" data-id="indicador2">Indicador 2: Ações Prioritárias</button>`;
    document.querySelectorAll('.btn-indicador-aba').forEach(btn => {
        btn.addEventListener('click', () => {
            indicadorSelecionado = btn.dataset.id;
            executarRenderizacaoCompleta();
        });
    });
}

function renderizarVisaoGeral() {
    if (dynamicSchools.length === 0) { visaoGeralContainer.innerHTML = `<p>Nenhuma escola cadastrada.</p>`; return; }
    let escolasComIndicadorAtingido = 0;
    dynamicSchools.forEach(school => {
        const schoolData = firebaseActivitiesData[String(school.inep)];
        if (schoolData) {
            let atingiu = (indicadorSelecionado === 'indicador1')
                ? normalizedPseActions.some(action => schoolData[action.key] === true)
                : priorityActionGroups.every(group => group.actions.some(actionKey => schoolData[actionKey] === true));
            if (atingiu) escolasComIndicadorAtingido++;
        }
    });
    const percentualGeral = getPontuacao(escolasComIndicadorAtingido, dynamicSchools.length);
    const rankingEmultis = emultis.map(eMultiName => {
        const schoolsInE = dynamicSchools.filter(s => s.eMulti.toUpperCase() === eMultiName.toUpperCase());
        let escolasAtingidasNaE = 0;
        schoolsInE.forEach(school => {
            const schoolData = firebaseActivitiesData[String(school.inep)];
            if (schoolData) {
                let atingiu = (indicadorSelecionado === 'indicador1')
                    ? normalizedPseActions.some(action => schoolData[action.key] === true)
                    : priorityActionGroups.every(group => group.actions.some(actionKey => schoolData[actionKey] === true));
                if (atingiu) escolasAtingidasNaE++;
            }
        });
        return { name: eMultiName, pontuacao: getPontuacao(escolasAtingidasNaE, schoolsInE.length), escolasAtingidas: escolasAtingidasNaE, totalEscolas: schoolsInE.length };
    }).sort((a, b) => b.pontuacao - a.pontuacao);
    visaoGeralContainer.innerHTML = `<div class="kpi-card"><div class="kpi-card-header"><i class="fas fa-chart-line"></i><h4>PERCENTUAL GERAL</h4></div><p class="kpi-valor">${formatarNumero(percentualGeral)}%</p><div class="distribuicao-status"><span>Total de Escolas: <b>${dynamicSchools.length}</b></span><span>Escolas que Atingiram: <b>${escolasComIndicadorAtingido}</b></span></div></div><div class="kpi-card"><div class="kpi-card-header"><i class="fas fa-school"></i><h4>ESCOLAS POR eMULTI</h4></div><div class="distribuicao-status">${rankingEmultis.map(e => `<span>${e.name}: <b>${e.escolasAtingidas}/${e.totalEscolas}</b></span>`).join('')}</div></div><div class="ranking-card"><div class="ranking-card-header"><h4><i class="fas fa-trophy"></i> Ranking de eMultis</h4></div><div class="ranking-lista">${rankingEmultis.map((e, i) => `<div class="ranking-item"><span class="posicao">${i + 1}º</span><span class="nome-equipe">${e.name}</span><span class="pontuacao-ranking">${formatarNumero(e.pontuacao)}%</span></div>`).join('')}</div></div>`;
}

// EM js/main.js (substituir apenas esta função)

// EM js/main.js (substituir apenas esta função)

function renderizarGradePrincipal() {
    gradePrincipal.innerHTML = '';
    if (dynamicSchools.length === 0) return;

    if (indicadorSelecionado === 'indicador1') {
        // Lógica para o Indicador 1: Um card para cada ação, agora com a lista de eMultis.
        gradePrincipal.style.gridTemplateColumns = 'repeat(auto-fit, minmax(240px, 1fr))';

        normalizedPseActions.forEach(action => {
            let escolasComAcao = dynamicSchools.filter(s => firebaseActivitiesData[String(s.inep)]?.[action.key] === true).length;
            const percentual = getPontuacao(escolasComAcao, dynamicSchools.length);

            // ==========================================================
            // NOVA LÓGICA PARA CRIAR A LISTA DE STATUS DAS EMULTIS
            // ==========================================================
            const emultiStatusHTML = emultis.map(eMultiName => {
                // Filtra as escolas que pertencem a esta eMulti
                const schoolsInE = dynamicSchools.filter(s => s.eMulti.toUpperCase() === eMultiName.toUpperCase());
                
                // Verifica se PELO MENOS UMA escola dessa eMulti realizou a ação
                const eMultiDidAction = schoolsInE.some(school => 
                    firebaseActivitiesData[String(school.inep)]?.[action.key] === true
                );

                // Define o ícone de status (check ou xis)
                const statusIcon = eMultiDidAction 
                    ? '<i class="fas fa-check status-icon-check"></i>' 
                    : '<i class="fas fa-times status-icon-times"></i>';

                return `<li class="emulti-status-item"><span>${eMultiName}</span> ${statusIcon}</li>`;
            }).join('');
            // ==========================================================

            const card = document.createElement('div');
            card.className = 'card-acao';

            // O HTML do card agora inclui a nova lista vertical
            card.innerHTML = `
                <div class="card-acao-icon">
                    <i class="${action.icon}"></i>
                </div>
                <h3>${action.name}</h3>
                <p style="font-size: 1.5rem; text-align: center; font-weight: 700; color: var(--granja-green-medium); margin-top: auto;">
                    ${formatarNumero(percentual)}%
                </p>
                <p style="font-size: 0.9rem; text-align: center; color: #666;">
                    (${escolasComAcao} de ${dynamicSchools.length} escolas)
                </p>
                <ul class="emulti-status-list">
                    ${emultiStatusHTML}
                </ul>
            `;
            gradePrincipal.appendChild(card);
        });
    } else { // Indicador 2
        // A lógica para o Indicador 2 continua a mesma de antes.
        gradePrincipal.style.gridTemplateColumns = 'repeat(auto-fit, minmax(320px, 1fr))';
        emultis.forEach(eMultiName => {
            const schoolsInE = dynamicSchools.filter(s => s.eMulti.toUpperCase() === eMultiName.toUpperCase());
            if (schoolsInE.length === 0) return;
            let schoolsWithAllPriorityGroups = 0;
            schoolsInE.forEach(school => {
                const schoolData = firebaseActivitiesData[String(school.inep)];
                if (schoolData && priorityActionGroups.every(group => group.actions.some(key => schoolData[key] === true))) {
                    schoolsWithAllPriorityGroups++;
                }
            });
            const card = document.createElement('div');
            card.className = 'card-emulti-resumo';
            card.innerHTML = `<h3>eMulti: ${eMultiName}</h3><p class="percentual-geral">${formatarNumero(getPontuacao(schoolsWithAllPriorityGroups, schoolsInE.length))}%</p><div class="priority-action-subcard-container">${priorityActionGroups.map(group => {
                const count = schoolsInE.filter(s => group.actions.some(key => firebaseActivitiesData[String(s.inep)]?.[key] === true)).length;
                return `<div class="action-priority-subcard"><span class="action-name-label">${group.name}:</span><span class="action-count">${count}/${schoolsInE.length} Escolas</span></div>`;
            }).join('')}</div>`;
            gradePrincipal.appendChild(card);
        });
    }
}

async function executarRenderizacaoCompleta() {
    await loadSchoolsFromFirestore();
    await loadActivitiesFromFirebaseForDashboard();
    renderizarSeletorDeIndicador();
    renderizarVisaoGeral();
    renderizarGradePrincipal();
}

document.addEventListener('DOMContentLoaded', executarRenderizacaoCompleta);