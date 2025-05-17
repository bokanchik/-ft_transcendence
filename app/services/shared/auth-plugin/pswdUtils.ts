// app/services/users/utils/pswdUtils.ts
import bcrypt from 'bcrypt';

const saltRounds: number = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, saltRounds);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
