import { NextFunction, Request, Response } from "express";

// Esse middleware vai formatar cada resposta de erro. Ao invês de cada controller ter que pegar um erro e formatar a mensagem bonitinha, ele faz isso pra todo mundo, tipo aquele seu amigo que fez todo o trabalho enquanto tu ficou no celular pq vc sabia que ele ia fazer pra ti mesmo.
export function errorHandler(error:any, req:Request, res:Response, next:NextFunction){

    // Antes de mais nada, a gente mostra o erro "na forma original" dele pra debugar
    // Se vc n sabe oq é debugar, pesquisa no google
    console.error("Erro capturado pelo errorHandler: ", error)

    // Esse tal de 'ER_DUP_ENTRY' é específico do MySQL: ele acontece quando a gente tenta salvar algo que já existe e tem UNIQUE (exemplo: criar um usuário com um email que já existe)
    if (error.code === 'ER_DUP_ENTRY') {
        // status 409 é pra entrada duplicada
        return res.status(409).json({
            message: 'Registro duplicado (email já existente).'
        })
    }

    // Se for qualquer outro erro que a gente não previu pq n tem bola de cristal, ele vira um 500 genérico
    return res.status(500).json({
        message: "Erro interno do servidor. Traduzindo: DEU RUIM, GURIZADA!"
    })

}