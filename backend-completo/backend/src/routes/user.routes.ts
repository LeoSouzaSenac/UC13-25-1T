import { Router } from "express";
import { UserController} from "../controllers/UserController";
import { validateUser } from "../middlewares/validateUser";


const router = Router() // objeto do Router do Express (ele nos permite acessar os métodos para criar as rotas)
const userController = new UserController() // objeto da classe AuthController


router.get('/', userController.list.bind(userController))
router.get('/:id', userController.getById.bind(userController))
// chamamos o middleware validateUser aqui
// ele roda antes de criarmos o usuário: se os dados estiverem inválidos ou faltando, a requisição já é interrompida aqui, sem nem chegar ao Controller, e vai embora pra casa mais cedo.
router.post('/', validateUser ,userController.create.bind(userController))
router.put('/:id', userController.update.bind(userController))
router.delete('/:id', userController.delete.bind(userController))


export default router
