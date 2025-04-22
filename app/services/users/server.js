import Fastify from 'fastify';
import { initializeDb } from './config/dbConfig.js';
import userRoutes from './routes/users.js';

const fastify = Fastify({ logger: true });

fastify.register(userRoutes);

const start = async () => {
  await initializeDb(); // Initialiser la base de données
  try {
    await fastify.listen({ port: 4000, host: '0.0.0.0' });
    console.log('Serveur démarré sur https://KingPong.fr');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();



// import Fastify from 'fastify';
// import fastifyStatic from '@fastify/static';
// import sqlite3 from 'sqlite3';
// import { open } from 'sqlite';
// import fs from 'fs';
// import path from 'path';
// import { fileURLToPath } from 'url';
//
// // __dirname équivalent en ESModules
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
//
// const fastify = Fastify({ logger: true });
//
// let db;
//
// // Servir les fichiers statiques (ex: SPA)
// fastify.register(fastifyStatic, {
//   root: path.join(__dirname, 'public'),
//   wildcard: false,
// });
//
// // Route API simple
// fastify.get('/api/hello', async () => {
//   return { message: 'Bonjour depuis Fastify avec SQLite !' };
// });
//
// // Route pour récupérer les utilisateurs depuis SQLite
// fastify.get('/api/users', async () => {
//   const users = await db.all('SELECT * FROM users');
//   return users;
// });
//
// // Route POST pour ajouter un utilisateur
// fastify.post('/api/users', {
//   schema: {
//     body: {
//       type: 'object',
//       required: ['username', 'email', 'password_hash', 'display_name'],
//       properties: {
//         username: { type: 'string' },
//         email: { type: 'string', format: 'email' },
//         password_hash: { type: 'string' },
//         display_name: { type: 'string' },
//         avatar: { type: 'string', nullable: true } // facultatif
//       }
//     }
//   }
// }, async (req, reply) => {
//   const { username, email, password_hash, display_name, avatar_url = null } = req.body;
//
//   try {
//     const result = await db.run(
//       `INSERT INTO users (username, email, password_hash, display_name, avatar_url) VALUES (?, ?, ?, ?, ?)`,
//       [username, email, password_hash, display_name, avatar_url]
//     );
//
//     return {
//       id: result.lastID,
//       username,
//       email,
//       display_name,
//       avatar_url
//     };
//   } catch (err) {
//     return reply.status(500).send({
//       error: 'Erreur lors de l’insertion',
//       detail: err.message
//     });
//   }
// });
//
// // Route fallback pour le routing côté client (React/Vue/etc.)
// fastify.setNotFoundHandler((req, reply) => {
//   reply.type('text/html').sendFile('index.html');
// });
//
// // Démarrage + initialisation SQLite
// const start = async () => {
//   // Ouvre la base de données SQLite
//   db = await open({
//     filename: path.join(__dirname, 'db', 'database.sqlite'),
//     driver: sqlite3.Database
//   });
//
//   // Initialise la base avec init.sql si dispo
//   const initSQLPath = path.join(__dirname, 'db', 'init.sql');
//   if (fs.existsSync(initSQLPath)) {
//     const sql = fs.readFileSync(initSQLPath, 'utf-8');
//   try {
//     await db.exec(sql);
//     console.log('Base de données initialisée.');
//   } catch (err) {
//     console.error('Erreur SQL pendant l\'initialisation :', err.message);
//   }
//   } else {
//     console.warn('init.sql non trouvé. Base non initialisée.');
//   }
//
//   // Lancer le serveur
//   await fastify.listen({ port: 3000, host: '0.0.0.0' });
// };
//
// start();
