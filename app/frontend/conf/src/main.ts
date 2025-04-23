import { HomePage } from './components/homePage.js';
import { LoginPage } from './components/loginPage.js'
import { RegisterPage } from './components/registerPage.js'
import { UsersPage } from './pages/userPage.js';

// 1. Conteneur où le contenu de la page sera injecté
const appContainer = document.getElementById('main');

// 2. Fonctions simples pour générer le contenu de chaque "page"
function renderNotFoundPage(): HTMLElement {
    const div = document.createElement('div');
    div.innerHTML = `
        <h1 class="text-3xl font-bold text-red-500 text-center p-8">404 - Page Non Trouvée</h1>
        <p class="text-center">Oups! Cette page n'existe pas.</p>
        <div class="text-center mt-4">
            <a href="/" data-link class="text-blue-500 hover:underline">Retour à l'accueil</a>
        </div>
    `;
    return div;
}

// 3. Définition des routes: quelle URL correspond à quelle fonction de rendu
const routes: { [key: string]: () => HTMLElement | Promise<HTMLElement>} = {
    '/': HomePage,
    '/users': UsersPage,
    '/login': LoginPage,
    '/register': RegisterPage,
};

// 4. La fonction principale du routeur
async function router() {
    if (!appContainer) {
        console.error("ERREUR: Le conteneur #app est introuvable dans le DOM !");
        return;
    }

    // Obtient le chemin actuel de l'URL (ex: "/", "/users")
    const path = window.location.pathname;
    console.log(`Navigation vers: ${path}`);

    // Trouve la fonction de rendu correspondante ou utilise la page 404
    const renderFunction = routes[path] || renderNotFoundPage;

    // Efface le contenu précédent du conteneur
    appContainer.innerHTML = '';

    // Exécute la fonction de rendu et ajoute le nouvel élément au conteneur
    try {
        const pageContent = await renderFunction();
        appContainer.appendChild(pageContent);
    } catch (error) {
        console.error(`Erreur lors du rendu de la route ${path}:`, error);
        appContainer.innerHTML = `<p class="text-red-500 text-center p-8">Une erreur est survenue lors du chargement de la page.</p>`;
    }
}

// 5. Fonction pour naviguer sans recharger la page
function navigateTo(url: string) {
    // Met à jour l'URL dans la barre d'adresse sans recharger
    window.history.pushState({}, '', url);
    // Déclenche manuellement le routeur pour afficher le nouveau contenu
    router();
}

// --- Initialisation et Écouteurs d'Événements ---

// Se déclenche lorsque le HTML initial est chargé
document.addEventListener('DOMContentLoaded', () => {
    // Attache un écouteur de clic global pour intercepter les liens SPA
    document.body.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        // Trouve l'élément <a> le plus proche qui a l'attribut [data-link]
        const linkElement = target.closest('a[data-link]') as HTMLAnchorElement | null;

        if (linkElement) {
            event.preventDefault(); // Empêche le navigateur de suivre le lien normalement
            const destination = linkElement.getAttribute('href');
            if (destination) {
                navigateTo(destination); // Utilise notre fonction de navigation SPA
            }
        }
    });

    // Exécute le routeur pour afficher la page correspondant à l'URL initiale
    router();
});

// Se déclenche lorsque l'utilisateur utilise les boutons Précédent/Suivant du navigateur
window.addEventListener('popstate', () => {
    // Ré-exécute le routeur pour afficher la page correspondant à la nouvelle URL de l'historique
    router();
});

console.log("Simple SPA Router Initialized"); // Message pour confirmer que le script s'est chargé



// import { UsersPage } from './pages/userPage.js';
// import { HomePage } from './components/homePage.js'; // Assure-toi que le chemin est correct
//
// // Définir les types de retour possibles
// type RouteHandler = () => (HTMLElement | Promise<HTMLElement>);
//
// const routes: { [key: string]: RouteHandler } = {
//   '/': HomePage, // Route pour la page d'accueil
//   '/index.html': HomePage, // Au cas où on arrive via index.html
//   '/users.html': UsersPage,
//   // Ajoute d'autres routes ici (login.html, register.html deviendraient des composants)
// };
//
// async function navigateTo(path: string) {
//   window.history.pushState({}, path, path);
//   await router();
// }
//
// async function router() {
//   const app = document.getElementById('app');
//   if (!app) {
//       console.error("App container #app not found!");
//       return;
//   }
//
//   const path = window.location.pathname;
//   console.log("Current path:", path);
//   const handler = routes[path];
//
//   if (!handler) {
//     console.warn("No route found for:", path);
//   }
//
//   app.innerHTML = '<p class="text-center p-8">Loading...</p>';
//   if (handler) {
//     try {
//         const content = await handler(); // Gère les fonctions sync et async (await)
//         app.innerHTML = ''; // Vide avant d'ajouter
//         app.appendChild(content);
//     } catch (error) {
//         console.error("Error loading route:", path, error);
//         app.innerHTML = `<p class="text-center p-8 text-red-500">Error loading page.</p>`;
//     }
//   } else {
//     console.warn("No route found for:", path);
//     app.innerHTML = `
//         <div class="text-center p-8">
//             <h1 class="text-2xl font-bold mb-4">404 - Not Found</h1>
//             <p>The page you requested does not exist.</p>
//             <a href="/" data-link class="text-blue-500 hover:underline mt-4 inline-block">Go Home</a>
//         </div>
//     `;
//   }
//
//   // Attacher les gestionnaires pour les liens SPA après le rendu
//   attachLinkListeners(app);
// }
//
// function attachLinkListeners(container: HTMLElement) {
//     container.querySelectorAll('a[data-link]').forEach(link => {
//         link.addEventListener('click', (event) => {
//             event.preventDefault(); // Empêche le rechargement de la page
//             const target = event.target as HTMLAnchorElement;
//             navigateTo(target.pathname);
//         });
//     });
// }
//
// // Gérer la navigation historique (boutons précédent/suivant du navigateur)
// window.addEventListener('popstate', router);
//
// // Gérer le chargement initial de la page
// document.addEventListener('DOMContentLoaded', () => {
//
//     //Attacher les gestionnaires de clics aux liens présents initialement (si besoin)
//     // document.body.addEventListener('click', (event) => {
//     //     const target = event.target as HTMLElement;
//     //     const anchor = target.closest('a[data-link]');
//     //     if (anchor && anchor instanceof HTMLAnchorElement) {
//     //         event.preventDefault();
//     //         navigateTo(anchor.pathname);
//     //     }
//     // }); // Une approche plus globale
//
//     router(); // Charge la route initiale
// });
