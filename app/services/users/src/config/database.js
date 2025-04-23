import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Détermine le répertoire racine du projet de manière plus robuste
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Remonte de deux niveaux (depuis src/config/) pour atteindre la racine où se trouve db/
const projectRoot = path.join(__dirname, '..', '..');

let db;

// Ouvre et initialise la base de données SQLite
export async function initializeDb() {
  if (db) return db; // Évite les réinitialisations

  const dbDir = path.join(projectRoot, 'db');
  const dbPath = path.join(dbDir, 'database.sqlite');
  const initSQLPath = path.join(dbDir, 'init.sql');

  try {
    // Crée le répertoire db s'il n'existe pas
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
        console.log(`Répertoire ${dbDir} créé.`);
    }

    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    console.log('Base de données connectée :', dbPath);

    if (fs.existsSync(initSQLPath)) {
      const sql = fs.readFileSync(initSQLPath, 'utf-8');
      await db.exec(sql);
      console.log('Base de données initialisée/vérifiée avec init.sql.');
    } else {
      console.warn('Fichier db/init.sql non trouvé. La structure de la base pourrait être manquante.');
    }
    return db;
  } catch (err) {
    console.error('Erreur lors de la connexion ou de l\'initialisation de la base de données:', err.message);
    process.exit(1); // Arrête l'application si la BDD ne peut être initialisée
  }
};

// Retourne l'instance de la base de données initialisée
export function getDb() {
  if (!db) {
    throw new Error('La base de données n\'a pas été initialisée. Appelez initializeDb() au démarrage.');
  }
  return db;
}
