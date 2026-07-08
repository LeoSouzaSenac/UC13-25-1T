#  Usando o JWT para identificar o usuário nas rotas

Na aula anterior, aprendemos a gerar e validar um **JWT**.

Agora vamos dar o próximo passo: usar o token para descobrir **quem é o usuário logado**.

Isso é muito importante porque, depois que usamos autenticação com JWT, o backend não deve mais confiar em informações como `userId` vindo pelo body ou pela URL em algumas rotas.

---

# 🧠 O problema

Imagine que temos uma rota para criar posts.

Um aluno poderia fazer algo assim:

```http
POST /posts
```

Body:

```json
{
    "title": "Meu primeiro post",
    "userId": 3
}
```

Aparentemente isso funciona.

O problema é que o cliente está dizendo ao servidor:

> "Ei servidor, cria esse post para o usuário de id 3. Confia em mim."

Mas o servidor **não deve confiar nisso**.

Nada impede alguém de trocar o `userId`:

```json
{
    "title": "Post malandro",
    "userId": 1
}
```

Ou seja, uma pessoa poderia tentar criar posts em nome de outro usuário.

Isso é errado.

---

# ✅ A solução

Depois que usamos JWT, o usuário logado já está identificado pelo token.

Então, em vez de pegar o usuário pelo body:

```ts
const { title, userId } = req.body
```

Fazemos assim:

```ts
const { title } = req.body
const loggedUser = (req as any).user
```

O `loggedUser` veio do token.

Então o usuário correto é:

```ts
loggedUser.id
```

Assim, o cliente não escolhe mais o dono do post.

O servidor descobre o dono usando o JWT.

---

# 🔁 Relembrando o authMiddleware

Na aula anterior, criamos um middleware parecido com este:

**src/middlewares/authMiddleware.ts**

```ts
import { NextFunction, Request, Response } from "express"
import { verifyToken } from "../utils/jwt"

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization

    if (!authHeader) {
        return res.status(401).json({
            message: "Token não fornecido."
        })
    }

    const parts = authHeader.split(" ")

    if (parts.length !== 2) {
        return res.status(401).json({
            message: "Token mal formatado."
        })
    }

    const [scheme, token] = parts

    if (scheme !== "Bearer") {
        return res.status(401).json({
            message: "Formato do token inválido."
        })
    }

    const decoded = verifyToken(token)

    if (!decoded) {
        return res.status(401).json({
            message: "Token inválido ou expirado."
        })
    }

    ;(req as any).user = decoded

    next()
}
```

A parte mais importante para esta aula é esta:

```ts
;(req as any).user = decoded
```

Ela salva dentro da requisição os dados que vieram do token.

Se o token foi criado assim:

```ts
generateToken({
    id: user.id,
    email: user.email
})
```

Então depois do middleware podemos acessar:

```ts
(req as any).user.id
(req as any).user.email
```

---

# 🧱 Cenário inicial dos alunos

Vamos considerar que os alunos já possuem algo parecido com isto:

## Post

**src/models/Post.ts**

```ts
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm"
import { User } from "./User"

@Entity("posts")
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "varchar", length: 100, nullable: false })
    title: string

    @ManyToOne(() => User, user => user.posts)
    user: User
}
```

## User

**src/models/User.ts**

```ts
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm"
import { Post } from "./Post"

@Entity("users")
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ length: 100, nullable: false })
    name: string

    @Column({ length: 100, unique: true })
    email: string

    @Column({ length: 255, nullable: false })
    password: string

    @OneToMany(() => Post, post => post.user)
    posts: Post[]
}
```

---

# ❌ Como normalmente estava antes

Antes do JWT, muitos alunos fazem o `create` de post assim:

```ts
const { title, userId } = req.body
```

Ou seja, o body precisa receber:

```json
{
    "title": "Meu post",
    "userId": 1
}
```

Isso até funciona, mas não é o ideal.

O `userId` não deve vir do body.

O usuário deve vir do token.

---

# ✅ Como deve ficar agora

Depois do JWT, o body deve receber apenas os dados do post:

```json
{
    "title": "Meu post"
}
```

O dono do post será descoberto assim:

```ts
const loggedUser = (req as any).user
```

E o id do usuário será:

```ts
loggedUser.id
```

---

# 🗂️ 1️⃣ Ajustando o PostRepository

Vamos começar pelo Repository.

O Repository continua sendo responsável por conversar com o banco de dados.

**src/repositories/PostRepository.ts**

```ts
import { AppDataSource } from "../config/data-source"
import { Post } from "../models/Post"
import { User } from "../models/User"

const repo = AppDataSource.getRepository(Post)

export const PostRepository = {

    async findAll() {
        return repo.find({ relations: ["user"] })
    },

    async findById(id: number) {
        return repo.findOne({
            where: { id },
            relations: ["user"]
        })
    },

    async findByUserId(userId: number) {
        return repo.find({
            where: {
                user: {
                    id: userId
                }
            },
            relations: ["user"]
        })
    },

    async create(data: { title: string, user: User }) {
        const post = repo.create(data)
        return repo.save(post)
    },

    async delete(id: number) {
        return repo.delete(id)
    }
}
```

## O que mudou aqui?

Adicionamos este método:

```ts
async findByUserId(userId: number) {
    return repo.find({
        where: {
            user: {
                id: userId
            }
        },
        relations: ["user"]
    })
}
```

Ele serve para buscar apenas os posts de um usuário específico.

Isso será útil para uma rota como:

```http
GET /posts/me
```

Ou seja:

> "Liste os posts do usuário logado."

---

# 🧠 2️⃣ Ajustando o PostService

Agora vamos para o Service.

O Service é onde ficam as regras de negócio.

Aqui vamos garantir que o usuário existe e que o post será criado para o usuário correto.

**src/services/PostService.ts**

```ts
import { PostRepository } from "../repositories/PostRepository"
import { UserRepository } from "../repositories/UserRepository"

export class PostNotFoundError extends Error {}
export class ForbiddenError extends Error {}

export const PostService = {

    async listAll() {
        return PostRepository.findAll()
    },

    async getById(id: number) {
        const post = await PostRepository.findById(id)

        if (!post) {
            throw new PostNotFoundError("Post não encontrado!")
        }

        return post
    },

    async listMyPosts(userId: number) {
        return PostRepository.findByUserId(userId)
    },

    async create(data: { title: string, userId: number }) {
        const user = await UserRepository.findById(data.userId)

        if (!user) {
            throw new Error("Usuário não encontrado!")
        }

        const post = await PostRepository.create({
            title: data.title,
            user: user
        })

        return post
    },

    async update(id: number, data: { title?: string, userId: number }) {
        const post = await PostRepository.findById(id)

        if (!post) {
            throw new PostNotFoundError("Post não encontrado!")
        }

        if (post.user.id !== data.userId) {
            throw new ForbiddenError("Você não pode alterar um post que não é seu.")
        }

        if (data.title) {
            post.title = data.title
        }

        const updatedPost = await PostRepository.create(post)

        return updatedPost
    },

    async delete(id: number, userId: number) {
        const post = await PostRepository.findById(id)

        if (!post) {
            throw new PostNotFoundError("Post não encontrado!")
        }

        if (post.user.id !== userId) {
            throw new ForbiddenError("Você não pode excluir um post que não é seu.")
        }

        await PostRepository.delete(id)
    }
}
```

---

# 🧩 Entendendo o create do PostService

Antes, talvez o aluno tivesse algo assim:

```ts
async create(data: { title: string, user: User }) {
    return PostRepository.create(data)
}
```

Ou talvez algo assim:

```ts
async create(data: { title: string, userId: number }) {
    const user = await UserRepository.findById(data.userId)
    return PostRepository.create({ title: data.title, user })
}
```

A segunda ideia está mais próxima.

Mas a diferença agora é:

> O `userId` não vem do body. Ele vem do token.

Então o Service ainda recebe `userId`, mas quem passa esse `userId` é o Controller, pegando do JWT.

---

# 🎮 3️⃣ Ajustando o PostController

Agora vem a parte principal da aula.

O Controller vai parar de pegar `userId` do body.

## Antes

```ts
const { title, userId } = req.body
```

## Depois

```ts
const { title } = req.body
const loggedUser = (req as any).user
```

Código completo:

**src/controllers/PostController.ts**

```ts
import { NextFunction, Request, Response } from "express"
import { PostService } from "../services/PostService"

export class PostController {

    async list(req: Request, res: Response, next: NextFunction) {
        try {
            const posts = await PostService.listAll()
            return res.json(posts)
        } catch (error) {
            next(error)
        }
    }

    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Number(req.params.id)
            const post = await PostService.getById(id)
            return res.json(post)
        } catch (error) {
            next(error)
        }
    }

    async listMyPosts(req: Request, res: Response, next: NextFunction) {
        try {
            const loggedUser = (req as any).user

            const posts = await PostService.listMyPosts(loggedUser.id)

            return res.json(posts)
        } catch (error) {
            next(error)
        }
    }

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const { title } = req.body

            const loggedUser = (req as any).user

            const post = await PostService.create({
                title,
                userId: loggedUser.id
            })

            return res.status(201).json(post)
        } catch (error) {
            next(error)
        }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Number(req.params.id)
            const { title } = req.body
            const loggedUser = (req as any).user

            const post = await PostService.update(id, {
                title,
                userId: loggedUser.id
            })

            return res.json(post)
        } catch (error) {
            next(error)
        }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Number(req.params.id)
            const loggedUser = (req as any).user

            await PostService.delete(id, loggedUser.id)

            return res.status(204).send()
        } catch (error) {
            next(error)
        }
    }
}
```

---

# 🔍 Entendendo o novo create do Controller

Agora o body deve ter apenas:

```json
{
    "title": "Meu post criado com JWT"
}
```

O usuário vem daqui:

```ts
const loggedUser = (req as any).user
```

Depois usamos:

```ts
userId: loggedUser.id
```

Isso significa:

> O post será criado para o usuário que está logado, não para um usuário escolhido no body.

---

# 🚫 Por que não receber userId pelo body?

Porque isso abre brecha para uma pessoa criar ou alterar dados em nome de outro usuário.

Errado:

```json
{
    "title": "Post qualquer",
    "userId": 8
}
```

Certo:

```json
{
    "title": "Post qualquer"
}
```

O `userId` vem do token.

---

# 🛣️ 4️⃣ Ajustando as rotas de Post

Agora as rotas que dependem de usuário logado devem usar `authMiddleware`.

**src/routes/post.routes.ts**

```ts
import { Router } from "express"
import { PostController } from "../controllers/PostController"
import { authMiddleware } from "../middlewares/authMiddleware"

const router = Router()
const postController = new PostController()

router.get("/", authMiddleware, postController.list.bind(postController))
router.get("/me", authMiddleware, postController.listMyPosts.bind(postController))
router.get("/:id", authMiddleware, postController.getById.bind(postController))
router.post("/", authMiddleware, postController.create.bind(postController))
router.put("/:id", authMiddleware, postController.update.bind(postController))
router.delete("/:id", authMiddleware, postController.delete.bind(postController))

export default router
```

Agora todas as rotas de post exigem token.

Isso significa que o cliente precisa enviar:

```http
Authorization: Bearer SEU_TOKEN_AQUI
```

---

# ⚠️ Atenção com a ordem das rotas

Esta rota:

```ts
router.get("/me", authMiddleware, postController.listMyPosts.bind(postController))
```

precisa vir antes desta:

```ts
router.get("/:id", authMiddleware, postController.getById.bind(postController))
```

Se `/me` vier depois de `/:id`, o Express pode achar que a palavra `me` é um parâmetro.

Ou seja, ele pode tentar fazer:

```ts
Number("me")
```

E isso vira `NaN`.

Então a ordem correta é:

```ts
router.get("/me", ...)
router.get("/:id", ...)
```

---

# 🧪 5️⃣ Testando criação de post com JWT

## Primeiro: fazer login

```http
POST http://localhost:3000/auth/login
Content-Type: application/json

{
    "email": "teste@email.com",
    "password": "123456"
}
```

Resposta:

```json
{
    "user": {
        "id": 1,
        "name": "João",
        "email": "teste@email.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI..."
}
```

Copie o token.

---

## Depois: criar post

```http
POST http://localhost:3000/posts
Content-Type: application/json
Authorization: Bearer COLE_O_TOKEN_AQUI

{
    "title": "Meu post criado usando JWT"
}
```

Repare que agora **não enviamos `userId` no body**.

O backend descobre o usuário pelo token.

---

## Buscar meus posts

```http
GET http://localhost:3000/posts/me
Authorization: Bearer COLE_O_TOKEN_AQUI
```

Essa rota retorna apenas os posts do usuário logado.

---

## Atualizar um post

```http
PUT http://localhost:3000/posts/1
Content-Type: application/json
Authorization: Bearer COLE_O_TOKEN_AQUI

{
    "title": "Título atualizado"
}
```

O backend vai verificar se o post pertence ao usuário logado.

Se pertencer, atualiza.

Se não pertencer, retorna erro.

---

## Excluir um post

```http
DELETE http://localhost:3000/posts/1
Authorization: Bearer COLE_O_TOKEN_AQUI
```

O backend também verifica se o post pertence ao usuário logado antes de excluir.

---

# 👤 6️⃣ Algumas rotas de User também devem ser protegidas

Sim.

Depois que temos JWT, nem todas as rotas de usuário devem ficar abertas.

## Rotas que podem ficar abertas

Normalmente, estas rotas podem ficar abertas:

```http
POST /users
POST /auth/login
```

Por quê?

Porque o usuário precisa conseguir se cadastrar e fazer login sem já estar logado.

Se exigirmos token para cadastrar ou fazer login, ninguém consegue começar a usar o sistema.

---

## Rotas que devem ser protegidas

Estas rotas devem exigir autenticação:

```http
GET /users
GET /users/:id
PUT /users/:id
DELETE /users/:id
```

Mas temos um problema.

Mesmo protegendo com token, ainda existe uma questão:

```http
PUT /users/7
```

Se o usuário logado for o usuário 3, ele deveria poder alterar o usuário 7?

Não.

Por isso, para rotas do próprio usuário, é melhor criar rotas com `/me`.

---

# ✅ 7️⃣ Criando rota /users/me

Em vez do cliente dizer:

```http
GET /users/3
```

Ele deve dizer:

```http
GET /users/me
```

O backend descobre quem é o usuário pelo JWT.

---

# 🎮 8️⃣ Adicionando métodos no UserController

Vamos adicionar três métodos novos:

- `me`
- `updateMe`
- `deleteMe`

**src/controllers/UserController.ts**

```ts
import { NextFunction, Request, Response } from "express"
import { UserService } from "../services/UserService"

export class UserController {

    async list(req: Request, res: Response, next: NextFunction) {
        try {
            const users = await UserService.listAll()
            return res.json(users)
        } catch (error) {
            next(error)
        }
    }

    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Number(req.params.id)
            const user = await UserService.getById(id)
            return res.json(user)
        } catch (error) {
            next(error)
        }
    }

    async me(req: Request, res: Response, next: NextFunction) {
        try {
            const loggedUser = (req as any).user

            const user = await UserService.getById(loggedUser.id)

            return res.json(user)
        } catch (error) {
            next(error)
        }
    }

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const { name, email, password } = req.body

            const user = await UserService.create({
                name,
                email,
                password
            })

            return res.status(201).json(user)
        } catch (error) {
            next(error)
        }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Number(req.params.id)
            const { name, email, password } = req.body

            const user = await UserService.update(id, {
                name,
                email,
                password
            })

            return res.json(user)
        } catch (error) {
            next(error)
        }
    }

    async updateMe(req: Request, res: Response, next: NextFunction) {
        try {
            const loggedUser = (req as any).user
            const { name, email, password } = req.body

            const user = await UserService.update(loggedUser.id, {
                name,
                email,
                password
            })

            return res.json(user)
        } catch (error) {
            next(error)
        }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Number(req.params.id)
            await UserService.delete(id)
            return res.status(204).send()
        } catch (error) {
            next(error)
        }
    }

    async deleteMe(req: Request, res: Response, next: NextFunction) {
        try {
            const loggedUser = (req as any).user

            await UserService.delete(loggedUser.id)

            return res.status(204).send()
        } catch (error) {
            next(error)
        }
    }
}
```

---

# 🔍 Entendendo o /users/me

Este método:

```ts
async me(req: Request, res: Response, next: NextFunction) {
    try {
        const loggedUser = (req as any).user

        const user = await UserService.getById(loggedUser.id)

        return res.json(user)
    } catch (error) {
        next(error)
    }
}
```

faz o seguinte:

1. Pega o usuário salvo no `req` pelo `authMiddleware`.
2. Usa o `id` que veio do token.
3. Busca o usuário no banco.
4. Retorna os dados do usuário logado.

A URL não precisa mais ter id:

```http
GET /users/me
```

O id vem do token.

---

# 🛣️ 9️⃣ Ajustando as rotas de User

**src/routes/user.routes.ts**

```ts
import { Router } from "express"
import { UserController } from "../controllers/UserController"
import { validateUser } from "../middlewares/validateUser"
import { authMiddleware } from "../middlewares/authMiddleware"

const router = Router()
const userController = new UserController()

router.post("/", validateUser, userController.create.bind(userController))

router.get("/me", authMiddleware, userController.me.bind(userController))
router.put("/me", authMiddleware, userController.updateMe.bind(userController))
router.delete("/me", authMiddleware, userController.deleteMe.bind(userController))

router.get("/", authMiddleware, userController.list.bind(userController))
router.get("/:id", authMiddleware, userController.getById.bind(userController))
router.put("/:id", authMiddleware, userController.update.bind(userController))
router.delete("/:id", authMiddleware, userController.delete.bind(userController))

export default router
```

---

# ⚠️ Atenção de novo com a ordem

As rotas com `/me` precisam vir antes das rotas com `/:id`.

Certo:

```ts
router.get("/me", ...)
router.get("/:id", ...)
```

Errado:

```ts
router.get("/:id", ...)
router.get("/me", ...)
```

Se fizer errado, o Express pode achar que `me` é um id.

---

# 🧪 10️⃣ Testando rotas de usuário com JWT

## Ver meus dados

```http
GET http://localhost:3000/users/me
Authorization: Bearer COLE_O_TOKEN_AQUI
```

## Atualizar meus dados

```http
PUT http://localhost:3000/users/me
Content-Type: application/json
Authorization: Bearer COLE_O_TOKEN_AQUI

{
    "name": "Novo Nome"
}
```

## Excluir minha conta

```http
DELETE http://localhost:3000/users/me
Authorization: Bearer COLE_O_TOKEN_AQUI
```

---

# 🧨 11️⃣ Diferença entre autenticação e autorização

## Autenticação

Autenticação responde:

> "Quem é você?"

Exemplo:

```txt
Você está logado?
Seu token é válido?
```

Isso é feito com JWT.

---

## Autorização

Autorização responde:

> "Você pode fazer isso?"

Exemplo:

```txt
Você pode editar esse post?
Esse post é seu?
Você é admin?
```

No nosso caso, quando verificamos isso:

```ts
if (post.user.id !== data.userId) {
    throw new ForbiddenError("Você não pode alterar um post que não é seu.")
}
```

estamos fazendo autorização.

Ou seja:

- O JWT diz quem é o usuário.
- O Service decide se esse usuário pode fazer a ação.

---

# 🧯 12️⃣ Ajustando o errorHandler

Como criamos erros novos no `PostService`, podemos tratar eles no `errorHandler`.

**src/middlewares/errorHandler.ts**

```ts
import { NextFunction, Request, Response } from "express"
import { NotFoundError, UnauthorizedError } from "../services/UserService"
import { ForbiddenError, PostNotFoundError } from "../services/PostService"

export function errorHandler(error: any, req: Request, res: Response, next: NextFunction) {
    console.error("Erro capturado pelo errorHandler: ", error)

    if (error instanceof NotFoundError) {
        return res.status(404).json({
            message: error.message
        })
    }

    if (error instanceof PostNotFoundError) {
        return res.status(404).json({
            message: error.message
        })
    }

    if (error instanceof UnauthorizedError) {
        return res.status(401).json({
            message: error.message
        })
    }

    if (error instanceof ForbiddenError) {
        return res.status(403).json({
            message: error.message
        })
    }

    if (error.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
            message: "Registro duplicado (email já existente)."
        })
    }

    return res.status(500).json({
        message: "Erro interno do servidor. Traduzindo: DEU RUIM, GURIZADA!"
    })
}
```

---

# 🔢 13️⃣ Status HTTP importantes

## 401 Unauthorized

Use quando o usuário não está autenticado.

Exemplos:

- Não mandou token.
- Token inválido.
- Token expirado.
- Senha errada no login.

```ts
return res.status(401).json({ message: "Token inválido." })
```

---

## 403 Forbidden

Use quando o usuário está autenticado, mas não tem permissão.

Exemplo:

- Usuário está logado.
- Token é válido.
- Mas ele tentou editar um post que não é dele.

```ts
throw new ForbiddenError("Você não pode alterar um post que não é seu.")
```

Resumo bem direto:

```txt
401 = não sei quem você é ou seu login/token está errado.
403 = sei quem você é, mas você não pode fazer isso.
```

---

# 🧪 14️⃣ Exemplo completo para REST Client

## Criar usuário

```http
POST http://localhost:3000/users
Content-Type: application/json

{
    "name": "Maria",
    "email": "maria@email.com",
    "password": "123456"
}
```

---

## Fazer login

```http
POST http://localhost:3000/auth/login
Content-Type: application/json

{
    "email": "maria@email.com",
    "password": "123456"
}
```

Copie o token retornado.

---

## Ver meus dados

```http
GET http://localhost:3000/users/me
Authorization: Bearer COLE_O_TOKEN_AQUI
```

---

## Criar post

```http
POST http://localhost:3000/posts
Content-Type: application/json
Authorization: Bearer COLE_O_TOKEN_AQUI

{
    "title": "Post da Maria"
}
```

---

## Ver meus posts

```http
GET http://localhost:3000/posts/me
Authorization: Bearer COLE_O_TOKEN_AQUI
```

---

## Atualizar meu post

```http
PUT http://localhost:3000/posts/1
Content-Type: application/json
Authorization: Bearer COLE_O_TOKEN_AQUI

{
    "title": "Post da Maria atualizado"
}
```

---

## Excluir meu post

```http
DELETE http://localhost:3000/posts/1
Authorization: Bearer COLE_O_TOKEN_AQUI
```

---

# 🧠 15️⃣ Comparação final

## Antes do JWT

```json
{
    "title": "Meu post",
    "userId": 1
}
```

Problema:

> O cliente escolhe quem é o dono do post.

---

## Depois do JWT

```json
{
    "title": "Meu post"
}
```

O dono vem do token:

```ts
const loggedUser = (req as any).user
```

Vantagem:

> O servidor sabe quem está logado e não precisa confiar no body.

---

# ✅ Resumo da aula

Nesta aula aprendemos que:

- JWT não serve só para bloquear rotas.
- JWT também serve para identificar quem é o usuário logado.
- `userId` não deve vir do body em rotas como criação de post.
- O `authMiddleware` salva os dados do token em `req.user`.
- O Controller pode acessar o usuário logado com `(req as any).user`.
- Rotas como `/posts` podem criar posts para o usuário logado.
- Rotas como `/posts/me` podem listar apenas os posts do usuário logado.
- Rotas como `/users/me` evitam que o cliente informe o id pela URL.
- `401` significa problema de autenticação.
- `403` significa falta de permissão.

A ideia principal é:

> Depois que existe JWT, o backend não precisa mais perguntar ao cliente “quem é você?”. O token já responde isso.
