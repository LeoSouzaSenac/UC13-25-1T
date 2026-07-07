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
