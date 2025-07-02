// js/auth.js (VERSÃO FINAL COM 2 PERFIS)

// Define quais páginas cada perfil de utilizador tem permissão para aceder.
const allowedPagesByRole = {
    // Admin pode aceder a tudo.
    admin: ['admin.html', 'index.html', 'escolas.html', 'vacinacao.html', 'saudebucal.html'],
    // Utilizador comum pode aceder a todos os painéis, exceto o de admin.
    user: ['index.html', 'escolas.html', 'vacinacao.html', 'saudebucal.html']
};

/**
 * Redireciona o navegador para uma nova página, evitando loops de recarregamento.
 * @param {string} page - A página de destino (ex: 'index.html').
 */
function redirectTo(page) {
    const currentPath = window.location.pathname;
    const targetPath = currentPath.substring(0, currentPath.lastIndexOf('/') + 1) + page;

    if (window.location.pathname.endsWith(page) || (page === 'index.html' && currentPath.endsWith('/'))) {
        return;
    }
    window.location.href = page;
}

/**
 * Procura o perfil do utilizador no Firestore.
 * @param {string} uid - O ID do utilizador.
 * @returns {Promise<Object>} O objeto de perfil do utilizador.
 */
async function getUserProfile(uid) {
    if (!uid) return { role: 'user' };
    try {
        const userRoleDoc = await firebase.firestore().collection('userRoles').doc(uid).get();
        // Se não encontrar um perfil, assume 'user' como padrão.
        return userRoleDoc.exists ? userRoleDoc.data() : { role: 'user' };
    } catch (error) {
        console.error(`Erro ao procurar perfil para o UID ${uid}:`, error);
        return { role: 'user' };
    }
}

// --- LÓGICA PRINCIPAL DE AUTENTICAÇÃO ---
firebase.auth().onAuthStateChanged(async (user) => {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    if (user) {
        const userProfile = await getUserProfile(user.uid);
        const role = userProfile.role || 'user';

        // Obtém a lista de páginas permitidas para o perfil. Se o perfil não existir, usa as regras de 'user'.
        const allowedPages = allowedPagesByRole[role] || allowedPagesByRole['user'];
        
        // Se a página atual NÃO ESTÁ na lista de permitidas, redireciona para a página principal do perfil.
        if (!allowedPages.includes(currentPage)) {
            const primaryPage = allowedPages[0]; // A primeira página da lista é a principal.
            redirectTo(primaryPage);
            return; // Interrompe a execução para esperar o redirecionamento.
        }

        // Se chegou até aqui, o utilizador está numa página permitida.
        // Apenas ajusta a visibilidade dos links da navegação.
        document.querySelectorAll('.nav-link.admin-only').forEach(link => {
            link.style.display = (role === 'admin') ? 'inline-block' : 'none';
        });
        if (document.getElementById('logout-link')) {
            document.getElementById('logout-link').style.display = 'inline-block';
        }

    } else { // Se não há utilizador com sessão iniciada
        if (document.getElementById('logout-link')) {
            document.getElementById('logout-link').style.display = 'none';
        }
        // Redireciona para a página de login se tentar aceder a qualquer outra página.
        if (currentPage !== 'login.html') {
            redirectTo('login.html');
        }
    }
});


// --- FUNÇÕES DE AÇÃO (Login, Logout, etc.) ---
const loginBtn = document.getElementById('loginBtn');
if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value.trim();
        const statusDiv = document.getElementById('login-status');
        if (!email || !password) {
            statusDiv.textContent = 'Preencha o email e a palavra-passe.';
            statusDiv.className = 'status-message error';
            return;
        }
        statusDiv.textContent = 'A autenticar...';
        statusDiv.className = 'status-message';
        try {
            await firebase.auth().signInWithEmailAndPassword(email, password);
        } catch (error) {
            statusDiv.textContent = "Email ou palavra-passe inválidos.";
            statusDiv.className = 'status-message error';
            console.error('Erro de login:', error);
        }
    });
}

const logoutLink = document.getElementById('logout-link');
if (logoutLink) {
    logoutLink.addEventListener('click', async (e) => {
        e.preventDefault();
        await firebase.auth().signOut();
    });
}

// --- FUNÇÕES EXPORTADAS PARA O PAINEL DE ADMIN ---
export async function checkAdminAccess() {
    return new Promise((resolve, reject) => {
        const unsubscribe = firebase.auth().onAuthStateChanged(async user => {
            unsubscribe();
            if (user) {
                const userProfile = await getUserProfile(user.uid);
                if (userProfile.role === 'admin') {
                    resolve(true);
                } else {
                    redirectTo('index.html');
                    reject(new Error('Acesso negado: o utilizador não é um administrador.'));
                }
            } else {
                redirectTo('login.html');
                reject(new Error('Acesso negado: o utilizador não tem sessão iniciada.'));
            }
        });
    });
}

export async function createNewUserForAdmin(email, password, role) {
    const db = firebase.firestore();
    const tempAppName = `app-${Date.now()}`;
    let tempApp;
    try {
        tempApp = firebase.initializeApp(firebase.app().options, tempAppName);
        const tempAuth = tempApp.auth();

        const userCredential = await tempAuth.createUserWithEmailAndPassword(email, password);
        const newUser = userCredential.user;
        
        const profileData = {
            email: email,
            role: role,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        };
        await db.collection('userRoles').doc(newUser.uid).set(profileData);
        
        alert(`Utilizador ${email} (perfil: ${role}) criado com sucesso!`);

    } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
            alert(
                'ERRO: O email informado já está registado.\n\n' +
                'Para corrigir, siga estes passos:\n' +
                '1. Vá à Consola do Firebase > Authentication.\n' +
                '2. Apague o utilizador com este email.\n' +
                '3. Volte aqui e crie o utilizador novamente.'
            );
        } else {
            alert(`Erro ao criar utilizador: ${error.message}`);
        }
        console.error("Erro em createNewUserForAdmin:", error);
    } finally {
        if (tempApp) {
            await tempApp.delete();
        }
    }
}
