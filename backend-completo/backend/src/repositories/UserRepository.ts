import { AppDataSource } from "../config/data-source";
import { User } from "../models/User";


// Um repository (repositório) é um objeto do TypeORM que contém todas as funções que precisamos para trabalhar com o banco, ligado a uma entidade específica (nesse caso, User)
const repo = AppDataSource.getRepository(User)

export const UserRepository = {
    // Aqui vamos criar os métodos que fazem o CRUD de usuário

    // Busca todos os usuários
    async findAll() {
        // o método find() vem do TypeORM. Ele procura algo em uma tabela
        // ele aceita como parâmetro um objeto com opções para esta busca
        // nesse nosso caso, estamos buscando também os posts relacionados com este usuário, ou seja, quando buscarmos os usuários, o que inclui o 'Joãozinho', o servidor também vai retornar no JSON todos os posts dele, incluindo a vez em que ele xingou sua tia
        return repo.find({relations: ['posts']})  // {relations: {posts:true}}
    },

    async findById(id:number){
        return repo.findOne({where:{id}, relations:['posts']})
    },

    // método para encontrar um jaguara por email
    // vai ser utilizado no login
    async findByEmail(email:string){
        return repo.findOne({where: {email}})
    },

    /*

    */
    async create(data: { id?: number; name:string, email:string, password:string}){
        // cria o usuário
        const user = repo.create(data)
        // salva ele no banco
        return repo.save(user)
    },

    async delete(id:number){
        return repo.delete(id)
    }
}