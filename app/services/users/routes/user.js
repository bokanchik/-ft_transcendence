import { getDb } from '../config/dbConfig.js';

export default async function (fastify, options) {
  fastify.get('/api/users', async (request, reply) => {
    const db = getDb();
    try {
      const users = await db.all('SELECT * FROM users');
      return users;
    } catch (err) {
      return reply.status(500).send({
        error: 'Erreur lors de la récupération des utilisateurs',
        detail: err.message
      });
    }
  });

  fastify.post('/api/users', {
    schema: {
      body: {
        type: 'object',
        required: ['username', 'email', 'password_hash', 'display_name'],
        properties: {
          username: { type: 'string' },
          email: { type: 'string', format: 'email' },
          password_hash: { type: 'string' },
          display_name: { type: 'string' },
          avatar_url: { type: 'string', nullable: true } // facultatif
        }
      }
    }
  }, async (req, reply) => {
    const { username, email, password_hash, display_name, avatar_url = null } = req.body;
    const db = getDb();

    try {
      const result = await db.run(
        `INSERT INTO users (username, email, password_hash, display_name, avatar_url) VALUES (?, ?, ?, ?, ?)`,
        [username, email, password_hash, display_name, avatar_url]
      );

      return {
        id: result.lastID,
        username,
        email,
        display_name,
        avatar_url
      };
    } catch (err) {
      return reply.status(500).send({
        error: 'Erreur lors de l’insertion',
        detail: err.message
      });
    }
  });
}

