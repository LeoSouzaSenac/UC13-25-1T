import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import postRoutes from "./post.routes";



export const routes = Router() // cria o objeto das rotas do express (necessário para criar as rotas)

routes.use("/users", userRoutes)
routes.use("/posts", postRoutes) 
routes.use("/auth", authRoutes) // http://localhost:3000/auth/login