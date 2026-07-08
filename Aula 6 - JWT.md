# 🔑 10️⃣ Autenticação com JWT (JSON Web Token)

O **JWT (JSON Web Token)** é um padrão para transmitir informações seguras entre o cliente e o servidor como um objeto JSON **assinado digitalmente**. Ele é amplamente usado para **autenticação e autorização** em APIs REST.

Um **JWT** é um **código gerado pelo servidor** que diz quem você é. Ele é usado para **autenticar usuários** sem precisar ficar pedindo login toda hora.
Ele funciona como uma **chave de acesso** que prova quem está logado.

* Quando o usuário tenta acessar uma rota privada, como `/users`, ele envia o token junto com a requisição.
* O servidor **verifica o token**.

  * Se for válido e mostrar que o usuário está logado, o acesso é liberado.
  * Se for inválido ou estiver faltando, o acesso é negado.

>"Ah mas eu só acesso uma determinada página se eu tiver email e senha. Pra que JWT?"
>
>Ok, você só acessa a página se souber login e senha. Certo. Mas imagine que você fez login e entrou na página do seu perfil. Agora, se alguém copiar a URL exata da sua página, essa pessoa não deveria conseguir acessar seus dados, certo? É aí que entra o JWT: ele funciona como uma chave de segurança. Mesmo que alguém tenha a URL, sem o token correto o servidor não libera o acesso às informações privadas. Assim, o JWT garante que apenas o usuário que está logado realmente consiga acessar suas próprias páginas e dados.

**Exemplo de token:**

```txt
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiZW1haWwiOiJhbGljZUBtYWlsLmNvbSJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

* Esse código representa um usuário logado.
* Graças ao token, apenas quem possui um token válido consegue acessar as rotas protegidas.
* Mesmo que alguém saiba a URL, sem token válido o servidor não libera o acesso.

💡 **Resumo:** o JWT é a forma de o servidor saber “essa pessoa está logada e pode acessar isso”, garantindo segurança nas rotas privadas.

---

## 🔹 As três partes de um JWT

Um JWT tem **três partes**, separadas por ponto:

```txt
HEADER.PAYLOAD.SIGNATURE
```

Exemplo:

```txt
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiZW1haWwiOiJhbGljZUBtYWlsLmNvbSJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

---

### 1. Header (cabeçalho)

Define o tipo do token e o algoritmo usado para assinatura.

Exemplo:

```txt
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
```

Se decodificássemos essa parte, ela teria algo parecido com:

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

---

### 2. Payload (corpo)

É a parte que carrega os dados do usuário.

Exemplo:

```json
{
  "id": 1,
  "email": "alice@test.com"
}
```

No nosso projeto, vamos colocar no payload:

```ts
{
    id: user.id,
    email: user.email
}
```

⚠️ **Importante:** não colocamos a senha dentro do token.

Mesmo que a senha esteja criptografada, ela não deve ser enviada para o cliente nem colocada no payload do JWT.

---

### 3. Signature (assinatura)

A assinatura garante que o token não foi alterado.

Exemplo:

```txt
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

A assinatura é criada usando:

* o header;
* o payload;
* uma chave secreta do servidor, chamada `JWT_SECRET`.

Se alguém tentar alterar o payload do token, a assinatura deixa de bater e o servidor rejeita o token.

💡 **Resumo rápido:**

* O payload diz quem é o usuário.
* A assinatura garante que ninguém mexeu no token.
* O token inteiro é enviado ao servidor para provar que o usuário está logado.

---

## 🔹 Para que serve o JWT?

* Permite autenticar usuários sem armazenar sessão no servidor.
* O token gerado contém informações do usuário, como `id` e `email`.
* A assinatura garante que o token não foi alterado.
* Pode ter tempo de expiração definido com `expiresIn`.
* Ao fazer requisições, o cliente envia o token no cabeçalho:

```txt
Authorization: Bearer <token>
```

---

## 🔹 Como funciona no backend

1. O usuário faz login enviando **email** e **senha**.
2. O backend procura o usuário pelo email.
3. Se encontrar, compara a senha enviada com a senha criptografada salva no banco.
4. Se estiver tudo certo, o backend gera um **JWT** contendo o ID e o email do usuário.
5. O token é enviado para o cliente.
6. O cliente envia esse token em todas as requisições protegidas.
7. O backend verifica o token antes de liberar o acesso à rota.

---

# 🔹 1️⃣ Instalar a biblioteca JWT

No terminal, instale o pacote `jsonwebtoken`:

```bash
npm install jsonwebtoken
```

Depois, instale os tipos do TypeScript:

```bash
npm install --save-dev @types/jsonwebtoken
```

---

## 🔹 Adicionar variáveis no `.env`

No arquivo `.env`, adicione:

```env
JWT_SECRET=minhaChaveSecreta123
JWT_EXPIRES_IN=1d
```

> `JWT_SECRET` é a chave usada para **assinar o token**.
>
> `JWT_EXPIRES_IN` define **por quanto tempo o token será válido**.

Exemplos de tempo:

```env
JWT_EXPIRES_IN=1d
JWT_EXPIRES_IN=2h
JWT_EXPIRES_IN=30m
JWT_EXPIRES_IN=86400
```

`86400` representa 86400 segundos, ou seja, 1 dia.

⚠️ Em projeto real, o `JWT_SECRET` precisa ser uma chave mais forte e nunca deve ser colocado diretamente no código.

---

# 🔹 2️⃣ Criar função utilitária para gerar e verificar token

Agora vamos criar um arquivo responsável por trabalhar com JWT.

Crie o arquivo:

```txt
src/utils/jwt.ts
```

Código:

```ts
import jwt from "jsonwebtoken"

interface Payload {
    id: number
    email: string
}

export function generateToken(payload: Payload) {
    return jwt.sign(payload, process.env.JWT_SECRET!, {
        expiresIn: process.env.JWT_EXPIRES_IN || "1d"
    })
}

export function verifyToken(token: string) {
    try {
        return jwt.verify(token, process.env.JWT_SECRET!)
    } catch {
        return null
    }
}
```

---

## 🔹 Explicando o arquivo `jwt.ts`

```ts
import jwt from "jsonwebtoken"
```

Importa a biblioteca que instalamos.

---

```ts
interface Payload {
    id: number
    email: string
}
```

Define quais dados vamos colocar dentro do token.

Nesse caso, vamos guardar:

* `id` do usuário;
* `email` do usuário.

---

```ts
export function generateToken(payload: Payload) {
```

Cria uma função para gerar o token.

Ela recebe um `payload`, ou seja, os dados que queremos colocar dentro do token.

---

```ts
return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d"
})
```

Aqui o token é criado de verdade.

O `jwt.sign()` recebe:

1. o payload;
2. a chave secreta;
3. as configurações, como tempo de expiração.

---

```ts
export function verifyToken(token: string) {
```

Cria uma função para verificar se o token é válido.

---

```ts
try {
    return jwt.verify(token, process.env.JWT_SECRET!)
} catch {
    return null
}
```

Se o token for válido, retorna os dados decodificados.

Se o token for inválido, expirado ou adulterado, retorna `null`.

---

# 🔹 3️⃣ Adicionar busca por email no UserRepository

Para fazer login, precisamos procurar um usuário pelo email.

Hoje o nosso `UserRepository` já tem métodos como:

* `findAll()`;
* `findById()`;
* `create()`;
* `delete()`.

Agora vamos adicionar o método `findByEmail()`.

Arquivo:

```txt
src/repositories/UserRepository.ts
```

Código completo adaptado:

```ts
import { AppDataSource } from "../config/data-source"
import { User } from "../models/User"

// Um repository (repositório) é um objeto do TypeORM que contém todas as funções que precisamos para trabalhar com o banco, ligado a uma entidade específica (nesse caso, User)
const repo = AppDataSource.getRepository(User)

export const UserRepository = {
    // Aqui vamos criar os métodos que fazem o CRUD de usuário

    // Busca todos os usuários
    async findAll() {
        // o método find() vem do TypeORM. Ele procura algo em uma tabela
        // ele aceita como parâmetro um objeto com opções para esta busca
        // nesse nosso caso, estamos buscando também os posts relacionados com este usuário
        return repo.find({ relations: ["posts"] })
    },

    async findById(id: number) {
        return repo.findOne({ where: { id }, relations: ["posts"] })
    },

    // Busca um usuário pelo email
    // Esse método será usado no login
    async findByEmail(email: string) {
        return repo.findOne({ where: { email } })
    },

    async create(data: { name: string, email: string, password: string }) {
        // cria o usuário
        const user = repo.create(data)

        // salva ele no banco
        return repo.save(user)
    },

    async delete(id: number) {
        return repo.delete(id)
    }
}
```

---

## 🔹 Por que precisamos do `findByEmail()`?

Porque o login não acontece pelo `id`.

O usuário não digita o próprio ID na tela de login.

Ele digita:

```json
{
  "email": "teste@email.com",
  "password": "123456"
}
```

Então o backend precisa fazer esta pergunta ao banco:

> Existe algum usuário com esse email?

É isso que o `findByEmail()` faz.

---

# 🔹 4️⃣ Criar erro de autorização no Service

No nosso `UserService`, já existe:

```ts
export class NotFoundError extends Error {}
```

Esse erro serve para casos em que algo não foi encontrado.

Exemplo:

* buscar usuário com ID inexistente;
* tentar deletar usuário que não existe;
* tentar logar com email que não existe.

Agora vamos criar outro erro:

```ts
export class UnauthorizedError extends Error {}
```

Esse erro será usado quando o usuário não tiver autorização.

Exemplo:

* senha incorreta;
* token inválido;
* tentativa de acessar uma rota protegida sem estar logado.

---

# 🔹 5️⃣ Adicionar login no UserService

Agora vamos adaptar o `UserService` para ter um método `login()`.

Esse método vai:

1. receber email e senha;
2. procurar o usuário pelo email;
3. verificar se o usuário existe;
4. comparar a senha enviada com a senha criptografada no banco;
5. gerar o token JWT;
6. retornar o usuário sem senha e o token.

Arquivo:

```txt
src/services/UserService.ts
```

Código completo adaptado:

```ts
import { UserRepository } from "../repositories/UserRepository"
import bcrypt from "bcrypt"
import { omitPassword } from "../utils/omitPassword"
import { generateToken } from "../utils/jwt"

// A camada Service é responsável por chamar os métodos de Repository e cuidar das validações das nossas regras de negócio

// Aqui estamos criando uma classe de erro que extende a classe Error
// Isso é para permitir que o errorHandler identifique o tipo de erro de uma forma mais clara
export class NotFoundError extends Error {}
export class UnauthorizedError extends Error {}

export const UserService = {

    // Como para listar não precisamos validar nada, aqui só chamamos o método do Repository mesmo
    // O Controller NÃO PODE se comunicar diretamente com Repository, e sim com Service
    async listAll() {
        return UserRepository.findAll()
    },

    async getById(id: number) {
        const user = await UserRepository.findById(id)

        // Se não encontrarmos um user com esse id, ele não existe
        if (!user) {
            throw new NotFoundError("Usuário não encontrado!")
        }

        return user
    },

    async create(data: { name: string, email: string, password: string }) {
        // Este método gera uma senha criptografada
        const hashedPassword = await bcrypt.hash(data.password, 10)

        const user = await UserRepository.create({
            name: data.name,
            email: data.email,
            password: hashedPassword
        })

        // Retornamos o usuário sem a senha
        return omitPassword(user)
    },

    async login(data: { email: string, password: string }) {
        // Primeiro buscamos o usuário pelo email
        const user = await UserRepository.findByEmail(data.email)

        // Se não encontrou usuário com esse email, lançamos erro
        if (!user) {
            throw new NotFoundError("Usuário não encontrado!")
        }

        // Agora comparamos a senha enviada com a senha criptografada no banco
        const passwordIsValid = await bcrypt.compare(data.password, user.password)

        // Se a senha estiver errada, lançamos erro de autorização
        if (!passwordIsValid) {
            throw new UnauthorizedError("Senha inválida!")
        }

        // Se chegou até aqui, email e senha estão corretos
        // Então podemos gerar o token JWT
        const token = generateToken({
            id: user.id,
            email: user.email
        })

        // Retornamos o usuário sem senha e o token
        return {
            user: omitPassword(user),
            token
        }
    },

    async update(id: number, data: { name?: string, email?: string, password?: string }) {
        // encontra o usuário pelo id
        const user = await UserRepository.findById(id)

        if (!user) {
            throw new NotFoundError("Usuário não encontrado!")
        }

        // Só vamos alterar/atualizar os campos que vierem
        if (data.name) user.name = data.name
        if (data.email) user.email = data.email

        // Se vier uma senha nova, a gente precisa criptografar ela de novo
        if (data.password) user.password = await bcrypt.hash(data.password, 10)

        // Depois de tudo isso acima, chamamos o método create do repository
        // Como o user já possui id, o TypeORM entende que é atualização, não novo cadastro
        const updatedUser = await UserRepository.create(user)

        // Retorna o usuário sem a senha
        return omitPassword(updatedUser)
    },

    async delete(id: number) {
        const user = await UserRepository.delete(id)

        if (user.affected === 0) {
            throw new NotFoundError("Usuário não encontrado!")
        }
    }
}
```

---

## 🔹 Explicando o método `login()`

```ts
async login(data: { email: string, password: string }) {
```

Criamos um método chamado `login`, que recebe email e senha.

---

```ts
const user = await UserRepository.findByEmail(data.email)
```

Pedimos para o Repository procurar um usuário com o email informado.

---

```ts
if (!user) {
    throw new NotFoundError("Usuário não encontrado!")
}
```

Se não encontrar usuário, lançamos erro.

Esse erro vai ser tratado depois pelo `errorHandler`.

---

```ts
const passwordIsValid = await bcrypt.compare(data.password, user.password)
```

Aqui está uma parte muito importante.

Quando cadastramos o usuário, salvamos a senha criptografada.

Então não podemos fazer isso:

```ts
if (data.password === user.password)
```

Isso não funcionaria, porque `user.password` não é a senha original.

Ela é uma senha criptografada.

Por isso usamos:

```ts
bcrypt.compare()
```

Ele compara a senha normal enviada no login com a senha criptografada salva no banco.

---

```ts
if (!passwordIsValid) {
    throw new UnauthorizedError("Senha inválida!")
}
```

Se a senha estiver errada, lançamos erro de autorização.

---

```ts
const token = generateToken({
    id: user.id,
    email: user.email
})
```

Se email e senha estiverem corretos, geramos um token.

Dentro do token colocamos apenas dados seguros:

* `id`;
* `email`.

Não colocamos senha.

---

```ts
return {
    user: omitPassword(user),
    token
}
```

Por fim, retornamos:

* o usuário sem senha;
* o token JWT.

---

# 🔹 6️⃣ Criar AuthController

Agora vamos criar um Controller só para autenticação.

O `UserController` continua cuidando das rotas de usuário:

* listar;
* buscar por id;
* criar;
* atualizar;
* deletar.

O `AuthController` vai cuidar do login.

Crie o arquivo:

```txt
src/controllers/AuthController.ts
```

Código:

```ts
import { NextFunction, Request, Response } from "express"
import { UserService } from "../services/UserService"

export class AuthController {

    async login(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password } = req.body

            // Chamamos o Service para fazer a regra de login
            const result = await UserService.login({
                email,
                password
            })

            // Se deu certo, retornamos usuário sem senha + token
            return res.json(result)

        } catch (error) {
            // Se deu erro, mandamos para o errorHandler
            next(error)
        }
    }
}
```

---

## 🔹 Por que não usamos `new UserService()`?

Porque no nosso projeto o `UserService` foi criado assim:

```ts
export const UserService = {
    async listAll() {},
    async getById() {},
    async create() {},
    async update() {},
    async delete() {}
}
```

Ou seja, ele é um **objeto**, não uma classe.

Por isso, usamos assim:

```ts
UserService.login()
```

E não assim:

```ts
const service = new UserService()
```

Esse exemplo com `new UserService()` só funcionaria se o Service tivesse sido criado como classe.

---

# 🔹 7️⃣ Criar middleware de autenticação

Agora vamos criar um middleware que protege rotas.

Esse middleware vai verificar se a requisição possui um token JWT válido.

Crie o arquivo:

```txt
src/middlewares/authMiddleware.ts
```

Código:

```ts
import { NextFunction, Request, Response } from "express"
import { verifyToken } from "../utils/jwt"

// Middleware para proteger rotas que exigem autenticação
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    // Pega o header de autorização da requisição
    const authHeader = req.headers.authorization

    // Se não houver header, retorna erro 401
    if (!authHeader) {
        return res.status(401).json({
            message: "Token não fornecido."
        })
    }

    // O token vem neste formato:
    // Authorization: Bearer tokenAqui
    const parts = authHeader.split(" ")

    // Se não tiver exatamente duas partes, está mal formatado
    if (parts.length !== 2) {
        return res.status(401).json({
            message: "Token mal formatado."
        })
    }

    const [scheme, token] = parts

    // A primeira parte precisa ser Bearer
    if (scheme !== "Bearer") {
        return res.status(401).json({
            message: "Formato do token inválido."
        })
    }

    // Verifica se o token é válido
    const decoded = verifyToken(token)

    // Se o token for inválido ou expirado, bloqueia
    if (!decoded) {
        return res.status(401).json({
            message: "Token inválido ou expirado."
        })
    }

    // Guardamos os dados decodificados dentro do req
    // Assim, outros controllers poderiam saber quem é o usuário logado
    ;(req as any).user = decoded

    // Se chegou até aqui, está tudo certo
    // Então deixamos a requisição seguir
    next()
}
```

---

## 🔹 Explicando o header Authorization

Quando o cliente faz uma requisição para uma rota protegida, ele precisa enviar o token assim:

```txt
Authorization: Bearer SEU_TOKEN_AQUI
```

Exemplo:

```txt
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

A palavra `Bearer` significa algo como “portador”.

Ou seja:

> Quem está carregando esse token tem autorização para acessar essa rota.

---

## 🔹 O que o middleware faz?

O middleware segue esta lógica:

1. Verifica se veio o header `Authorization`.
2. Verifica se o formato é `Bearer token`.
3. Pega apenas o token.
4. Verifica se o token é válido.
5. Se for válido, libera a rota.
6. Se não for válido, retorna erro `401`.

---

# 🔹 8️⃣ Criar rota de autenticação

Agora precisamos criar uma rota para login.

Crie o arquivo:

```txt
src/routes/auth.routes.ts
```

Código:

```ts
import { Router } from "express"
import { AuthController } from "../controllers/AuthController"

const router = Router()
const authController = new AuthController()

router.post("/login", authController.login.bind(authController))

export default router
```

---

## 🔹 Adicionar a rota no arquivo principal de rotas

No arquivo onde você junta suas rotas, importe a rota de autenticação.

Exemplo:

```ts
import { Router } from "express"
import userRoutes from "./user.routes"
import postRoutes from "./post.routes"
import authRoutes from "./auth.routes"

const router = Router()

router.use("/users", userRoutes)
router.use("/posts", postRoutes)
router.use("/auth", authRoutes)

export default router
```

Agora o login será feito em:

```txt
POST /auth/login
```

---

# 🔹 9️⃣ Testando o login

Para testar o login, primeiro precisamos ter um usuário cadastrado.

Exemplo de cadastro:

```http
POST http://localhost:3000/users
Content-Type: application/json

{
  "name": "João",
  "email": "teste@email.com",
  "password": "123456"
}
```

Depois, fazemos login:

```http
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "teste@email.com",
  "password": "123456"
}
```

Resposta esperada:

```json
{
  "user": {
    "id": 1,
    "name": "João",
    "email": "teste@email.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

O token será maior do que esse exemplo.

Copie o token, pois vamos usá-lo nas próximas requisições.

---

# 🔹 🔟 Proteger rotas com JWT

Agora vamos proteger algumas rotas.

No nosso projeto, o arquivo de rotas de usuários pode ficar assim:

```txt
src/routes/user.routes.ts
```

Código:

```ts
import { Router } from "express"
import { UserController } from "../controllers/UserController"
import { validateUser } from "../middlewares/validateUser"
import { authMiddleware } from "../middlewares/authMiddleware"

const router = Router()
const userController = new UserController()

// Cadastrar usuário fica público
// Afinal, se a pessoa ainda não tem conta, ela precisa conseguir se cadastrar
router.post("/", validateUser, userController.create.bind(userController))

// Daqui para baixo, as rotas exigem token
router.get("/", authMiddleware, userController.list.bind(userController))
router.get("/:id", authMiddleware, userController.getById.bind(userController))
router.put("/:id", authMiddleware, userController.update.bind(userController))
router.delete("/:id", authMiddleware, userController.delete.bind(userController))

export default router
```

---

## 🔹 Explicando as rotas protegidas

Esta rota ficou pública:

```ts
router.post("/", validateUser, userController.create.bind(userController))
```

Porque ela serve para criar conta.

Se exigirmos token para criar conta, ninguém conseguiria se cadastrar, porque para ter token a pessoa precisa fazer login, e para fazer login ela precisa ter conta.

Então o cadastro normalmente fica público.

---

Estas rotas ficaram protegidas:

```ts
router.get("/", authMiddleware, userController.list.bind(userController))
router.get("/:id", authMiddleware, userController.getById.bind(userController))
router.put("/:id", authMiddleware, userController.update.bind(userController))
router.delete("/:id", authMiddleware, userController.delete.bind(userController))
```

Ou seja, para listar, buscar, atualizar ou deletar usuários, precisa enviar token.

---

# 🔹 1️⃣1️⃣ Enviar token nas requisições protegidas

Agora, se tentarmos acessar:

```http
GET http://localhost:3000/users
```

Sem token, o servidor deve responder:

```json
{
  "message": "Token não fornecido."
}
```

Para acessar corretamente, precisamos enviar o header:

```http
GET http://localhost:3000/users
Authorization: Bearer SEU_TOKEN_AQUI
```

Exemplo:

```http
GET http://localhost:3000/users
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

# 🔹 1️⃣2️⃣ Ajuste importante no UserController

No método `create` do seu `UserController`, existe um detalhe importante.

Você escreveu:

```ts
const user = UserService.create({name, email, password})
```

Mas como `UserService.create()` é assíncrono, precisa de `await`.

O correto é:

```ts
const user = await UserService.create({ name, email, password })
```

Arquivo:

```txt
src/controllers/UserController.ts
```

Método corrigido:

```ts
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
```

Se esquecer o `await`, o servidor pode acabar retornando uma Promise em vez do usuário resolvido.

Traduzindo para o português claro: vai dar ruim de um jeito bem besta.

---

# 🔹 1️⃣3️⃣ Ajustar o errorHandler

Agora que criamos novos erros no Service, precisamos ensinar o `errorHandler` a lidar com eles.

Arquivo:

```txt
src/middlewares/errorHandler.ts
```

Código adaptado:

```ts
import { NextFunction, Request, Response } from "express"
import { NotFoundError, UnauthorizedError } from "../services/UserService"

// Esse middleware vai formatar cada resposta de erro.
// Ao invés de cada controller ter que pegar um erro e formatar a mensagem bonitinha, ele faz isso pra todo mundo.
export function errorHandler(error: any, req: Request, res: Response, next: NextFunction) {

    // Antes de mais nada, a gente mostra o erro "na forma original" dele pra debugar
    console.error("Erro capturado pelo errorHandler: ", error)

    // Erro para quando alguma coisa não foi encontrada
    if (error instanceof NotFoundError) {
        return res.status(404).json({
            message: error.message
        })
    }

    // Erro para quando o usuário não tem autorização
    // Exemplo: senha inválida
    if (error instanceof UnauthorizedError) {
        return res.status(401).json({
            message: error.message
        })
    }

    // Esse tal de 'ER_DUP_ENTRY' é específico do MySQL:
    // ele acontece quando a gente tenta salvar algo que já existe e tem UNIQUE
    // exemplo: criar um usuário com um email que já existe
    if (error.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
            message: "Registro duplicado (email já existente)."
        })
    }

    // Se for qualquer outro erro que a gente não previu, vira um 500 genérico
    return res.status(500).json({
        message: "Erro interno do servidor. Traduzindo: DEU RUIM, GURIZADA!"
    })
}
```

---

## 🔹 Atenção ao `NextFunction`

O Express espera que um middleware de erro receba 4 parâmetros:

```ts
error, req, res, next
```

Por isso usamos:

```ts
export function errorHandler(error: any, req: Request, res: Response, next: NextFunction) {
```

Mesmo que a gente não use o `next` dentro da função, é importante deixar ele ali.

Se não colocar os 4 parâmetros, o Express pode não reconhecer esse middleware como um middleware de erro.

---

# 🔹 1️⃣4️⃣ Testando com REST Client

## Criar usuário

```http
POST http://localhost:3000/users
Content-Type: application/json

{
  "name": "João",
  "email": "teste@email.com",
  "password": "123456"
}
```

---

## Fazer login

```http
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "teste@email.com",
  "password": "123456"
}
```

A resposta será parecida com:

```json
{
  "user": {
    "id": 1,
    "name": "João",
    "email": "teste@email.com"
  },
  "token": "TOKEN_GERADO_AQUI"
}
```

---

## Acessar rota protegida sem token

```http
GET http://localhost:3000/users
```

Resposta esperada:

```json
{
  "message": "Token não fornecido."
}
```

---

## Acessar rota protegida com token

```http
GET http://localhost:3000/users
Authorization: Bearer TOKEN_GERADO_AQUI
```

Resposta esperada:

```json
[
  {
    "id": 1,
    "name": "João",
    "email": "teste@email.com",
    "password": "$2b$10$...",
    "posts": []
  }
]
```

⚠️ Observação importante:

No seu método `listAll()`, você está retornando os usuários direto do banco:

```ts
return UserRepository.findAll()
```

Isso significa que, neste momento, a listagem pode mostrar a senha criptografada.

Como melhoria, você poderia remover a senha também na listagem.

Exemplo:

```ts
async listAll() {
    const users = await UserRepository.findAll()
    return users.map(user => omitPassword(user))
}
```

Assim, nenhum usuário da lista retorna com senha.

---

# 🔹 1️⃣5️⃣ Melhorando o listAll para não mostrar senhas

No `UserService`, podemos alterar o método `listAll()`.

Antes:

```ts
async listAll() {
    return UserRepository.findAll()
}
```

Depois:

```ts
async listAll() {
    const users = await UserRepository.findAll()
    return users.map(user => omitPassword(user))
}
```

Agora, quando listar usuários, a senha não aparece na resposta.

---

# 🔹 1️⃣6️⃣ Melhorando o getById para não mostrar senha

O mesmo vale para o `getById()`.

Antes:

```ts
return user
```

Depois:

```ts
return omitPassword(user)
```

Método completo:

```ts
async getById(id: number) {
    const user = await UserRepository.findById(id)

    if (!user) {
        throw new NotFoundError("Usuário não encontrado!")
    }

    return omitPassword(user)
}
```

Assim, ao buscar um usuário pelo ID, a senha também não será enviada.

---

# 🔹 1️⃣7️⃣ Versão melhorada do UserService sem retornar senhas

Se quisermos evitar retornar senha em qualquer rota, o `UserService` pode ficar assim:

```ts
import { UserRepository } from "../repositories/UserRepository"
import bcrypt from "bcrypt"
import { omitPassword } from "../utils/omitPassword"
import { generateToken } from "../utils/jwt"

export class NotFoundError extends Error {}
export class UnauthorizedError extends Error {}

export const UserService = {

    async listAll() {
        const users = await UserRepository.findAll()
        return users.map(user => omitPassword(user))
    },

    async getById(id: number) {
        const user = await UserRepository.findById(id)

        if (!user) {
            throw new NotFoundError("Usuário não encontrado!")
        }

        return omitPassword(user)
    },

    async create(data: { name: string, email: string, password: string }) {
        const hashedPassword = await bcrypt.hash(data.password, 10)

        const user = await UserRepository.create({
            name: data.name,
            email: data.email,
            password: hashedPassword
        })

        return omitPassword(user)
    },

    async login(data: { email: string, password: string }) {
        const user = await UserRepository.findByEmail(data.email)

        if (!user) {
            throw new NotFoundError("Usuário não encontrado!")
        }

        const passwordIsValid = await bcrypt.compare(data.password, user.password)

        if (!passwordIsValid) {
            throw new UnauthorizedError("Senha inválida!")
        }

        const token = generateToken({
            id: user.id,
            email: user.email
        })

        return {
            user: omitPassword(user),
            token
        }
    },

    async update(id: number, data: { name?: string, email?: string, password?: string }) {
        const user = await UserRepository.findById(id)

        if (!user) {
            throw new NotFoundError("Usuário não encontrado!")
        }

        if (data.name) user.name = data.name
        if (data.email) user.email = data.email
        if (data.password) user.password = await bcrypt.hash(data.password, 10)

        const updatedUser = await UserRepository.create(user)

        return omitPassword(updatedUser)
    },

    async delete(id: number) {
        const user = await UserRepository.delete(id)

        if (user.affected === 0) {
            throw new NotFoundError("Usuário não encontrado!")
        }
    }
}
```

---

# 🔹 1️⃣8️⃣ Fluxo final da autenticação

O fluxo final fica assim:

1. Usuário cria conta em `POST /users`.
2. A senha é criptografada com `bcrypt.hash()`.
3. Usuário faz login em `POST /auth/login`.
4. O Service procura o usuário pelo email.
5. O Service compara a senha enviada com a senha criptografada usando `bcrypt.compare()`.
6. Se estiver correto, o backend gera um JWT com `generateToken()`.
7. O cliente recebe o token.
8. O cliente envia o token nas rotas protegidas usando `Authorization: Bearer token`.
9. O `authMiddleware` verifica o token.
10. Se estiver válido, a rota é liberada.
11. Se estiver inválido, expirado ou ausente, o acesso é negado.

---

# 🔹 1️⃣9️⃣ Resumo dos arquivos criados ou alterados

## Arquivos criados

```txt
src/utils/jwt.ts
src/controllers/AuthController.ts
src/middlewares/authMiddleware.ts
src/routes/auth.routes.ts
```

## Arquivos alterados

```txt
src/repositories/UserRepository.ts
src/services/UserService.ts
src/controllers/UserController.ts
src/middlewares/errorHandler.ts
src/routes/user.routes.ts
```

---

# 🔹 2️⃣0️⃣ Resumo geral

O JWT serve para o servidor saber se uma pessoa está logada.

Depois do login, o servidor entrega um token.

Esse token precisa ser enviado nas próximas requisições protegidas.

Sem token, o usuário não acessa.

Com token inválido, também não acessa.

Com token válido, o servidor libera a rota.

Em outras palavras:

> Login e senha servem para conseguir o token.
>
> O token serve para continuar acessando o sistema sem precisar fazer login toda hora.

