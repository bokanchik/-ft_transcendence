import * as userModel from '../models/userModel.js';
import * as authUtils from '../utils/authUtils.js';
// Note: La génération de JWT est retirée du service, elle sera gérée dans la couche route/contrôleur

// Service pour enregistrer un nouvel utilisateur
export async function registerUser({ username, email, password, display_name, avatar_url }) {
  // 1. Vérifier si l'utilisateur existe déjà (par username ou email)
  const existingUserByUsername = await userModel.getUserByUsernameFromDb(username);
  if (existingUserByUsername) {
    throw new Error('Ce nom d\'utilisateur est déjà pris.');
  }
  // Ajouter une vérification pour l'email si nécessaire
  // const existingUserByEmail = await userModel.getUserByEmailFromDb(email); // (Fonction à créer dans userModel si besoin)
  // if (existingUserByEmail) {
  //   throw new Error('Cette adresse e-mail est déjà utilisée.');
  // }

  // 2. Valider le mot de passe (longueur, complexité - si nécessaire)
  if (!password || password.length < 8) {
      throw new Error('Le mot de passe doit contenir au moins 8 caractères.');
  }

  // 3. Hasher le mot de passe
  const hashedPassword = await authUtils.hashPassword(password);

  // 4. Créer l'utilisateur dans la BDD
  const newUser = await userModel.createUserInDb({
    username,
    email,
    password_hash: hashedPassword,
    display_name: display_name || username, // Utilise le username comme display_name par défaut
    avatar_url
  });

  // 5. Retourner les données de l'utilisateur créé (sans le hash)
  //    Le modèle renvoie déjà l'utilisateur sans le hash.
  return newUser;
}

// Service pour connecter un utilisateur (vérifie les identifiants)
export async function loginUser({ username, password }) {
  // 1. Récupérer l'utilisateur par username (incluant le hash)
  const user = await userModel.getUserByUsernameFromDb(username);

  // 2. Vérifier si l'utilisateur existe et si le mot de passe correspond
  if (!user || !(await authUtils.comparePassword(password, user.password_hash))) {
    throw new Error('Identifiants invalides.'); // Message générique pour la sécurité
  }

  // 3. Retourner les informations de l'utilisateur (sans le hash)
  //    Le token JWT sera généré dans la couche route/contrôleur
  const { password_hash, ...userWithoutPassword } = user;
  return userWithoutPassword; // Contient id, username, email, etc.
}

// Service pour récupérer tous les utilisateurs
export async function getAllUsers() {
  console.log('Service: Récupération de tous les utilisateurs.');
  return await userModel.getAllUsersFromDb();
}

// Service pour récupérer un utilisateur par ID
export async function getUserById(userId) {
  console.log(`Service: Récupération de l'utilisateur ID ${userId}.`);
  const user = await userModel.getUserByIdFromDb(userId);
  if (!user) {
    throw new Error('Utilisateur non trouvé.');
  }
  return user;
}

// Service pour récupérer un utilisateur par Nom d'utilisateur
// (Moins courant que par ID une fois loggué, utile pour des recherches publiques ?)
export async function getUserByUsername(username) {
	console.log(`Service: Récupération de l'utilisateur ${username}.`);
	const user = await userModel.getUserByUsernameFromDb(username); // Récupère avec hash
	if (!user) {
		throw new Error('Utilisateur non trouvé.');
	}
    // Important : Ne pas renvoyer le hash !
    const { password_hash, ...userWithoutPassword } = user;
	return userWithoutPassword;
}


// Service pour récupérer les matchs d'un utilisateur
export async function getUserMatches(userId) {
  console.log(`Service: Récupération des matchs de l'utilisateur ID ${userId}.`);
  const matches = await userModel.getUserMatchesFromDb(userId);
  // Pas d'erreur si aucun match n'est trouvé, retourne juste un tableau vide.
  return matches;
}

// Note: La fonction `createUserAccount` semble redondante avec `registerUser`.
// Il vaut mieux avoir une seule fonction pour la création de compte.
// export async function createUserAccount(userData) { ... } // Supprimée ou fusionnée avec registerUser
