// main.js

// Importa funções do Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
// MODIFICADO: Importa diretamente Firestore, sem firebase-config.js
import { getFirestore, collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Importa dados fixos e mapeamentos do seu data.js
import { schools, emultis, allPseActions, priorityPseActions, INDICATOR_TARGET_PERCENTAGE } from './data.js';
// Importa a função de criação de cards (se você a tiver em components.js)
import { createCard } from './components.js';

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


// Referências aos elementos do DOM
const seletorIndicadorContainer = document.getElementById('seletor-indicador-container');
const visaoGeralContainer = document.getElementById('visao-geral-container');
const gradePrincipal = document.getElementById('grade-principal');
const headerInfoDiv = document.querySelector('.header-info');


// Variáveis de estado da aplicação
let indicadorSelecionado = 'indicador1'; // 'indicador1' ou 'indicador2'

// Armazenará os dados de atividades lidos do Firebase
let firebaseActivitiesData = {}; // Estrutura: { inep: { actionKey1: true/false, ... }, ... }


// --- Funções Auxiliares ---
function getPontuacao(totalAtingido, totalEscolas) {
    if (totalEscolas === 0) return 0;
    return (totalAtingido / totalEscolas) * 100;
}

function getStatusInfoByPercentage(percentage) {
    if (percentage >= 50) {
        return { classe: 'status-otimo-acao', texto: 'Ótimo', icone: 'fa-star' };
    } else if (percentage >= 25) {
        return { classe: 'status-bom-acao', texto: 'Bom', icone: 'fa-check-circle' };
    } else {
        return { classe: 'status-insuficiente', texto: 'Insuficiente', icone: 'fa-times-circle' };
    }
}

function formatarNumero(num) {
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

/**
 * Carrega os dados de atividades das escolas do Firestore.
 */
async function loadActivitiesFromFirebaseForDashboard() {
    firebaseActivitiesData = {}; // Limpa dados anteriores
    try {
        const querySnapshot = await getDocs(collection(db, 'pseActivities'));
        querySnapshot.forEach(doc => {
            const data = doc.data();
            // Garante que o INEP seja tratado como string para consistência com o `schools`
            firebaseActivitiesData[String(data.inep)] = data;
        });
        console.log('Dados de atividades carregados do Firebase para o Dashboard:', firebaseActivitiesData);
    } catch (error) {
        console.error('Erro ao carregar dados de atividades do Firebase para o Dashboard:', error);
        alert('Não foi possível carregar os dados do dashboard. Verifique o console.');
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
        const lastSessionUpdate = localStorage.getItem('lastDataUpdateTimestamp');

        // Se nunca carregou na sessão ou o timestamp do Firebase é mais recente, recarrega
        if (!lastSessionUpdate || lastFirebaseUpdate > parseInt(lastSessionUpdate, 10)) {
            localStorage.setItem('lastDataUpdateTimestamp', lastFirebaseUpdate.toString());
            return true;
        }
        return false;
    } catch (error) {
        console.error("Erro ao verificar timestamp de atualização, forçando recarregamento:", error);
        return true; // Em caso de erro, por segurança, força o recarregamento
    }
}


// --- Funções de Renderização do Dashboard ---

function renderizarSeletorDeIndicador() {
    seletorIndicadorContainer.innerHTML = '';
    const indicadores = [
        { id: 'indicador1', name: 'Indicador 1: Escolas com Atividade' },
        { id: 'indicador2', name: 'Indicador 2: Escolas com Ativ. Prioritárias' }
    ];
    let botoesHTML = '';
    indicadores.forEach(indicador => {
        const isActive = (indicador.id === indicadorSelecionado) ? 'active' : '';
        botoesHTML += `<button class="btn-indicador-aba ${isActive}" data-id="${indicador.id}">${indicador.name}</button>`;
    });
    seletorIndicadorContainer.innerHTML = botoesHTML;
    document.querySelectorAll('.btn-indicador-aba').forEach(btn => {
        btn.addEventListener('click', () => {
            indicadorSelecionado = btn.dataset.id;
            executarRenderizacaoCompleta(); // Chame para re-renderizar com o novo indicador
        });
    });
}

function renderizarVisaoGeral() {
    visaoGeralContainer.innerHTML = '';

    let totalEscolasNoDataSet = schools.length;
    let escolasComIndicadorAtingido = 0;

    if (indicadorSelecionado === 'indicador1') {
        schools.forEach(school => {
            const schoolData = firebaseActivitiesData[String(school.inep)];
            if (schoolData) {
                const hasAnyAction = allPseActions.some(action => {
                    const actionKey = action.replace(/[^a-zA-Z0-9]/g, '');
                    return schoolData[actionKey] === true;
                });
                if (hasAnyAction) {
                    escolasComIndicadorAtingido++;
                }
            }
        });
    } else { // indicadorSelecionado === 'indicador2'
        schools.forEach(school => {
            const schoolData = firebaseActivitiesData[String(school.inep)];
            if (schoolData) {
                const hasAllPriorityActions = priorityPseActions.every(action => {
                    const actionKey = action.replace(/[^a-zA-Z0-9]/g, '');
                    return schoolData[actionKey] === true;
                });
                if (hasAllPriorityActions) {
                    escolasComIndicadorAtingido++;
                }
            }
        });
    }

    const percentualGeral = getPontuacao(escolasComIndicadorAtingido, totalEscolasNoDataSet);

    // Ranking das eMultis
    const rankingEmultis = emultis.map(eMultiName => {
        let escolasAtingidasNaE = 0;
        const schoolsInE = schools.filter(s => s.eMulti.toUpperCase() === eMultiName.toUpperCase());
        const totalSchoolsInE = schoolsInE.length;

        schoolsInE.forEach(school => {
            const schoolData = firebaseActivitiesData[String(school.inep)];
            if (schoolData) {
                if (indicadorSelecionado === 'indicador1') {
                    const hasAnyAction = allPseActions.some(action => {
                        const actionKey = action.replace(/[^a-zA-Z0-9]/g, '');
                        return schoolData[actionKey] === true;
                    });
                    if (hasAnyAction) {
                        escolasAtingidasNaE++;
                    }
                } else { // indicador2
                    const hasAllPriorityActions = priorityPseActions.every(action => {
                        const actionKey = action.replace(/[^a-zA-Z0-9]/g, '');
                        return schoolData[actionKey] === true;
                    });
                    if (hasAllPriorityActions) {
                        escolasAtingidasNaE++;
                    }
                }
            }
        });
        const pontuacaoE = getPontuacao(escolasAtingidasNaE, totalSchoolsInE);
        return { name: eMultiName, pontuacao: pontuacaoE, escolasAtingidas: escolasAtingidasNaE, totalEscolas: totalSchoolsInE };
    }).sort((a, b) => b.pontuacao - a.pontuacao);

    let rankingHTML = rankingEmultis.map((eMulti, index) => {
        return `<div class="ranking-item">
                    <span class="posicao">${index + 1}º</span>
                    <span class="nome-equipe">${eMulti.name}</span>
                    <span class="pontuacao-ranking">${formatarNumero(eMulti.pontuacao)}%</span>
                </div>`;
    }).join('');

    visaoGeralContainer.innerHTML = `
        <div class="kpi-card">
            <div class="kpi-card-header"><i class="fas fa-chart-line"></i><h4>PERCENTUAL GERAL</h4></div>
            <p class="kpi-valor">${formatarNumero(percentualGeral)}%</p>
            <div class="distribuicao-status">
                <span>Total de Escolas: <b>${totalEscolasNoDataSet}</b></span>
                <span>Escolas que Atingiram: <b>${escolasComIndicadorAtingido}</b></span>
            </div>
        </div>
        <div class="kpi-card">
            <div class="kpi-card-header"><i class="fas fa-school"></i><h4>ESCOLAS QUE ATINGIRAM POR eMULTI</h4></div>
            <div class="distribuicao-status">
                ${rankingEmultis.map(e => `<span>${e.name}: <b>${e.escolasAtingidas} / ${e.totalEscolas}</b></span>`).join('')}
            </div>
        </div>
        <div class="ranking-card">
            <div class="ranking-card-header">
                <h4><i class="fas fa-trophy"></i> Ranking de eMultis</h4>
                <div class="mini-card-total">
                    <h5>Total eMulti</h5>
                    <p>${emultis.length}</p>
                </div>
            </div>
            <div class="ranking-lista">
                ${rankingHTML}
            </div>
        </div>
    `;
}

function renderizarGradePrincipal() {
    gradePrincipal.innerHTML = '';

    if (indicadorSelecionado === 'indicador1') {
        gradePrincipal.style.gridTemplateColumns = 'repeat(auto-fit, minmax(280px, 1fr))';

        allPseActions.forEach(actionName => {
            const actionKey = actionName.replace(/[^a-zA-Z0-9]/g, '');
            let escolasComAcaoNesteIndicador = 0;
            const totalEscolasGeral = schools.length;

            const emultiSubcardsHTML = emultis.map(eMultiName => {
                const schoolsInE = schools.filter(s => s.eMulti.toUpperCase() === eMultiName.toUpperCase());
                let eMultiSchoolsWithAction = 0;
                schoolsInE.forEach(school => {
                    const schoolData = firebaseActivitiesData[String(school.inep)];
                    if (schoolData && schoolData[actionKey] === true) {
                        eMultiSchoolsWithAction++;
                    }
                });
                escolasComAcaoNesteIndicador += eMultiSchoolsWithAction;

                const hasAnySchoolDoneActionInEMulti = eMultiSchoolsWithAction > 0;

                return `
                    <div class="emulti-action-subcard">
                        <input type="checkbox" id="action-${actionKey}-${eMultiName}" ${hasAnySchoolDoneActionInEMulti ? 'checked' : ''} disabled>
                        <label for="action-${actionKey}-${eMultiName}">${eMultiName} (${eMultiSchoolsWithAction}/${schoolsInE.length})</label>
                    </div>
                `;
            }).join('');

            const percentualAcao = getPontuacao(escolasComAcaoNesteIndicador, totalEscolasGeral);
            const statusInfo = getStatusInfoByPercentage(percentualAcao);

            const cardHTML = `
                <div class="card-acao ${statusInfo.classe}">
                    <div class="card-header-equipe">
                        <h3 class="card-titulo">${actionName}</h3>
                        <span class="card-status-tag"><i class="fas ${statusInfo.icone}"></i> ${statusInfo.texto}</span>
                    </div>
                    <p class="kpi-valor" style="font-size:1.5rem; text-align:center; margin-bottom:10px; color:${statusInfo.classe === 'status-otimo-acao' ? 'var(--granja-blue)' : (statusInfo.classe === 'status-bom-acao' ? 'var(--granja-green-medium)' : 'var(--granja-red)')};">${formatarNumero(percentualAcao)}% Geral</p>
                    <div class="emulti-action-subcard-container">
                        ${emultiSubcardsHTML}
                    </div>
                </div>
            `;
            gradePrincipal.innerHTML += cardHTML;
        });

    } else { // indicadorSelecionado === 'indicador2'
        gradePrincipal.style.gridTemplateColumns = 'repeat(auto-fit, minmax(320px, 1fr))';

        emultis.forEach(eMultiName => {
            const schoolsInE = schools.filter(s => s.eMulti.toUpperCase() === eMultiName.toUpperCase());
            const totalSchoolsInE = schoolsInE.length;

            let schoolsWithAllPriorityActionsInE = 0;
            schoolsInE.forEach(school => {
                const schoolData = firebaseActivitiesData[String(school.inep)];
                if (schoolData) {
                    const hasAllPriorityActions = priorityPseActions.every(action => {
                        const actionKey = action.replace(/[^a-zA-Z0-9]/g, '');
                        return schoolData[actionKey] === true;
                    });
                    if (hasAllPriorityActions) {
                        escolasWithAllPriorityActionsInE++;
                    }
                }
            });
            const percentualGeralE = getPontuacao(escolasWithAllPriorityActionsInE, totalSchoolsInE);
            const statusInfoE = getStatusInfoByPercentage(percentualGeralE);

            let priorityActionsSubcardsHTML = priorityPseActions.map(actionName => {
                const actionKey = actionName.replace(/[^a-zA-Z0-9]/g, '');
                let countSchoolsForAction = 0;
                schoolsInE.forEach(school => {
                    const schoolData = firebaseActivitiesData[String(school.inep)];
                    if (schoolData && schoolData[actionKey] === true) {
                        countSchoolsForAction++;
                    }
                });
                return `
                    <div class="action-priority-subcard">
                        <span class="action-name-label">${actionName}:</span>
                        <span class="action-count">${countSchoolsForAction}/${schoolsInE.length} Escolas</span>
                    </div>
                `;
            }).join('');

            const cardHTML = `
                <div class="card-emulti-resumo ${statusInfoE.classe}" style="border-left-color: ${statusInfoE.classe === 'status-otimo-acao' ? 'var(--granja-blue)' : (statusInfoE.classe === 'status-bom-acao' ? 'var(--granja-green-medium)' : 'var(--granja-red)')};">
                    <h3>eMulti: ${eMultiName}</h3>
                    <p class="percentual-geral">${formatarNumero(percentualGeralE)}% das Escolas com TODAS Ações Prioritárias</p>
                    <div class="priority-action-subcard-container">
                        ${priorityActionsSubcardsHTML}
                    </div>
                </div>
            `;
            gradePrincipal.innerHTML += cardHTML;
        });
    }
}

/**
 * Função mestra para renderizar todos os componentes do dashboard.
 */
async function executarRenderizacaoCompleta() {
    // Verifica se precisa recarregar os dados do Firebase
    const reloadNeeded = await shouldReloadData();
    if (reloadNeeded || Object.keys(firebaseActivitiesData).length === 0) { // Recarrega se necessário ou se os dados ainda não foram carregados
        await loadActivitiesFromFirebaseForDashboard();
    }
    renderizarSeletorDeIndicador();
    renderizarVisaoGeral();
    renderizarGradePrincipal();
}

// Inicializa o dashboard quando o DOM estiver completamente carregado
document.addEventListener('DOMContentLoaded', async () => {
    // Carrega a competência e então verifica a autenticação e renderiza o dashboard
    await loadAndDisplayCompetencia();
    await executarRenderizacaoCompleta();
});