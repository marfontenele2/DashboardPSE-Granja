// js/competencia.js

/**
 * Carrega a competência atual do Firestore e a exibe no elemento do cabeçalho.
 * Esta função foi desenhada para ser usada em todas as páginas da aplicação.
 */
export async function loadAndDisplayCompetencia() {
    // Procura o elemento no cabeçalho para exibir a competência.
    const competenciaDisplay = document.getElementById('competencia-display');
    
    // Se o elemento não existir na página, a função não faz nada.
    if (!competenciaDisplay) {
        return;
    }

    try {
        const doc = await firebase.firestore().collection('appConfig').doc('currentCompetencia').get();
        
        // Verifica se o documento e o campo 'value' existem antes de os mostrar.
        if (doc.exists && doc.data().value) {
            competenciaDisplay.textContent = `Competência: ${doc.data().value}`;
        } else {
            // Não exibe nada se a competência não estiver definida.
            competenciaDisplay.textContent = ""; 
        }
    } catch (error) {
        console.error("Erro ao carregar competência:", error);
        competenciaDisplay.textContent = "Erro ao carregar competência";
    }
}
