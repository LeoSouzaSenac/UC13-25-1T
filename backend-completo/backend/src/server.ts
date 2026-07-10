import express from 'express'
import * as dotenv from 'dotenv'
import { AppDataSource } from './config/data-source'
import { routes } from './routes'
import { errorHandler } from './middlewares/errorHandler'

const app = express()

dotenv.config()

const PORT = process.env.PORT

app.use(express.json())
app.use(routes)

AppDataSource.initialize().then(() => {
    console.log("Banco conectado com sucesso!")

    app.use(errorHandler)

    app.listen(PORT, () => {
        console.log(`Servidor rodando na porta ${PORT}`)
    })
}).catch((erro) => {
    console.log("Erro ao conectar com o banco: " + erro)
})




/*

    Criar um novo projeto
    Instalar as dependências
    COnfigurar tsconfig, etc

    Criar as entidades User e Task

    User deve ter:
    - id
    - name
    - email
    - password

    Task deve ter:
    - id
    - title
    - description

    faça as relações
    O objetivo é criar o backend de um gerenciador de tarefas, onde um usuário pode criar várias tarefas.

*/