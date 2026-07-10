import { Request, Response, NextFunction } from 'express'
import { UserService } from '../services/UserService'


export class AuthController {
    async login (req: Request, res: Response, next: NextFunction){
        try {
            // precisamos extrair o email e a senha pelo corpo da requisição:
            const {email, password} = req.body // lembre-se: sempre na ordem, e com o mesmo nome

            // chamamos o método de login da camada services:
            const result = await UserService.login({email, password}) // lembre-se que esse método retorna um objeto com o usuário sem senha e o token

            // enviamos o resultado, seja ele qual for, no formato json com o status 200 (OK)
            return res.status(200).json(result)

        } catch(error){
            next(error) // chamamos assim para enviar o erro para o middleware errorHandler (next é tipo um "passa pra outro resolver". O errorHandler captura qualquer erro que for "lançado pro próximo")
        }
    }
}