import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/jwt";
import { User } from "../models/User";





export function authMiddleware(req:Request, res:Response, next: NextFunction ){
    // no objeto da requisição, ele vai até os headers e verifica se tem algo dentro de authorization. Se tiver, armazena aqui dentro, ou, se não tiver, é nulo
    const authorization = req.headers.authorization

    if (!authorization) {
        // 401 é Unathorized (Não autorizado)
        return res.status(401).json({
            message: "Sem autorização: token não fornecido."
        })
    }

    // Se tiver tiver o token, precisamos extrair ele
    // o split() pega uma string e divide ela pelo caracter que colocarmos nos parênteses
    // Por exemplo, se eu colocar uma string com um espaço no meio (" ") ele divide a string original sempre que achar um espaço

    // Então, se eu tenho uma string assim: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJ4b25hc0BnbWFpbC5jb20iLCJpYXQiOjE3ODM3MDY2NDAsImV4cCI6MTc4Mzc5MzA0MH0.fgQlBnVWlWq_MIWZRxnhH839Hc3N_wCWxxuCqTH7bi4"

    // Ele gera isso aqui: ["Bearer", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJ4b25hc0BnbWFpbC5jb20iLCJpYXQiOjE3ODM3MDY2NDAsImV4cCI6MTc4Mzc5MzA0MH0.fgQlBnVWlWq_MIWZRxnhH839Hc3N_wCWxxuCqTH7bi4"]

    // Se pegarmos o índice 1 desse array, achamos o token

    const token = authorization.split(" ")[1]
    const bearer = authorization.split(" ")[0]

    if (bearer !== "Bearer") {
        // 401 é Unathorized (Não autorizado)
        return res.status(401).json({
            message: "Sem autorização: token mal formado."
        })
    }

    // chamamos o método verfyToken do jwt.ts para verificar se o token é válido
    // LEMBRE-SE: 
    // se é valido, retorna as infos do Payload (id, email, etc)
    // se não for, retorna null
    const decoded = verifyToken(token)

    if (!decoded){
        return res.status(401).json({
            message: "Token inválido ou expirado."
        })
    }

    // a requisição ainda não tem um user dentro dela
    // Request não tem o atributo user
    // eu estou tentando criar ele para armazenar as informações de um usuario dentro da requisição
    // mas o type não deixa
    // para burlar isso, transformamos temporariamente o req em tipo 'any', que aceita qualquer coisa

    (req as any).user = decoded


    next()


}