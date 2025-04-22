import jwt from 'jsonwebtoken';

const JWT_SECRET = 'super-secret-change-me'; // À mettre dans une vraie config .env

export function generateJWT(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyJWT(token) {
  return jwt.verify(token, JWT_SECRET);
}

