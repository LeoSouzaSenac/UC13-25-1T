import bcrypt from "bcrypt";
import { omitPassword } from "../utils/omitPassword";
import { UserRepository } from "../repositories/UserRepository";
import { PostRepository } from "../repositories/PostRepository";
import { User } from "../models/User";

// A camada Service é responsável por chamar os métodos de Repository e cuidar das validações das nossas regras de negócio (ex: um usuário precisa ter email válido, etc)

// Aqui estamos criando uma classe de erro que extende a classe Error
// Isso é para permitir que, mais tarde, o Controller identifique o tipo de erro de uma forma mais clara

export class NotFoundError extends Error {}

export const PostService = {
  // Como para listar não precisamos validar nada, aqui só chamamos o método do Repository mesmo, pois o Controller NÃO PODE se comunicar diretamente com Repository, e sim com Service
  async listAll() {
    return PostRepository.findAll();
  },
  
  async getById(id: number) {
    const post = await PostRepository.findById(id);
  
    if (!post) {
      throw new NotFoundError("Post não encontrado!");
    }
  
    return post;
  },

  //import bcrypt from 'bcrypt'

  async create(data: { title: string; userId: number }) {

    if (!data.title) {
        throw new Error("Título é obrigatório!");
    }

    if (!data.userId) {
        throw new Error("Usuário é obrigatório!");
    }

    const user = await UserRepository.findById(data.userId);

    if (!user) {
        throw new NotFoundError("Usuário não encontrado!");
    }

    return PostRepository.create({
        title: data.title,
        user
    });
},

  async update(id: number, data: { title?: string }) {
    const post = await PostRepository.findById(id);

    if (!post) {
        throw new NotFoundError("Post não encontrado.");
    }

    if (data.title) post.title = data.title;

    return PostRepository.create(post);
},

async delete(id: number) {
    const result = await PostRepository.delete(id);

    if (result.affected === 0) {
        throw new NotFoundError('Post não encontrado.');
    }
},
};
