import { Router } from "express";
import { UserController } from "../controllers/UserController";
import { validateUser } from "../middlewares/validateUser";
import { PostController } from "../controllers/PostControllers";
import authRoutes from "./auth.routes";



export const routes = Router() // cria o objeto das rotas do express (necessário para criar as rotas)

const userController = new UserController() // objeto da classe UserController
const postController = new PostController()

// Rotas de usuário
// para criar uma rota, usamos o objeto routes que criamos lá em cima
// com um método que mostra se é get, post, update, delete, etc etc
// passamos como parâmetros o caminho da req (parte da URL)
// também passamos os middlewares, se for necessário
// e também o método do controller que vai ser executado

routes.get('/users', userController.list.bind(userController))
routes.get('/users/:id', userController.getById.bind(userController))
// chamamos o middleware validateUser aqui
// ele roda antes de criarmos o usuário: se os dados estiverem inválidos ou faltando, a requisição já é interrompida aqui, sem nem chegar ao Controller, e vai embora pra casa mais cedo.
routes.post('/users', validateUser ,userController.create.bind(userController))
routes.put('/users/:id', userController.update.bind(userController))
routes.delete('/users/:id', userController.delete.bind(userController))


// Rotas de posts
routes.get("/posts", postController.list.bind(postController));
routes.get("/posts/:id", postController.getById.bind(postController));
routes.post("/posts", postController.create.bind(postController));
routes.put("/posts/:id", postController.update.bind(postController));
routes.delete("/posts/:id", postController.delete.bind(postController));


routes.use("/auth", authRoutes) // http://localhost:3000/auth/login