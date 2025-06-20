// auth.js

// Importa funções do Firebase Authentication
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// Suas credenciais de configuração do Firebase (as mesmas em todos os JS)
const firebaseConfig = {
  apiKey: "AIzaSyDtF5zN7KLcoMvvOlYhP1Btn0hD_IcFUhs",
  authDomain: "pse-granja.firebaseapp.com",
  projectId: "pse-granja",
  storageBucket: "pse-granja.firebasestorage.app",
  messagingSenderId: "3638651287",
  appId: "1:3638651287:web:760797d66ed93cab0efcd2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// Referências do DOM para a página de login (se estivermos nela)
const loginEmailInput = document.getElementById('loginEmail');
const loginPasswordInput = document.getElementById('loginPassword');
const loginBtn = document.getElementById('loginBtn');
const loginStatusDiv = document.getElementById('login-status');

// Referência do DOM para o link de Sair (logout)
const logoutLink = document.getElementById('logout-link'); // Captura o elemento aqui

// Define as páginas que requerem autenticação
const protectedPages = ['index.html', 'escolas.html', 'admin.html'];

// --- Lógica de Autenticação ---

// Verifica o status de autenticação ao carregar qualquer página
onAuthStateChanged(auth, async (user) => {
    const currentPage = window.location.pathname.split('/').pop();

    if (user) {
        // Usuário logado
        console.log("Usuário logado:", user.email);
        const userRole = await getUserRole(user.uid);
        console.log("Perfil do usuário:", userRole);

        // Exibir link do Painel Admin apenas para admins
        const adminLinks = document.querySelectorAll('.nav-link.admin-only');
        if (adminLinks.length > 0) {
            if (userRole === 'admin') {
                adminLinks.forEach(link => link.style.display = 'block');
            } else {
                adminLinks.forEach(link => link.style.display = 'none');
            }
        }
        
        // Exibir link de Sair quando o usuário está logado
        if (logoutLink) {
            logoutLink.style.display = 'block'; 
        }


        // Redireciona da página de login se já estiver logado
        if (currentPage === 'login.html') {
            window.location.href = 'index.html';
        }

        // Se estiver na página admin e não for admin, redireciona
        if (currentPage === 'admin.html' && userRole !== 'admin') {
            alert('Acesso restrito: Apenas administradores podem acessar esta página.');
            window.location.href = 'index.html';
        }

    } else {
        // Usuário NÃO logado
        console.log("Nenhum usuário logado.");
        const adminLinks = document.querySelectorAll('.nav-link.admin-only');
        adminLinks.forEach(link => link.style.display = 'none'); // Oculta o link admin

        // Ocultar link de Sair quando o usuário NÃO está logado
        if (logoutLink) {
            logoutLink.style.display = 'none';
        }

        // Se estiver em uma página protegida e não for a de login, redireciona para o login
        if (protectedPages.includes(currentPage) && currentPage !== 'login.html') {
            window.location.href = 'login.html';
        }
    }
});


// Lógica de Login (apenas na página de login.html)
if (loginBtn) { // Verifica se o botão de login existe na página atual
    loginBtn.addEventListener('click', async () => {
        const email = loginEmailInput.value;
        const password = loginPasswordInput.value;

        if (!email || !password) {
            loginStatusDiv.textContent = 'Por favor, preencha email e senha.';
            loginStatusDiv.className = 'error';
            return;
        }

        loginStatusDiv.textContent = 'Entrando...';
        loginStatusDiv.className = '';

        try {
            await signInWithEmailAndPassword(auth, email, password);
            loginStatusDiv.textContent = 'Login realizado com sucesso! Redirecionando...';
            loginStatusDiv.className = 'success';
            // onAuthStateChanged cuidará do redirecionamento
        } catch (error) {
            let errorMessage = "Erro ao fazer login.";
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                errorMessage = "Email ou senha inválidos.";
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = "Formato de email inválido.";
            }
            loginStatusDiv.textContent = `${errorMessage} (${error.message})`;
            loginStatusDiv.className = 'error';
            console.error('Erro de login:', error);
        }
    });
}

// Lógica de Logout
// O listener já está no HTML, apenas garanta que a função de logout é chamada
if (logoutLink) {
    logoutLink.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await signOut(auth);
            alert("Você foi desconectado.");
            window.location.href = 'login.html';
        } catch (error) {
            console.error("Erro ao desconectar:", error);
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
        const userRoleDoc = await getDoc(doc(db, 'userRoles', uid));
        if (userRoleDoc.exists()) {
            return userRoleDoc.data().role;
        }
        return 'user';
    } catch (error) {
        console.error("Erro ao obter perfil do usuário:", error);
        return 'user';
    }
}

// Exportar funções (se outras partes do código precisarem, como admin.js)
export async function checkAdminAccess() {
    return new Promise((resolve) => {
        onAuthStateChanged(auth, async (user) => {
            if (!user) {
                window.location.href = 'login.html';
                resolve(false);
            } else {
                const userRole = await getUserRole(user.uid);
                if (userRole !== 'admin' && window.location.pathname.includes('admin.html')) {
                    alert('Acesso restrito: Apenas administradores podem acessar esta página.');
                    window.location.href = 'index.html';
                    resolve(false);
                }
                resolve(true);
            }
        });
    });
}