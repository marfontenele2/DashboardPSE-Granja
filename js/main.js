// main.js

// As instâncias 'firebase.firestore()' e 'firebase.auth()' são globais via CDN no HTML.

// Importa dados fixos e mapeamentos do seu data.js
// schools NÃO É MAIS IMPORTADO DE data.js, será carregado dinamicamente do Firestore.
import { emultis, allPseActions, priorityPseActions, INDICATOR_TARGET_PERCENTAGE } from './data.js';
// Importa a função de criação de cards (se você a tiver em components.js)
import { createCard } from './components.js'; // Verifique se components.js ainda é relevante/existente

// Nenhuma inicialização de Firebase aqui, pois é feito no HTML

// Referências aos elementos do DOM
const seletorIndicadorContainer = document.getElementById('seletor-indicador-container');
const visaoGeralContainer = document.getElementById('visao-geral-container');
const gradePrincipal = document.getElementById('grade-principal');
const headerInfoDiv = document.querySelector('.header-info'); // Adicionado para exibir a competência no cabeçalho

// Variáveis de estado da aplicação
let indicadorSelecionado = 'indicador1'; // 'indicador1' ou 'indicador2'
// Armazenará os dados de atividades lidos do Firebase
let firebaseActivitiesData = {};
// NOVA: Armazenará a lista de escolas carregada do Firestore
let dynamicSchools = [];

// --- Funções Auxiliares ---

/**
 * Calcula a pontuação percentual.
 * @param {number} totalAtingido O número de itens que atingiram o indicador.
 * @param {number} totalEscolas O número total de escolas consideradas.
 * @returns {number} O percentual calculado, ou 0 se totalEscolas for 0.
 */
function getPontuacao(totalAtingido, totalEscolas) {
    if (totalEscolas === 0) return 0;
    return (totalAtingido / totalEscolas) * 100;
}

/**
 * Retorna informações de status (classe CSS, texto, ícone) baseadas em um percentual.
 * @param {number} percentage O percentual a ser avaliado.
 * @returns {{classe: string, texto: string, icone: string}} Objeto com informações de status.
 */
function getStatusInfoByPercentage(percentage) {
    if (percentage >= 50) {
        return { classe: 'status-otimo-acao', texto: 'Ótimo', icone: 'fa-star' };
    } else if (percentage >= 25) {
        return { classe: 'status-bom-acao', texto: 'Bom', icone: 'fa-check-circle' };
    } else {
        return { classe: 'status-insuficiente', texto: 'Insuficiente', icone: 'fa-times-circle' };
    }
}

/**
 * Formata um número para o formato de moeda brasileiro com uma casa decimal.
 * @param {number} num O número a ser formatado.
 * @returns {string} O número formatado como string.
 */
function formatarNumero(num) {
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

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
        console.log('Dashboard: Escolas carregadas do Firestore:', dynamicSchools);
    } catch (error) {
        console.error('Dashboard: Erro ao carregar escolas do Firestore:', error);
        alert('Não foi possível carregar a lista de escolas. Verifique o console.');
    }
}


/**
 * Carrega os dados de atividades das escolas do Firestore.
 * Os dados são armazenados em 'firebaseActivitiesData' para uso posterior.
 */
async function loadActivitiesFromFirebaseForDashboard() {
    firebaseActivitiesData = {}; // Limpa os dados existentes
    try {
        const db = firebase.firestore(); // Acessando a instância global do Firestore (compat)
        const querySnapshot = await db.collection('pseActivities').get(); // Usando sintaxe compat
        querySnapshot.forEach(doc => {
            const data = doc.data();
            firebaseActivitiesData[String(data.inep)] = data; // Armazena por INEP
        });
        console.log('Dashboard: Dados de atividades carregados do Firebase:', firebaseActivitiesData);
    } catch (error) {
        console.error('Dashboard: Erro ao carregar dados de atividades do Firebase:', error);
        alert('Não foi possível carregar os dados do dashboard. Verifique o console.');
    }
}

/**
 * Carrega a competência atual salva no Firestore e a exibe no cabeçalho.
 * Se a competência não for encontrada, exibe "Não definida".
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

        let competenciaSpan = document.getElementById('competencia-display');
        if (!competenciaSpan) {
            // Cria o elemento se ele não existir
            competenciaSpan = document.createElement('span');
            competenciaSpan.id = 'competencia-display';
            // Insere antes do menu principal no header-info
            headerInfoDiv.insertBefore(competenciaSpan, headerInfoDiv.querySelector('.main-nav'));
        }
        competenciaSpan.textContent = competenciaText;

    } catch (error) {
        console.error("Dashboard: Erro ao carregar e exibir competência:", error);
    }
}

/**
 * Verifica se os dados precisam ser recarregados do Firebase com base no timestamp.
 * Isso ajuda a evitar recargas desnecessárias e a manter os dados atualizados após um upload.
 * @returns {Promise<boolean>} True se os dados precisam ser recarregados, false caso contrário.
 */
async function shouldReloadData() {
    try {
        const db = firebase.firestore(); // Acessando a instância global do Firestore (compat)
        const lastUpdateDocRef = db.collection('appConfig').doc('lastDataUpdate'); // Usando sintaxe compat
        const docSnap = await lastUpdateDocRef.get(); // Usando sintaxe compat

        // Obtém o timestamp da última atualização no Firebase (ou 0 se não existir)
        const lastFirebaseUpdate = docSnap.exists && docSnap.data().timestamp ? docSnap.data().timestamp.toMillis() : 0;
        // Obtém o timestamp da última atualização armazenado na sessão local
        const lastSessionUpdate = localStorage.getItem('lastDataUpdateTimestamp');

        console.log(`Dashboard: Last Firebase Update Timestamp: ${lastFirebaseUpdate}`);
        console.log(`Dashboard: Last Session Update Timestamp: ${lastSessionUpdate}`);

        // Se não houver timestamp na sessão ou o do Firebase for mais recente, recarregar.
        if (!lastSessionUpdate || lastFirebaseUpdate > parseInt(lastSessionUpdate, 10)) {
            localStorage.setItem('lastDataUpdateTimestamp', lastFirebaseUpdate.toString());
            console.log("Dashboard: Recarregamento de dados necessário.");
            return true;
        }
        console.log("Dashboard: Recarregamento de dados NÃO necessário.");
        return false; // Não precisa recarregar
    } catch (error) {
        console.error("Dashboard: Erro ao verificar timestamp de atualização, forçando recarregamento:", error);
        return true; // Em caso de erro, por segurança, força o recarregamento
    }
}

// --- Funções de Renderização do Dashboard ---

/**
 * Renderiza os botões para selecionar entre os indicadores (Indicador 1 e Indicador 2).
 */
function renderizarSeletorDeIndicador() {
    seletorIndicadorContainer.innerHTML = ''; // Limpa o conteúdo anterior
    const indicadores = [
        { id: 'indicador1', name: 'Indicador 1: Escolas com Atividade' },
        { id: 'indicador2', name: 'Indicador 2: Escolas com Ativ. Prioritárias' }
    ];
    let botoesHTML = '';
    indicadores.forEach(indicador => {
        // Adiciona a classe 'active' ao botão do indicador atualmente selecionado
        const isActive = (indicador.id === indicadorSelecionado) ? 'active' : '';
        botoesHTML += `<button class="btn-indicador-aba ${isActive}" data-id="${indicador.id}">${indicador.name}</button>`;
    });
    seletorIndicadorContainer.innerHTML = botoesHTML;

    // Adiciona event listeners aos botões para mudar o indicador
    document.querySelectorAll('.btn-indicador-aba').forEach(btn => {
        btn.addEventListener('click', () => {
            indicadorSelecionado = btn.dataset.id; // Atualiza o indicador selecionado
            executarRenderizacaoCompleta(); // Rerrenderiza todo o dashboard
        });
    });
}

/**
 * Renderiza a seção de Visão Geral, incluindo o percentual geral e o ranking das eMultis.
 */
function renderizarVisaoGeral() {
    visaoGeralContainer.innerHTML = ''; // Limpa o conteúdo anterior

    // AGORA USA dynamicSchools
    let totalEscolasNoDataSet = dynamicSchools.length;
    let escolasComIndicadorAtingido = 0;

    // Se não houver escolas cadastradas, exibe mensagem e sai
    if (totalEscolasNoDataSet === 0) {
        visaoGeralContainer.innerHTML = `<p style="text-align: center; color: var(--granja-dark-gray);">Nenhuma escola cadastrada para exibir dados. Por favor, cadastre escolas no Painel Admin.</p>`;
        gradePrincipal.innerHTML = `<p style="text-align: center; color: var(--granja-dark-gray);">Nenhuma escola cadastrada para exibir dados.</p>`;
        return;
    }


    // Lógica para calcular escolasComIndicadorAtingido baseada no indicador selecionado
    if (indicadorSelecionado === 'indicador1') {
        dynamicSchools.forEach(school => { // AGORA USA dynamicSchools
            const schoolData = firebaseActivitiesData[String(school.inep)];
            if (schoolData) {
                // Verifica se a escola tem QUALQUER uma das ações gerais realizadas
                const hasAnyAction = allPseActions.some(action => {
                    const actionKey = action.replace(/[^a-zA-Z0-9]/g, ''); // Converte nome da ação para chave
                    return schoolData[actionKey] === true;
                });
                if (hasAnyAction) {
                    escolasComIndicadorAtingido++;
                }
            }
        });
    } else { // indicadorSelecionado === 'indicador2'
        dynamicSchools.forEach(school => { // AGORA USA dynamicSchools
            const schoolData = firebaseActivitiesData[String(school.inep)];
            if (schoolData) {
                // Verifica se a escola tem TODAS as ações prioritárias realizadas
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
        // Filtra as escolas pertencentes a esta eMulti (case-insensitive), AGORA USA dynamicSchools
        const schoolsInE = dynamicSchools.filter(s => s.eMulti.toUpperCase() === eMultiName.toUpperCase());
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
    }).sort((a, b) => b.pontuacao - a.pontuacao); // Ordena pelo maior percentual

    let rankingHTML = rankingEmultis.map((eMulti, index) => {
        return `
            <div class="ranking-item">
                <span class="posicao">${index + 1}º</span>
                <span class="nome-equipe">${eMulti.name}</span>
                <span class="pontuacao-ranking">${formatarNumero(eMulti.pontuacao)}%</span>
            </div>
        `;
    }).join('');

    // Preenche o container de visão geral com os KPIs e o ranking
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

/**
 * Renderiza a grade principal de cards, que muda com base no indicador selecionado.
 * Para Indicador 1: Cards por Ação, mostrando status por eMulti.
 * Para Indicador 2: Cards por eMulti, mostrando status das ações prioritárias.
 */
function renderizarGradePrincipal() {
    gradePrincipal.innerHTML = ''; // Limpa o conteúdo anterior

    // Se não houver escolas cadastradas, a mensagem já foi exibida por renderizarVisaoGeral
    if (dynamicSchools.length === 0) {
        return;
    }

    if (indicadorSelecionado === 'indicador1') {
        // Ajusta o layout da grade para 3 colunas (ou mais em telas maiores)
        gradePrincipal.style.gridTemplateColumns = 'repeat(auto-fit, minmax(280px, 1fr))';

        // Para cada ação geral definida
        allPseActions.forEach(actionName => {
            const actionKey = actionName.replace(/[^a-zA-Z0-9]/g, ''); // Gera uma chave limpa para o objeto de dados
            let escolasComAcaoNesteIndicador = 0;
            // AGORA USA dynamicSchools
            const totalEscolasGeral = dynamicSchools.length;

            // Gera os sub-cards para cada eMulti dentro do card de ação
            const emultiSubcardsHTML = emultis.map(eMultiName => {
                // AGORA USA dynamicSchools
                const schoolsInE = dynamicSchools.filter(s => s.eMulti.toUpperCase() === eMultiName.toUpperCase());
                let eMultiSchoolsWithAction = 0;
                schoolsInE.forEach(school => {
                    const schoolData = firebaseActivitiesData[String(school.inep)];
                    // Verifica se a escola tem a ação específica realizada
                    if (schoolData && schoolData[actionKey] === true) {
                        eMultiSchoolsWithAction++;
                    }
                });
                escolasComAcaoNesteIndicador += eMultiSchoolsWithAction; // Soma para o total geral da ação

                // Ação realizada em pelo menos uma escola da eMulti
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
        // Ajusta o layout da grade para 2 colunas (ou mais em telas maiores)
        gradePrincipal.style.gridTemplateColumns = 'repeat(auto-fit, minmax(320px, 1fr))';

        // Para cada eMulti
        emultis.forEach(eMultiName => {
            // AGORA USA dynamicSchools
            const schoolsInE = dynamicSchools.filter(s => s.eMulti.toUpperCase() === eMultiName.toUpperCase());
            const totalSchoolsInE = schoolsInE.length;

            let schoolsWithAllPriorityActionsInE = 0;
            schoolsInE.forEach(school => {
                const schoolData = firebaseActivitiesData[String(school.inep)];
                if (schoolData) {
                    // Verifica se a escola tem TODAS as ações prioritárias realizadas
                    const hasAllPriorityActions = priorityPseActions.every(action => {
                        const actionKey = action.replace(/[^a-zA-Z0-9]/g, '');
                        return schoolData[actionKey] === true;
                    });
                    if (hasAllPriorityActions) {
                        schoolsWithAllPriorityActionsInE++;
                    }
                }
            });
            const percentualGeralE = getPontuacao(schoolsWithAllPriorityActionsInE, totalSchoolsInE);
            const statusInfoE = getStatusInfoByPercentage(percentualGeralE);

            // Gera os sub-cards para cada ação prioritária dentro do card da eMulti
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
 * Gerencia o carregamento de dados e a atualização da interface.
 */
async function executarRenderizacaoCompleta() {
    // Primeiro, carregamos a lista de escolas dinâmicas
    await loadSchoolsFromFirestore();

    // Se não houver escolas cadastradas, exibe mensagem e não tenta carregar atividades
    if (dynamicSchools.length === 0) {
        renderizarSeletorDeIndicador(); // Ainda permite mudar o indicador
        renderizarVisaoGeral(); // Exibirá a mensagem de nenhuma escola
        renderizarGradePrincipal(); // Exibirá a mensagem de nenhuma escola
        return;
    }

    // Verifica se precisa recarregar os dados de atividades do Firebase
    const reloadNeeded = await shouldReloadData();
    if (reloadNeeded || Object.keys(firebaseActivitiesData).length === 0) {
        await loadActivitiesFromFirebaseForDashboard(); // Recarrega os dados de atividades do Firestore
    }
    renderizarSeletorDeIndicador(); // Renderiza os botões de seleção de indicador
    renderizarVisaoGeral(); // Renderiza os KPIs e o ranking
    renderizarGradePrincipal(); // Renderiza os cards de ações/eMultis
}

// Inicializa o dashboard quando o DOM estiver completamente carregado
document.addEventListener('DOMContentLoaded', async () => {
    // Carrega a competência e então verifica a autenticação e renderiza o dashboard
    await loadAndDisplayCompetencia();
    await executarRenderizacaoCompleta();
});