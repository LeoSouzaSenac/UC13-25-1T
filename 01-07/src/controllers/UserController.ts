import { NextFunction, Request, Response } from "express";
import { UserService } from "../services/UserService";


export class UserController{

    // GET /users -> lista todos os cpx
    async list(req:Request, res:Response, next:NextFunction){
        try {
            // É papel do Controller chamar os métodos que criamos na camada SERVICES
            const users = await UserService.listAll()
            // Note que a gente não usou status aqui. Isso pq, quando a gente não define status, ele retorna automaticamente o status 200
            return res.json(users)
        } catch(error){
            // next(error) joga o erro pro errorHandler, que decide o status e a mensagem certa dependendo do erro
            next(error)
        }
    }

    // GET /users/:id -> busca um cupinxa pelo id 
    async getById(req:Request, res:Response, next:NextFunction){
        try {

            const id = Number(req.params.id) // pega o id pelos parâmetros da URL
            const user = await UserService.getById(id) 
            return res.json(user)

        } catch(error){
            next(error)
        }
    }

    // POST /users -> cria um novo cupinxa
    async create (req:Request, res:Response, next:NextFunction){
        try{

            const { name, email, password } = req.body // pega name, email e password pelo corpo da requisição
            const user = UserService.create({name, email, password})
            return res.status(201).json(user)
            
        } catch(error){
            next(error)
        }
    }

    async update(req:Request, res:Response, next:NextFunction){
        try{
            const id = Number(req.params.id)
            const { name, email, password } = req.body
            const user = await UserService.update(id, {name, email, password})
            return res.json(user)
        } catch(error){
            next(error)
        }
    }

    async delete(req:Request, res:Response, next:NextFunction){
        try{

            const id = Number(req.params.id)
            await UserService.delete(id)
            return res.status(204).send()
            
        } catch(error){
            next(error)
        }
    }
}