// Logique métier (authentification, validation, etc.), sans reply
import * as userModel from '../models/userModel.js';
import * as passwordUtils from '../utils/pswdUtils.js';
import { ConflictError, ValidationError, NotFoundError } from '../utils/appError.js';

export async function loginUser({ identifier, password }) {
	console.log(`Attempting to log in user with identifier: ${identifier}`);
	let user;
	const isEmail = identifier.includes('@');
	if (isEmail) {
		user = await userModel.getUserByEmailFromDb(identifier);
	}
	else {
		user = await userModel.getUserByUsernameFromDb(identifier);
	}
	if (!user || !(await passwordUtils.comparePassword(password, user.password_hash))) {
		throw new ValidationError('Invalid credentials');
	}
	const { password_hash, ...userPassLess } = user;
	return userPassLess;
}

// export async function loginUser({ username, password }) {
// 	console.log('Attempting');
// 	const user = await userModel.getUserByUsernameFromDb(username);
// 	if (!user || !(await passwordUtils.comparePassword(password, user.password_hash))) {
// 		throw new ValidationError('Invalid credentials');
// 	}
// 	const { password_hash, ...userPassLess } = user;
// 	return userPassLess;
// }

export async function createUserAccount(userData) {
	console.log('Creating a new user account');
	const { username, email, password, display_name } = userData;
	const existingUser = await userModel.getUserByUsernameFromDb(username);
	if (existingUser) {
		throw new ConflictError('Username already exists');
	}
	const existingEmail = await userModel.getUserByEmailFromDb(email);
	if (existingEmail) {
		throw new ConflictError('Email already exists');
	}
	const hashedPassword = await passwordUtils.hashPassword(password);

    let finalAvatarUrl = userData.avatar_url; // Prend l'URL fournie s'il y en a une

    if (!finalAvatarUrl || finalAvatarUrl.trim() === "") {
        const encodedName = encodeURIComponent(display_name);
        // Vous pouvez personnaliser les paramètres (background, color, size, etc.)
        finalAvatarUrl = `https://ui-avatars.com/api/?name=${encodedName}&background=random&color=fff&size=128`;
        console.log(`No avatar provided for ${username}. Using default: ${finalAvatarUrl}`);
    }
	const newUser = await userModel.createUser({ username, email, password_hash: hashedPassword, display_name, avatar_url: finalAvatarUrl });
	return newUser;
}

export async function getAllUsers() {
	console.log('Fetching all users from the database');
	return await userModel.getAllUsersFromDb();
}

export async function getUserById(userId) {
	console.log('Fetching user by ID from the database');
	const user = await userModel.getUserByIdFromDb(userId);
	if (!user) {
		throw new NotFoundError('User not found');
	}
	return user;
}

export async function getUserByUsername(username) {
	console.log('Fetching user by username from the database');
	const user = await userModel.getUserByUsernameFromDb(username);
	if (!user) {
		throw new NotFoundError('User not found');
	}
	return user;
}

export async function getUserByEmail(email) {
	console.log('Fetching user by email from the database');
	const user = await userModel.getUserByEmailFromDb(email);
	if (!user) {
		throw new NotFoundError('User not found');
	}
	return user;
}

export async function getUserMatches(userId) {
	console.log('Fetching user matches from the database');
	const matches = await userModel.getUserMatchesFromDb(userId);
	if (!matches) {
		throw new NotFoundError('No matches found for this user');
	}
	return matches;
}

export async function updateUserProfile(userId, updates) {
    console.log(`Updating profile for user ID: ${userId}`);

    // 1. Filtrer les champs autorisés (sécurité)
    const allowedUpdates = {};
    if (updates.hasOwnProperty('display_name')) {
        allowedUpdates.display_name = updates.display_name;
    }
    if (updates.hasOwnProperty('avatar_url')) {
        if (updates.avatar_url === null || updates.avatar_url.trim() === "") {
            revertToDefaultAvatar = true;
            // On ne met pas `null` dans allowedUpdates, on calculera le défaut plus tard
        } else if (typeof updates.avatar_url === 'string' && updates.avatar_url.startsWith('http')) { // Simple validation
             allowedUpdates.avatar_url = updates.avatar_url;
        } else {
             console.warn(`Invalid avatar_url format received for user ${userId}, ignoring.`);
        }
    }
	if (updates.hasOwnProperty('email') && updates.email !== null && updates.email !== "") { // Ne pas permettre null ou vide pour email
         // Validation supplémentaire (le format est déjà vérifié par le schéma)
         if (typeof updates.email === 'string' && updates.email.includes('@')) {
             allowedUpdates.email = updates.email;
         } else {
             console.warn(`Invalid email format received for user ${userId}, ignoring.`);
             // Optionnel: lancer une ValidationError si on veut être plus strict
             // throw new ValidationError("Invalid email format provided.");
         }
    }

        if (Object.keys(allowedUpdates).length === 0 && !revertToDefaultAvatar) {
        console.log("No valid fields provided for update.");
        const currentUser = await userModel.getUserByIdFromDb(userId);
        if (!currentUser) throw new NotFoundError('User not found');
        return currentUser;
    }

    let currentUserForDefault = null;
    if (revertToDefaultAvatar) {
         // On a besoin du display_name actuel (ou username si display_name n'est pas là)
         // pour générer l'URL par défaut. Si display_name est aussi mis à jour, utiliser le nouveau.
         const nameForAvatar = allowedUpdates.display_name || (await userModel.getUserByIdFromDb(userId))?.display_name;
         if (nameForAvatar) {
             const encodedName = encodeURIComponent(nameForAvatar);
             allowedUpdates.avatar_url = `https://ui-avatars.com/api/?name=${encodedName}&background=random&color=fff&size=128`;
             console.log(`Avatar removed for user ${userId}. Reverting to default: ${allowedUpdates.avatar_url}`);
         } else {
             // Fallback si on n'a pas pu récupérer de nom
             console.warn(`Could not determine name for default avatar for user ${userId}. Setting avatar_url to null.`);
             allowedUpdates.avatar_url = null; // Ou une URL statique très générique
         }
    }

    // 2. Vérifications métier (ex: unicité)
    if (allowedUpdates.display_name) {
        const existingUser = await userModel.getUserByDisplayNameFromDb(allowedUpdates.display_name);
        // Vérifie si le display_name existe ET appartient à un autre utilisateur
        if (existingUser && existingUser.id !== userId) {
            throw new ConflictError('Display name already taken by another user.');
        }
    }
    if (allowedUpdates.email) {
        const existingUser = await userModel.getUserByEmailFromDb(allowedUpdates.email);
        // Vérifie si l'email existe ET appartient à un autre utilisateur
        if (existingUser && existingUser.id !== userId) {
            throw new ConflictError('Email already taken by another user.');
        }
    }

    if (Object.keys(allowedUpdates).length === 0) {
        console.log("No valid fields provided for update.");
        // Retourne l'utilisateur actuel sans modification, ou lance une erreur BadRequest ?
        // Pour l'instant, on retourne l'utilisateur actuel.
         const currentUser = await userModel.getUserByIdFromDb(userId);
         if (!currentUser) throw new NotFoundError('User not found');
         return currentUser;
        // Ou : throw new ValidationError("No valid fields provided for update.");
    }
    // 3. Appeler le modèle pour mettre à jour la base de données
    const result = await userModel.updateUserInDb(userId, allowedUpdates);

    // 4. Vérifier si la mise à jour a réussi
    if (result.changes === 0) {
        // Cela peut arriver si l'ID utilisateur n'existe pas, ou si les données fournies sont identiques aux données actuelles.
        // Vérifions si l'utilisateur existe toujours.
        const userExists = await userModel.getUserByIdFromDb(userId);
        if (!userExists) {
            throw new NotFoundError('User not found');
        }
        console.log(`No changes detected for user ${userId}. Data might be identical.`);
        // Retourne les données actuelles car rien n'a changé ou l'utilisateur n'existe pas
         return userExists;
    }

    // 5. Récupérer et retourner les données utilisateur mises à jour (sans le hash du mdp)
    const updatedUser = await userModel.getUserByIdFromDb(userId);
     if (!updatedUser) {
         // Ne devrait pas arriver si result.changes > 0, mais sécurité
         throw new NotFoundError('User not found after update attempt.');
     }
    return updatedUser; // getUserByIdFromDb ne retourne déjà pas le hash
}
