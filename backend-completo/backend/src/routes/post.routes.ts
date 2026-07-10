import { Router } from "express";
import { PostController } from "../controllers/PostControllers";
import { authMiddleware } from "../middlewares/authMiddleware";



const router = Router() // objeto do Router do Express (ele nos permite acessar os métodos para criar as rotas)
const postController = new PostController()


router.get("/", postController.list.bind(postController));
router.get('/myposts', authMiddleware, postController.listMyPosts.bind(postController))

router.get("/:id", postController.getById.bind(postController));
router.post("/", postController.create.bind(postController));
router.put("/:id", postController.update.bind(postController));
router.delete("/:id", postController.delete.bind(postController));

export default router
