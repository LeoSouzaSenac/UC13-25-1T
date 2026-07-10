import jwt from "jsonwebtoken";
import * as dotenv from "dotenv";

dotenv.config();

interface Payload {
  id: number;
  email: string;
}

const { JWT_SECRET, JWT_EXPIRES_IN } = process.env;

export function generateToken(payload: Payload) {
  return jwt.sign(payload, JWT_SECRET!, {
    expiresIn: Number(JWT_EXPIRES_IN),
  });
}

// Função que analisa um token e verifica se ele é válido ou não
export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET!);
  } catch {
    return null;
  }
}
