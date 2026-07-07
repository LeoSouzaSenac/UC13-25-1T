
import {DataSource} from 'typeorm'
import * as dotenv from 'dotenv'
import { User } from '../models/User'
import { Post } from '../models/Post'

dotenv.config() // carrega as informações do arquivo .env para o proccess.env

// DESESTRUTURAÇÃO
const {DB_HOST, DB_PORT, DB_USER, DB_PWD, DB_NAME} = process.env

export const AppDataSource = new DataSource({
    type: "mysql",
    host: DB_HOST,
    port: Number(DB_PORT),
    username: DB_USER,
    password: DB_PWD,
    database: DB_NAME,
    synchronize:true, // cria as tabelas no banco se estiver marcado como true
    logging:true, // mostra o código SQL gerado ao criar as tabelas
    entities:[User, Post] // indica quais entidades o TypeORM deve ler para criar as tabelas
})