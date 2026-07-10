import { UserRepository } from "../repositories/UserRepository"
import bcrypt from 'bcrypt';
import { omitPassword } from "../utils/omitPassword";
import { User } from "../models/User";
import { generateToken } from "../utils/jwt";

// A camada Service é responsável por chamar os métodos de Repository e cuidar das validações das nossas regras de negócio (ex: um usuário precisa ter email válido, etc)

// Aqui estamos criando uma classe de erro que extende a classe Error
// Isso é para permitir que, mais tarde, o Controller identifique o tipo de erro de uma forma mais clara

export class NotFoundError extends Error{}
export class Unauthorized extends Error{} // erro lançado quando alguém não está autorizado a haacessççcar tal rota
 
export const UserService = {

    // Como para listar não precisamos validar nada, aqui só chamamos o método do Repository mesmo, pois o Controller NÃO PODE se comunicar diretamente com Repository, e sim com Service
    async listAll(){
        return UserRepository.findAll()
    },

    async getById(id:number) {
        const user = await UserRepository.findById(id)

        // Aqui vai nossa primeira validação
        // Se não encontrarmos um user com esse id, ele não existe
        // Se não existe, vamos lançar um erro
        if(!user) {
            throw new NotFoundError('Usuário não encontrado!')
        }

        // Se encontrou, não cai no 'if' ali em cima, então podemos usar o return e retornar o user
        return user;

    },

    // recebe email e senha como parâmetros
    async login(data: {email:string, password:string}){
        // verificamos se o email existe
        // precisamos do await já que o método findByEmail é async (ele precisa de um tempo para buscar as informações no banco)
        const user = await UserRepository.findByEmail(data.email)

        
        // verificamos se a senha está correta
        // data.password pega a senha que enviamos como parâmetro (no front ela viria através de um input por exemplo)
        // user.password pega a senha que está no objeto 'user', que é o usuário que encontramos com o método findByEmail, que retorna um user
        const isValid = await bcrypt.compare(data.password, user!.password)

         // fazemos uma verificação caso o email não seja encontrado ou a senha esteja incorreta
         // note que não diferenciamos para proteger contra possíveis invasões
        if (!user || !isValid) throw new NotFoundError("Informações incorretas!")

        // geramos um token válido para o usuário em questão
        const token = generateToken({
            id: user.id,
            email: user.email
        })

        console.log(token)

        return {
            user: omitPassword(user), // chamando este método que criamos anteriormente, a senha do user não aparece na resposta do servidor (IMPORTANTE!)
            token
        }
    },

    
    //import bcrypt from 'bcrypt'

    async create(data: {name:string, email:string, password:string}){
        // Este método gera uma senha criptografada
        const hashedPassword = await bcrypt.hash(data.password,10)

        // isso gera um objeto que é mais ou menos assim:
        /*
            const user = {
                name: "Joãozin da Quebrada",
                email: "joazinqbd@gmail.com",
                password: "$2A7806m.jfheui.97566"
            }
        */
            const user = await UserRepository.create({
                name: data.name,
                email: data.email,
                password: hashedPassword
            })
        
            return omitPassword(user)
        },

        async update(id:number,data: {name?:string, email?:string, password?:string}){

            // encontra o usuário pelo id
            const user = await UserRepository.findById(id)

            if(!user) {
                throw new NotFoundError('Usuário não encontrado!')
            }

            // Só vamos alterar/atualizar os campos que vierem
            // Assim, podemos atualizar só o nome, ou só o email, ou só nome e senha, etc
            if(data.name) user.name = data.name
            if(data.email) user.email = data.email

            // Se vier uma senha nova, a gente precisa criptografar ela de novo
            // Se não veio, mantemos a antiga, sem alteração
            if (data.password) user.password = await bcrypt.hash(data.password, 10)
                
            // Depois de tudo isso acima, chamamos o método create do repository (ele salva no banco)
            const updatedUser = await UserRepository.create(user)

            // Retorna o usuário sem a senha (por causa do omitPassword) para que não mostre a senha na resposta do servidor
            return omitPassword(updatedUser)
        },

        async delete(id:number){
            const user =  await UserRepository.delete(id)

            if (user.affected === 0){
                throw new NotFoundError("Usuário não encontrado!")
            }
        }


        


}