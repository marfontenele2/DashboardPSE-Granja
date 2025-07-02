// js/saudebucal.js (VERSÃO ATUALIZADA)

// Função para carregar e exibir a competência atual
async function loadAndDisplayCompetencia() {
    const competenciaDisplay = document.getElementById('competencia-display');
    if (!competenciaDisplay) return; // Sai se o elemento não existir na página

    try {
        const doc = await firebase.firestore().collection('appConfig').doc('currentCompetencia').get();
        if (doc.exists) {
            competenciaDisplay.textContent = doc.data().value;
        } else {
            competenciaDisplay.textContent = "Competência não definida";
        }
    } catch (error) {
        console.error("Erro ao carregar competência:", error);
        competenciaDisplay.textContent = "Erro ao carregar";
    }
}

document.addEventListener('DOMContentLoaded', () => {
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            // Chama ambas as funções de carregamento
            loadOralHealthDashboard();
            loadAndDisplayCompetencia();
        }
    });
});

async function loadOralHealthDashboard() {
    try {
        const db = firebase.firestore();

        const [schoolsSnapshot, activitiesSnapshot] = await Promise.all([
            db.collection('schools').get(),
            db.collection('pseActivities').get()
        ]);

        const allSchools = schoolsSnapshot.docs.map(doc => doc.data());
        const allActivities = {};
        activitiesSnapshot.forEach(doc => {
            allActivities[doc.id] = doc.data();
        });

        const schoolsByTeam = allSchools.reduce((acc, school) => {
            const teamName = school.healthTeam || 'Sem Equipa';
            if (!acc[teamName]) {
                acc[teamName] = [];
            }
            acc[teamName].push(school);
            return acc;
        }, {});

        renderTeamCards(schoolsByTeam, allActivities);

    } catch (error) {
        console.error("Erro fatal ao carregar o painel de Saúde Bucal:", error);
        document.getElementById('teams-dashboard-grid').innerHTML = 
            '<p class="error-message">Não foi possível carregar os dados. Verifique a consola.</p>';
    }
}

function renderTeamCards(schoolsByTeam, allActivities) {
    const grid = document.getElementById('teams-dashboard-grid');
    grid.innerHTML = '';

    const sortedTeamNames = Object.keys(schoolsByTeam).sort();

    for (const teamName of sortedTeamNames) {
        const schools = schoolsByTeam[teamName];
        let schoolsWithActivityCount = 0;

        const inepListHTML = schools.map(school => {
            const schoolActivity = allActivities[school.inep];
            
            // MUDANÇA PRINCIPAL: Verifica a chave 'Escovaodentalsupervisionada'
            const activityPerformed = schoolActivity?.Escovaodentalsupervisionada === true;

            if (activityPerformed) {
                schoolsWithActivityCount++;
            }
            
            const statusIcon = activityPerformed
                ? '<i class="fas fa-check-circle status-completed"></i>'
                : '<i class="fas fa-times-circle status-pending"></i>';

            return `<li><span>${school.name} (${school.inep})</span> ${statusIcon}</li>`;
        }).join('');

        const percentage = schools.length > 0 ? (schoolsWithActivityCount / schools.length) * 100 : 0;
        
        const card = document.createElement('div');
        card.className = 'team-card';
        card.innerHTML = `
            <h3>${teamName}</h3>
            <div class="percentage-display">${percentage.toFixed(0)}%</div>
            <ul class="inep-list">
                ${inepListHTML || '<li>Nenhuma escola vinculada a esta equipa.</li>'}
            </ul>
        `;
        grid.appendChild(card);
    }
}
