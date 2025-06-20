// auth.js

// As instâncias 'firebase.firestore()' e 'firebase.auth()' são globais via CDN no HTML.

// Referências do DOM para a página de login (se estivermos nela)
const loginEmailInput = document.getElementById('loginEmail');
const loginPasswordInput = document.getElementById('loginPassword');
const loginBtn = document.getElementById('loginBtn');
const loginStatusDiv = document.getElementById('login-status');

// Referência do DOM para o link de Sair (logout)
const logoutLink = document.getElementById('logout-link');

// Define as páginas que requerem autenticação
const protectedPages = ['index.html', 'escolas.html', 'admin.html'];

// --- Lógica de Autenticação ---

/**
 * Observa o estado de autenticação do Firebase.
 * Esta função é executada sempre que o estado de autenticação muda (login, logout, recarga da página).
 */
firebase.auth().onAuthStateChanged(async (user) => {
    const currentPage = window.location.pathname.split('/').pop(); // Obtém o nome do arquivo HTML atual

    console.log(`auth.js: onAuthStateChanged - Usuário atual: ${user ? user.email : 'Nenhum'}. Página: ${currentPage}`); // LOG ADICIONAL

    if (user) {
        // Usuário logado
        console.log("auth.js: Usuário logado:", user.email);
        const userRole = await getUserRole(user.uid); // Obtém o perfil do usuário
        console.log("auth.js: Perfil do usuário:", userRole);

        // Exibir link do Painel Admin apenas para admins
        const adminLinks = document.querySelectorAll('.nav-link.admin-only');
        if (adminLinks.length > 0) {
            if (userRole === 'admin') {
                adminLinks.forEach(link => link.style.display = 'block'); // Mostra para admins
            } else {
                adminLinks.forEach(link => link.style.display = 'none'); // Oculta para não-admins
            }
        }

        // Exibir link de Sair quando o usuário está logado
        if (logoutLink) {
            logoutLink.style.display = 'block';
        }

        // Redireciona da página de login se já estiver logado
        if (currentPage === 'login.html') {
            console.log("auth.js: Usuário logado em login.html, redirecionando para index.html."); // LOG ADICIONAL
            window.location.href = 'index.html'; // Redireciona para o dashboard
        }

        // Se estiver na página admin e NÃO for admin, redireciona
        if (currentPage === 'admin.html' && userRole !== 'admin') {
            alert('Acesso restrito: Apenas administradores podem acessar esta página.');
            console.log("auth.js: Acesso negado a admin.html para usuário não-admin. Redirecionando para index.html."); // LOG ADICIONAL
            window.location.href = 'index.html'; // Redireciona para o dashboard
        }

    } else {
        // Usuário NÃO logado
        console.log("auth.js: Nenhum usuário logado.");
        const adminLinks = document.querySelectorAll('.nav-link.admin-only');
        adminLinks.forEach(link => link.style.display = 'none'); // Oculta o link admin

        // Ocultar link de Sair quando o usuário NÃO está logado
        if (logoutLink) {
            logoutLink.style.display = 'none';
        }

        // Se estiver em uma página protegida e não for a de login, redireciona para o login
        if (protectedPages.includes(currentPage) && currentPage !== 'login.html') {
            console.log(`auth.js: Página ${currentPage} protegida. Usuário não logado, redirecionando para login.html.`); // LOG ADICIONAL
            window.location.href = 'login.html'; // Redireciona para a página de login
        }
    }
});

// Lógica de Login (apenas na página de login.html)
if (loginBtn) { // Verifica se o botão de login existe na página atual (ou seja, estamos em login.html)
    loginBtn.addEventListener('click', async () => {
        const email = loginEmailInput.value.trim(); // Trim para remover espaços em branco
        const password = loginPasswordInput.value.trim();

        if (!email || !password) {
            loginStatusDiv.textContent = 'Por favor, preencha email e senha.';
            loginStatusDiv.className = 'status-message error'; // Adiciona classe de erro
            return;
        }

        loginStatusDiv.textContent = 'Entrando...';
        loginStatusDiv.className = 'status-message'; // Limpa classes de status anteriores

        try {
            const auth = firebase.auth(); // Acessando a instância global de Auth (compat)
            await auth.signInWithEmailAndPassword(email, password);
            loginStatusDiv.textContent = 'Login realizado com sucesso! Redirecionando...';
            loginStatusDiv.className = 'status-message success'; // Adiciona classe de sucesso
            // onAuthStateChanged (acima) cuidará do redirecionamento após o login bem-sucedido
        } catch (error) {
            let errorMessage = "Erro ao fazer login.";
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                errorMessage = "Email ou senha inválidos.";
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = "Formato de email inválido.";
            } else if (error.code === 'auth/too-many-requests') {
                 errorMessage = "Muitas tentativas de login. Tente novamente mais tarde.";
            }
            loginStatusDiv.textContent = `${errorMessage} (${error.message})`;
            loginStatusDiv.className = 'status-message error'; // Adiciona classe de erro
            console.error('auth.js: Erro de login:', error);
        }
    });
}

// Lógica de Logout
if (logoutLink) {
    logoutLink.addEventListener('click', async (e) => {
        e.preventDefault(); // Previne o comportamento padrão do link
        try {
            const auth = firebase.auth(); // Acessando a instância global de Auth (compat)
            await auth.signOut();
            alert("Você foi desconectado.");
            window.location.href = 'login.html'; // Redireciona para a página de login após o logout
        } catch (error) {
            console.error("auth.js: Erro ao desconectar:", error);
            alert("Erro ao desconectar: " + error.message);
        }
    });
}

/**
 * Obtém o perfil (role) do usuário logado no Firestore.
 * @param {string} uid O UID do usuário do Firebase Authentication.
 * @returns {Promise<string>} O perfil do usuário ('user' ou 'admin'), ou 'user' como padrão.
 */
async function getUserRole(uid) {
    try {
        const db = firebase.firestore(); // Acessando a instância global do Firestore (compat)
        const userRoleDoc = db.collection('userRoles').doc(uid); // Referência ao documento de perfil do usuário
        const docSnap = await userRoleDoc.get(); // Obtém o snapshot do documento
        if (docSnap.exists) { // Verifica se o documento existe (compat)
            return docSnap.data().role; // Retorna o perfil
        }
        return 'user'; // Padrão se o perfil não for encontrado
    } catch (error) {
        console.error("auth.js: Erro ao obter perfil do usuário:", error);
        return 'user'; // Em caso de erro, retorna 'user' por segurança
    }
}

/**
 * Exporta a função checkAdminAccess para ser usada por outros módulos (como admin.js).
 * Esta função verifica o acesso de administrador e redireciona se necessário.
 * @returns {Promise<boolean>} Resolve true se o usuário tem acesso ou é redirecionado, false caso contrário.
 */
export async function checkAdminAccess() {
    return new Promise((resolve) => {
        // Usa onAuthStateChanged para garantir que o usuário está autenticado antes de verificar o perfil
        const unsubscribe = firebase.auth().onAuthStateChanged(async (user) => { // Acessando auth via firebase.auth()
            unsubscribe(); // Desinscreve-se após a primeira verificação para evitar múltiplos disparos

            if (!user) {
                // Se não há usuário, redireciona para login
                window.location.href = 'login.html';
                resolve(false);
            } else {
                const userRole = await getUserRole(user.uid);
                // Se o usuário não é admin e está tentando acessar admin.html
                if (userRole !== 'admin' && window.location.pathname.includes('admin.html')) {
                    alert('Acesso restrito: Apenas administradores podem acessar esta página.');
                    window.location.href = 'index.html'; // Redireciona para o dashboard
                    resolve(false);
                }
                resolve(true); // Acesso permitido ou não está em uma página restrita
            }
        });
    });
}

/**
 * NOVO: Função para criar um novo usuário SEM fazer o login automático do usuário recém-criado.
 * Isso permite que o admin crie a conta e permaneça logado.
 * @param {string} email O email do novo usuário.
 * @param {string} password A senha do novo usuário.
 * @param {string} role O perfil (role) do novo usuário ('user' ou 'admin').
 * @returns {Promise<{success: boolean, user?: firebase.User, error?: firebase.FirebaseError}>} Objeto com sucesso/erro e o usuário criado.
 */
export async function createNewUserForAdmin(email, password, role) {
    const auth = firebase.auth();
    const db = firebase.firestore();

    // Armazena o usuário atualmente logado (o admin)
    const currentAdminUser = auth.currentUser;

    try {
        // Cria o novo usuário. ATENÇÃO: Esta função *sempre* loga automaticamente o usuário recém-criado.
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const newUser = userCredential.user;

        console.log(`auth.js: Usuário temporariamente logado após criação: ${newUser.email}`); // LOG ADICIONAL

        // Imediatamente desloga o usuário recém-criado para manter o admin logado (se ele existia).
        // Isso é uma tentativa de UX, mas tem nuances.
        if (currentAdminUser) {
            await auth.signOut(); // Desloga o novo usuário (ou quem estiver logado)
            console.log("auth.js: Novo usuário deslogado. Tentando re-autenticar o admin..."); // LOG ADICIONAL
            // Reautentica o admin original
            await auth.signInWithEmailAndPassword(currentAdminUser.email, localStorage.getItem('adminPasswordHash')); // ATENÇÃO: Armazenar senha é inseguro! Melhor solução seria Cloud Function.
            console.log(`auth.js: Admin ${currentAdminUser.email} re-autenticado.`); // LOG ADICIONAL
        } else {
            // Se não havia admin logado (cenário improvável para essa função), apenas desloga o novo usuário
            await auth.signOut();
            console.log("auth.js: Nenhum admin logado. Novo usuário deslogado."); // LOG ADICIONAL
        }

        // Salva o perfil (role) do novo usuário no Firestore.
        await db.collection('userRoles').doc(newUser.uid).set({
            email: email,
            role: role,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log(`auth.js: Usuário ${email} criado com sucesso e perfil salvo. Role: ${role}.`);
        return { success: true, user: newUser };

    } catch (error) {
        console.error("auth.js: Erro ao criar novo usuário:", error);
        // Em caso de erro na criação, se o admin foi deslogado por alguma tentativa anterior de create,
        // pode ser necessário tentar re-autenticá-lo aqui também.
        if (currentAdminUser && !auth.currentUser && error.code !== 'auth/email-already-in-use') { // Se o admin não está mais logado e não foi só email em uso
             console.warn("auth.js: Admin parece ter sido deslogado por um erro de criação. Tentando re-autenticar.");
             try {
                await auth.signInWithEmailAndPassword(currentAdminUser.email, localStorage.getItem('adminPasswordHash'));
             } catch (reauthError) {
                console.error("auth.js: Erro ao re-autenticar admin após falha na criação de usuário:", reauthError);
                alert("Sua sessão de administrador pode ter expirado. Por favor, faça login novamente.");
                window.location.href = 'login.html';
             }
        }
        return { success: false, error: error };
    }
}