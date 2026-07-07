# Aula - Autenticação com JWT: Login e Rotas Protegidas

> Este arquivo é uma continuação da aula "API REST com TypeORM, Services, Repositories e Middlewares (MVC sem View)". Ele assume que o projeto já está com toda a estrutura anterior pronta (entidades `User`/`Post`, Repository, Service, Controller, Middlewares de validação e o `errorHandler`).

## Objetivos da aula

- Entender o que é JWT (JSON Web Token) e por que ele é usado para autenticação em APIs REST.
- Entender a diferença entre autenticação baseada em sessão (com cookies no servidor) e autenticação baseada em token (stateless).
- Criar o endpoint de login, que verifica email e senha e devolve um token.
- Criar um middleware de autenticação, que protege rotas exigindo um token válido.
- Aplicar esse middleware nas rotas que fizer sentido proteger (por exemplo, criar, atualizar e deletar).
- Entender como pegar informações do usuário logado (`userId`) dentro do Controller, sem o cliente precisar informar isso manualmente.

---

## O que é JWT?

JWT significa **JSON Web Token**. É um formato de token usado para representar, de forma segura, que "esse usuário está autenticado" — sem o servidor precisar guardar nada sobre isso em memória ou em banco.

Um JWT é uma string dividida em três partes, separadas por pontos:

```
xxxxx.yyyyy.zzzzz
header.payload.signature
```

- **Header**: informa o tipo do token e o algoritmo usado para assiná-lo (ex: HS256).
- **Payload**: os dados que você decidiu colocar dentro do token (ex: `id` do usuário, `email`). Esses dados **não são criptografados**, apenas codificados em Base64 — ou seja, qualquer um consegue decodificar e ler o payload. Por isso, nunca colocamos dados sensíveis (como senha) dentro do token.
- **Signature**: uma assinatura gerada a partir do header + payload + uma chave secreta que só o servidor conhece (`JWT_SECRET`). É essa assinatura que garante que o token não foi alterado por ninguém no meio do caminho.

### Por que usar JWT em vez de sessão?

Numa autenticação tradicional baseada em sessão, o servidor guarda em algum lugar (memória, banco, Redis) a informação "esse usuário está logado", e entrega ao cliente apenas um identificador dessa sessão (geralmente num cookie). Toda requisição futura, o servidor precisa consultar esse armazenamento para saber quem é o usuário.

Com JWT, o servidor não guarda nada. Ele gera o token uma vez, na hora do login, e devolve para o cliente. Nas próximas requisições, o cliente reenvia esse token, e o servidor só precisa **verificar a assinatura** (usando o `JWT_SECRET`) pra saber que o token é válido e não foi adulterado — sem precisar consultar banco nenhum. Isso é o que chamamos de autenticação **stateless** (sem estado): o servidor não guarda estado nenhum sobre quem está logado, toda a informação necessária já vem dentro do próprio token.

Isso traz uma consequência importante: como o servidor não guarda nada, ele também não consegue "invalidar" um token específico antes da hora — por isso os tokens JWT normalmente têm um tempo de expiração curto (ex: `1h`, `7d`).

### Onde o token fica guardado, e como ele viaja até o servidor?

Depois do login, o cliente (front-end, app mobile, etc) guarda o token em algum lugar (ex: `localStorage`, memória da aplicação) e passa a enviá-lo em toda requisição que precisa de autenticação, dentro do header `Authorization`, no formato:

```
Authorization: Bearer <token>
```

`Bearer` é só uma convenção de nome pro tipo de token. É esse header que o nosso middleware de autenticação vai ler.

---

## O que é CORS?

CORS significa **Cross-Origin Resource Sharing** (Compartilhamento de Recursos entre Origens). É um mecanismo de segurança que já vem embutido nos navegadores — não é algo do Node.js nem do Express, é o próprio navegador que aplica essa regra.

Por padrão, um navegador bloqueia requisições feitas por JavaScript de uma página para um domínio diferente do domínio de onde essa página foi carregada. Chamamos domínios diferentes de "origens" diferentes (origin = protocolo + domínio + porta).

Exemplo prático: se o seu front-end React roda em `http://localhost:5173` e a sua API roda em `http://localhost:3000`, tecnicamente são duas origens diferentes — a porta já é suficiente para contar como origem diferente. Por padrão, o navegador bloqueia a resposta dessa requisição, mesmo que a API tenha processado tudo certinho — o bloqueio acontece do lado do navegador, na hora de entregar a resposta pro seu código JavaScript.

Essa proteção existe por segurança: sem ela, qualquer site malicioso poderia disparar requisições escondidas para outros sites onde você já está logado (por exemplo, o site do seu banco), aproveitando credenciais salvas no seu navegador, sem que você perceba.

O pacote `cors` configura, do lado do **servidor**, quais origens têm permissão de acessar a API. É o servidor que decide isso, através de um header de resposta chamado `Access-Control-Allow-Origin` — o navegador só obedece o que o servidor respondeu naquele header.

Sem configurar isso, ao chamar sua API a partir do front-end rodando em outra porta, você veria um erro no console do navegador parecido com este:

```
Access to fetch at 'http://localhost:3000/users' from origin 'http://localhost:5173'
has been blocked by CORS policy
```

---

## Instalando as dependências

```bash
npm install jsonwebtoken cors
npm install -D @types/jsonwebtoken @types/cors
```

- `jsonwebtoken`: biblioteca que gera (`sign`) e verifica (`verify`) tokens JWT.
- `@types/jsonwebtoken`: assim como o `bcrypt`, essa biblioteca é escrita em JavaScript puro, então precisamos desse pacote à parte para o TypeScript entender seus tipos.
- `cors`: middleware do Express que adiciona os headers necessários para liberar (ou restringir) quais origens podem acessar a API.
- `@types/cors`: pacote de tipos do `cors`, pelo mesmo motivo do `@types/jsonwebtoken`.

---

## Atualizando o `.env`

Precisamos de uma chave secreta, usada pelo servidor para assinar e verificar os tokens. Essa chave **nunca** deve ser exposta ou versionada num repositório público — por isso ela mora no `.env`.

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=meubanco
JWT_SECRET=uma-string-bem-grande-e-dificil-de-adivinhar
JWT_EXPIRES_IN=1h
```

- `JWT_SECRET`: a chave usada para assinar e validar os tokens. Se alguém descobrir essa chave, consegue forjar tokens válidos — por isso ela precisa ser algo longo e difícil de adivinhar, e diferente em cada ambiente (desenvolvimento, produção).
- `JWT_EXPIRES_IN`: por quanto tempo o token gerado é válido. Depois desse tempo, o token expira e o usuário precisa logar de novo.

---

## Estrutura de pastas atualizada

```
src/
 |- config/
 |   |- data-source.ts
 |- models/
 |   |- User.ts
 |   |- Post.ts
 |- repositories/
 |   |- UserRepository.ts
 |   |- PostRepository.ts
 |- services/
 |   |- UserService.ts
 |   |- PostService.ts
 |   |- AuthService.ts        <- novo
 |- middlewares/
 |   |- errorHandler.ts
 |   |- validateUser.ts
 |   |- validatePost.ts
 |   |- authMiddleware.ts     <- novo
 |- controllers/
 |   |- UserController.ts
 |   |- PostController.ts
 |   |- AuthController.ts     <- novo
 |- routes/
 |   |- index.ts
 |   |- auth.routes.ts        <- novo
 |   |- user.routes.ts        <- novo
 |   |- post.routes.ts        <- novo
 |- utils/
 |   |- omitPassword.ts
 |- types/
 |   |- AuthRequest.ts        <- novo
 |- server.ts
.env
```

---

## A camada Service: `AuthService`

Assim como fizemos com `User` e `Post`, a lógica de negócio do login (verificar email, comparar senha, gerar o token) não deve morar no Controller. Ela vive numa camada de Service própria, chamada `AuthService`.

Repare que o `AuthService` **reaproveita** o `UserRepository` que já existe — ele não precisa de um Repository próprio, porque a informação que ele precisa (buscar um usuário pelo email) é sobre a entidade `User`.

Só que aqui temos um detalhe novo: lembra que lá em `User.ts` colocamos `select: false` na coluna `password`? Isso significa que um `find()` normal do TypeORM **não traz** o campo `password` — o que é ótimo para não vazar a senha em respostas da API, mas é um problema aqui, porque para fazer login **precisamos** comparar a senha informada com o hash salvo. Por isso, vamos criar um novo método no `UserRepository`, específico para isso.

A forma mais simples de resolver isso é passando explicitamente a opção `select` na busca, listando os campos que queremos de volta — incluindo `password`. Quando você lista os campos manualmente desse jeito, o TypeORM entende que você pediu aquele campo de propósito, e ignora o `select: false` da entidade só nessa consulta.

Primeiro, adicione este método em `src/repositories/UserRepository.ts` (sem alterar o restante do arquivo):

```ts
    // Método específico para o login. Diferente do findById, aqui
    // precisamos que o campo password venha na resposta. Listando os
    // campos manualmente em "select", conseguimos trazer o password
    // mesmo com select: false configurado lá na entidade — sem
    // precisar de createQueryBuilder nem SQL manual.
    async findByEmailWithPassword(email: string) {
        return repo.findOne({
            where: { email },
            select: ['id', 'name', 'email', 'password'],
        });
    },
```

Bem mais simples do que montar a query manualmente: o `findOne` já resolve tudo, só que dessa vez sendo explícito sobre quais campos queremos de volta.

Agora, o `AuthService`:

Arquivo `src/services/AuthService.ts`:

```ts
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/UserRepository';

// Reaproveitamos aqui o mesmo tipo de erro criado na aula anterior, só que
// para representar um problema de autenticação (email não existe, ou
// senha errada). Propositalmente não dizemos QUAL dos dois está errado
// (ver comentário mais abaixo, no AuthService.login).
export class UnauthorizedError extends Error {}

// Pegamos as configurações do JWT direto do .env. O "as string" no final
// diz ao TypeScript "confie em mim, isso aqui não vai ser undefined" -
// já que sabemos que essas variáveis sempre vão existir no .env.
const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

export const AuthService = {
    async login(email: string, password: string) {
        // Buscamos o usuário pelo email, já trazendo o campo password
        // (que normalmente fica escondido por causa do select: false).
        const user = await UserRepository.findByEmailWithPassword(email);

        // Se não achou usuário com esse email, é um erro de autenticação.
        if (!user) {
            throw new UnauthorizedError('Email ou senha inválidos.');
        }

        // bcrypt.compare pega a senha em texto puro que o usuário digitou
        // e compara com o hash salvo no banco. Ele retorna true ou false.
        const senhaValida = await bcrypt.compare(password, user.password);

        if (!senhaValida) {
            throw new UnauthorizedError('Email ou senha inválidos.');
        }

        // IMPORTANTE: tanto no caso de "email não existe" quanto no caso
        // de "senha errada", devolvemos a MESMA mensagem de erro. Isso é
        // proposital: se disséssemos "email não encontrado" só quando o
        // email não existe, alguém mal-intencionado poderia usar essa
        // diferença de mensagem pra descobrir quais emails estão
        // cadastrados no sistema, testando um por um.

        // jwt.sign cria o token. O primeiro argumento é o payload (os
        // dados que queremos guardar dentro do token). Aqui colocamos só
        // o id do usuário - o suficiente para identificá-lo depois. NUNCA
        // coloque a senha (nem o hash dela) dentro do payload, porque o
        // payload não é criptografado, só codificado.
        const token = jwt.sign(
            { id: user.id },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        return {
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
        };
    },
};
```

---

## A camada Controller: `AuthController`

Arquivo `src/controllers/AuthController.ts`:

```ts
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';

export class AuthController {
    // POST /login -> autentica o usuário e devolve o token
    async login(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password } = req.body;
            const result = await AuthService.login(email, password);
            return res.json(result);
        } catch (error) {
            next(error);
        }
    }
}
```

Repare que o padrão é idêntico ao que já usamos em `UserController` e `PostController`: o Controller só lê o `req.body`, chama o Service, e devolve a resposta — toda a regra de negócio fica no `AuthService`.

Também precisamos ensinar o `errorHandler` a reconhecer o novo tipo de erro. Adicione este trecho em `src/middlewares/errorHandler.ts` (sem remover nada que já existe):

```ts
import { UnauthorizedError } from '../services/AuthService';
```

E, dentro da função `errorHandler`, adicione mais um `if`, antes do retorno genérico de 500:

```ts
    // Se foi um UnauthorizedError (lançado lá no AuthService), sabemos
    // que é "email ou senha inválidos", então respondemos 401.
    if (err instanceof UnauthorizedError) {
        return res.status(401).json({ message: err.message });
    }
```

---

## O middleware de autenticação: `authMiddleware`

Esse é o middleware que vai proteger as rotas. A ideia é: antes de deixar a requisição chegar no Controller, ele verifica se veio um token válido no header `Authorization`. Se não veio (ou o token é inválido/expirado), a requisição é interrompida com status 401, sem nem chegar no Controller — exatamente na mesma lógica de `validateUser` e `validatePost`, só que verificando autenticação em vez de campos obrigatórios.

Antes de criar o middleware, precisamos resolver um detalhe de tipagem do TypeScript: por padrão, o objeto `Request` do Express não possui uma propriedade `userId`. Como vamos guardar o id do usuário autenticado dentro do `req`, criaremos uma interface própria que herda de `Request` e adiciona essa propriedade.

Arquivo `src/types/AuthRequest.ts`:

```ts
import { Request } from 'express';

// Herdamos tudo o que um Request já possui e adicionamos
// apenas o campo userId, que será preenchido pelo
// authMiddleware.
export interface AuthRequest extends Request {
    userId?: number;
}
```

Agora sim, o middleware:

Arquivo `src/middlewares/authMiddleware.ts`:

```ts
import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types/AuthRequest';

const JWT_SECRET = process.env.JWT_SECRET as string;

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
    // O token chega no header Authorization, no formato "Bearer <token>".
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: 'Token não informado.' });
    }

    // authHeader vem como "Bearer xxxxx.yyyyy.zzzzz". Damos um split no
    // espaço e pegamos só a segunda parte, que é o token de fato.
    const [, token] = authHeader.split(' ');

    if (!token) {
        return res.status(401).json({ message: 'Token mal formatado.' });
    }

    try {
        // jwt.verify confere se o token foi realmente assinado com o
        // nosso JWT_SECRET, e se ele ainda não expirou. Se tudo estiver
        // certo, ele devolve o payload que colocamos lá no jwt.sign
        // (no nosso caso, { id: number }).
        const payload = jwt.verify(token, JWT_SECRET) as { id: number };

        // Guardamos o id do usuário autenticado dentro do req, para que
        // o Controller (ou o Service) consiga usar esse dado mais tarde,
        // sem precisar que o cliente reenvie o id em outro lugar.
        req.userId = payload.id;

        // Token válido, deixa a requisição seguir para o Controller.
        next();
    } catch (error) {
        // Se o token estiver expirado, adulterado, ou assinado com uma
        // chave diferente, jwt.verify lança um erro, e caímos aqui.
        return res.status(401).json({ message: 'Token inválido ou expirado.' });
    }
}
```

> Diferente do `validateUser` e do `validatePost`, aqui usamos `try/catch` dentro do próprio middleware, em vez de deixar o erro subir para o `errorHandler`. Isso porque `jwt.verify` lança um erro síncrono simples, e é mais direto tratar ali mesmo do que criar mais uma classe de erro só pra isso.

---

## Protegendo as rotas

Agora que temos o `authMiddleware`, podemos exigir autenticação em qualquer rota, simplesmente colocando o middleware antes do Controller, do mesmo jeito que já fazíamos com `validateUser` e `validatePost`.

Faz sentido, por exemplo, proteger as rotas que alteram dados (criar, atualizar, deletar), deixando as de leitura (`GET`) livres. Isso é só uma decisão de projeto — em outra aplicação, você poderia proteger tudo.

Aproveitando que estamos mexendo nas rotas, também é um bom momento para dividir o `routes/index.ts` — que já estava crescendo bastante — em um arquivo por recurso. Isso deixa cada arquivo pequeno e fácil de achar ("quero mexer nas rotas de post? vou direto em `post.routes.ts`"), e o `index.ts` passa a ser só um agregador, que junta todos os Routers menores.

Arquivo `src/routes/auth.routes.ts`:

```ts
import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';

const authRoutes = Router();
const authController = new AuthController();

// Rota de login. Não passa por authMiddleware, porque o usuário ainda não
// tem token nenhum nesse momento - é aqui que ele vai conseguir um.
authRoutes.post('/login', authController.login.bind(authController));

export default authRoutes;
```

Arquivo `src/routes/user.routes.ts`:

```ts
import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { validateUser } from '../middlewares/validateUser';
import { authMiddleware } from '../middlewares/authMiddleware';

const userRoutes = Router();
const userController = new UserController();

// Repare que aqui os caminhos são relativos ('/', '/:id'), sem o prefixo
// '/users'. Quem adiciona esse prefixo é o routes/index.ts, na hora de
// "plugar" esse Router dentro do Router principal.

// GET continuam livres. Create, update e delete agora exigem token válido:
// authMiddleware roda ANTES de validateUser, porque não faz sentido nem
// checar os campos do corpo da requisição se quem está chamando nem está
// autenticado.
userRoutes.get('/', userController.list.bind(userController));
userRoutes.get('/:id', userController.getById.bind(userController));
userRoutes.post('/', validateUser, userController.create.bind(userController));
userRoutes.put('/:id', authMiddleware, userController.update.bind(userController));
userRoutes.delete('/:id', authMiddleware, userController.delete.bind(userController));

export default userRoutes;
```

Arquivo `src/routes/post.routes.ts`:

```ts
import { Router } from 'express';
import { PostController } from '../controllers/PostController';
import { validatePost } from '../middlewares/validatePost';
import { authMiddleware } from '../middlewares/authMiddleware';

const postRoutes = Router();
const postController = new PostController();

postRoutes.get('/', postController.list.bind(postController));
postRoutes.get('/:id', postController.getById.bind(postController));
postRoutes.post('/', authMiddleware, validatePost, postController.create.bind(postController));
postRoutes.put('/:id', authMiddleware, postController.update.bind(postController));
postRoutes.delete('/:id', authMiddleware, postController.delete.bind(postController));

export default postRoutes;
```

E, por fim, o arquivo que junta todos eles. Arquivo `src/routes/index.ts` (substitua o conteúdo desse arquivo por este):

```ts
import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import postRoutes from './post.routes';

const routes = Router();

// routes.use(router, prefixo) "monta" um Router menor dentro do Router
// principal. authRoutes é montado sem prefixo (então POST /login continua
// sendo /login). userRoutes e postRoutes são montados com prefixo, e é
// esse prefixo que se junta aos caminhos relativos ('/', '/:id') definidos
// em cada arquivo, formando /users, /users/:id, /posts, /posts/:id, etc.
routes.use(authRoutes);
routes.use('/users', userRoutes);
routes.use('/posts', postRoutes);

export default routes;
```

> Note que a rota `POST /users` (criar conta) continua sem `authMiddleware` de propósito: é assim que uma pessoa nova consegue se cadastrar sem já ter um token. Já `POST /posts` agora exige token, porque só faz sentido criar um post estando logado.

Um middleware pode ser encadeado com quantos outros forem necessários, na ordem em que você os escreve: `postRoutes.post('/', authMiddleware, validatePost, ...)` primeiro confere se o usuário está autenticado, e só depois confere se os campos do corpo estão corretos.

---

## Aplicando o CORS no `server.ts`

Assim como o `errorHandler`, o `cors` também é registrado com `app.use()`, direto no `server.ts` da aula anterior. A única regra importante é: registre o `cors` **antes** das rotas, para que ele rode em toda requisição, protegida ou não.

Adicione este import em `src/server.ts` (sem remover nada que já existe):

```ts
import cors from 'cors';
```

E, dentro do `.then()`, logo depois de `app.use(express.json());`, adicione:

```ts
// Libera o acesso da API para outras origens (ex: o front-end rodando
// numa porta diferente). Sem isso, o navegador bloqueia as respostas.
app.use(cors());
```

Chamado assim, sem nenhuma opção, `cors()` libera acesso para **qualquer origem** — ótimo para desenvolvimento, mas não recomendado em produção. Para restringir o acesso só ao domínio do seu front-end, passe um objeto de configuração:

```ts
app.use(cors({
    origin: 'http://localhost:5173', // endereço do seu front-end
}));
```

Assim, só requisições vindas dessa origem específica são liberadas pelo navegador — qualquer outro domínio tentando acessar a API continua sendo bloqueado.

---

## Usando o `userId` autenticado dentro do Controller

Um dos maiores ganhos de ter o `userId` disponível em `req.userId` é que o Controller não precisa mais confiar em nada que o cliente mandou manualmente para saber "quem está fazendo essa ação" — ele já sabe, porque o token garantiu isso.

Como `Request` não possui a propriedade `userId`, basta trocar o tipo do parâmetro para `AuthRequest` nos Controllers que precisarem acessar essa informação.

Por exemplo, poderíamos alterar `PostController.create` para usar `req.userId` como dono do post, em vez de esperar um `userId` no corpo da requisição:

```ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/AuthRequest';

async create(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { title } = req.body;
            // req.userId foi preenchido pelo authMiddleware, que já rodou
            // antes deste Controller. Não precisamos mais que o cliente
            // envie o userId no corpo da requisição.
            const post = await PostService.create({ title, userId: req.userId! });
            return res.status(201).json(post);
        } catch (error) {
            next(error);
        }
    }
```

> O `!` depois de `req.userId` diz ao TypeScript "eu garanto que isso não é undefined aqui". Podemos afirmar isso com segurança porque essa rota só é alcançada depois de passar pelo `authMiddleware` — se o token não fosse válido, a requisição já teria sido interrompida antes de chegar até aqui.

Essa mudança é opcional e fica como sugestão de exercício mais abaixo, para não alterar o comportamento do que já foi construído na aula anterior.

> Essa abordagem é mais simples de entender do que estender a interface `Request` do Express com *declaration merging*. A única diferença é que todo Controller (ou middleware) que precisar acessar `req.userId` deverá utilizar `AuthRequest` no lugar de `Request`.

---

## Resumo do fluxo completo: login + rota protegida

**Login (`POST /login`):**

1. A requisição chega em `POST /login`, sem passar por nenhum middleware de autenticação (afinal, o usuário ainda não tem token).
2. O `AuthController.login` lê `email` e `password` do `req.body` e chama `AuthService.login`.
3. O `AuthService.login` busca o usuário pelo email (usando o novo método `findByEmailWithPassword`, que traz o campo `password` mesmo com `select: false`).
4. Se o email não existe, ou a senha não confere com o hash salvo (`bcrypt.compare`), lança um `UnauthorizedError`.
5. Se está tudo certo, gera um token com `jwt.sign`, contendo o `id` do usuário no payload, e devolve esse token junto com os dados básicos do usuário.
6. O cliente guarda esse token e passa a enviá-lo no header `Authorization: Bearer <token>` em toda requisição futura que precisar de autenticação.

**Rota protegida (ex: `DELETE /users/:id`):**

1. A requisição chega em `DELETE /users/:id`, com o header `Authorization: Bearer <token>`.
2. O `authMiddleware` roda primeiro. Ele extrai o token do header e usa `jwt.verify` para confirmar que o token é válido e não expirou.
3. Se o token for inválido, a requisição já é respondida com 401 e nem chega no Controller.
4. Se o token for válido, o middleware guarda `payload.id` em `req.userId` e chama `next()`, deixando a requisição seguir.
5. O `UserController.delete` roda normalmente, chamando `UserService.delete`, exatamente como já funcionava antes — a única diferença é que, agora, essa rota só é alcançada por quem está autenticado.

---

## Exercícios práticos

1. Aplique `authMiddleware` também nas rotas de `Category` e `Product` que você criou nos exercícios da aula anterior (proteja pelo menos create, update e delete).
2. Altere `PostController.create` para usar `req.userId` como dono do post, em vez de receber `userId` no corpo da requisição (como mostrado no exemplo acima). Depois disso, atualize `validatePost` para não exigir mais o campo `userId` no `req.body`.
3. Crie uma rota `GET /me`, protegida por `authMiddleware`, que devolve os dados do usuário autenticado (usando `req.userId` para buscar o usuário pelo `UserService.getById`).
4. (Desafio) No `AuthService`, adicione um `role` (ex: `"admin"` ou `"user"`) na entidade `User` e no payload do token. Depois, crie um novo middleware `adminMiddleware`, que só deixa passar se `payload.role === "admin"`, e proteja alguma rota sensível (ex: `DELETE /users/:id`) com ele.
5. (Desafio, avançado) Pesquise sobre **refresh tokens** — a ideia de ter um token de vida curta (o que já fizemos) e um segundo token, de vida mais longa, usado só para gerar um novo token de acesso sem o usuário precisar logar de novo — e implemente uma rota `POST /refresh-token`.

---

## Resumo geral

- JWT (JSON Web Token) é um token assinado digitalmente, composto por header, payload e assinatura, usado para autenticação stateless: o servidor não precisa guardar nada sobre quem está logado, só verificar a assinatura do token a cada requisição.
- O payload de um JWT não é criptografado, só codificado — por isso nunca colocamos dados sensíveis (como senha) dentro dele.
- O token viaja do cliente para o servidor pelo header `Authorization: Bearer <token>`.
- `AuthService.login` verifica email e senha (usando `bcrypt.compare`) e gera o token com `jwt.sign`, seguindo o mesmo padrão de Service já usado na aula anterior (regra de negócio isolada, erro lançado com `throw`, nunca respondendo HTTP diretamente).
- `authMiddleware` é quem protege as rotas: ele confere o token com `jwt.verify` antes de deixar a requisição chegar ao Controller, e guarda o id do usuário autenticado em `req.userId`.
- Rotas são protegidas simplesmente adicionando `authMiddleware` na cadeia de middlewares da rota — o mesmo mecanismo já usado para `validateUser` e `validatePost`.
- `UnauthorizedError` segue o mesmo padrão de `NotFoundError` da aula anterior: é lançado no Service e tratado de forma centralizada no `errorHandler`, que decide o status 401.
- Para buscar a senha de um usuário (necessário só no login, já que `password` tem `select: false`), basta listar os campos manualmente com a opção `select` do `findOne` — não é preciso usar `createQueryBuilder` nem escrever SQL manual.
- CORS é uma proteção do próprio navegador contra requisições entre origens diferentes; o pacote `cors`, usado com `app.use(cors())` no `server.ts`, é quem autoriza (do lado do servidor) quais origens podem acessar a API.
- As rotas foram divididas em um arquivo por recurso (`auth.routes.ts`, `user.routes.ts`, `post.routes.ts`), cada um exportando seu próprio `Router`; o `routes/index.ts` passou a ser só um agregador, que monta cada Router menor com `routes.use(...)`.
