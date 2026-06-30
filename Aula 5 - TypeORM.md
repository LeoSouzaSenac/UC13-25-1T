# Aula - API REST com TypeORM, Repositories, Middlewares e Bcrypt (MVC sem View)

## Objetivos da aula

- Entender o que é um ORM e como o TypeORM facilita o trabalho com banco de dados.
- Criar entidades e mapear para tabelas usando decorators.
- Implementar relacionamentos (One-to-Many, Many-to-One) no TypeORM.
- Entender por que separar o acesso ao banco em uma camada própria de Repository, além do Controller.
- Implementar o CRUD completo (Create, Read, Update, Delete) para `User` e `Post`.
- Criar middlewares de validação e de tratamento de erros.
- Usar bcrypt para nunca salvar senhas em texto puro no banco (ainda sem login/JWT, isso fica para uma aula futura).
- Entender, camada por camada, qual é a responsabilidade de cada arquivo do projeto.

---

## O que é um ORM?

ORM significa Object-Relational Mapping (Mapeamento Objeto-Relacional).

É uma forma de interagir com o banco de dados usando objetos e métodos, sem precisar escrever SQL puro o tempo todo.

Vantagens de usar ORM:
- Menos repetição de código SQL.
- Menos risco de SQL Injection (tratamento automático).
- Melhor organização do código.
- Portabilidade entre bancos de dados diferentes.

### Diferença: SQL manual vs TypeORM

No `mysql2/promise` (SQL manual):
```ts
const [rows] = await connection.query(
  'SELECT * FROM usuarios WHERE id = ?',
  [id]
);
```

No TypeORM:
```ts
const user = await userRepository.findOneBy({ id });
```

No SQL manual você escreve a query. No ORM você descreve o que quer, e ele gera a query para você.

---

## Arquitetura do projeto

O projeto vai seguir um padrão MVC sem View, com uma camada extra de Repository entre o Controller e o banco de dados:

```
Rota -> Middleware -> Controller -> Repository -> Banco de Dados
```

Cada seta representa uma responsabilidade diferente, e cada camada só conhece a camada imediatamente abaixo dela.

### Responsabilidade de cada camada

- **Model (Entidade)**: descreve a estrutura dos dados e como eles se relacionam entre si. Não tem lógica de negócio, é só a "planta" da tabela.
- **Repository**: é o único lugar do projeto que conversa diretamente com o `AppDataSource` e com os métodos do TypeORM (`find`, `save`, `delete`, etc). Concentra todas as queries relacionadas a uma entidade.
- **Middleware**: funções que rodam antes (ou depois) do controller, para validar dados, tratar erros, checar permissões, etc. Servem para tirar responsabilidades repetidas de dentro dos controllers.
- **Controller**: recebe a requisição HTTP, extrai os dados necessários (`req.body`, `req.params`), chama o Repository para executar a operação, e devolve uma resposta HTTP (`res.json`, `res.status`). Não deveria conter lógica de acesso a banco nem lógica de validação pesada.
- **Routes**: apenas conecta uma URL + método HTTP (GET, POST, PUT, DELETE) a um método do Controller. Não tem lógica nenhuma, só encaminhamento.

---

## Configuração inicial do projeto

### 1. Criar a pasta do projeto

```bash
mkdir api-aula && cd api-aula
```

### 2. Iniciar o projeto

```bash
npm init -y
```

### 3. Instalar dependências

```bash
npm install express typeorm reflect-metadata mysql2 dotenv bcrypt
npm install -D typescript @types/node @types/express ts-node-dev @types/bcrypt
```

- `express`: framework para criar o servidor HTTP e as rotas.
- `typeorm`: o ORM que vamos usar para mapear classes em tabelas do banco.
- `reflect-metadata`: necessário para o TypeORM conseguir ler os decorators (`@Entity`, `@Column`, etc).
- `mysql2`: driver de conexão com o MySQL, usado por baixo dos panos pelo TypeORM.
- `dotenv`: carrega variáveis de ambiente do arquivo `.env`.
- `bcrypt`: biblioteca que transforma uma senha em texto puro (ex: `"123456"`) em um hash criptografado, que é o que de fato salvamos no banco. Nunca salvamos a senha original.
- `@types/bcrypt`: o `bcrypt` é escrito em JavaScript puro e não vem com tipos do TypeScript. Esse pacote adiciona esses tipos, para o TypeScript entender os métodos da biblioteca e nos dar autocomplete e checagem de tipos.
- `ts-node-dev`: roda o projeto TypeScript em modo desenvolvimento, reiniciando o servidor automaticamente a cada alteração.

### 4. Criar o `tsconfig.json`

```bash
npx tsc --init
```

Configure assim:

```json
{
  "compilerOptions": {
    "target": "ES6",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "strictPropertyInitialization": false
  },
  "include": ["src"],
  "exclude": ["node_modules"]
}
```

Explicando:
- `experimentalDecorators`: habilita uso de `@Entity`, `@Column`, etc.
- `emitDecoratorMetadata`: necessário para o TypeORM saber os tipos das colunas.
- `strictPropertyInitialization: false`: evita erro em propriedades que o ORM preenche sozinho.

### 5. Criar o `.env`

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=meubanco
```

### 6. Script de desenvolvimento

No `package.json`, adicione:

```json
"scripts": {
  "dev": "ts-node-dev --respawn --transpile-only src/server.ts"
}
```

---

## Estrutura de pastas

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
 |- middlewares/
 |   |- errorHandler.ts
 |   |- asyncHandler.ts
 |   |- validateUser.ts
 |   |- validatePost.ts
 |- controllers/
 |   |- UserController.ts
 |   |- PostController.ts
 |- routes/
 |   |- index.ts
 |- server.ts
.env
```

---

## Configurando a conexão com o banco

Arquivo `src/config/data-source.ts`:

```ts
// Importa o "reflect-metadata", que é essencial para o TypeORM funcionar.
// Ele habilita o uso de decorators (@Entity, @Column, etc.) para mapear classes
// em tabelas do banco. Mapear classes em tabelas significa transformar cada
// classe do código em uma tabela do banco de dados, onde cada propriedade da
// classe vira uma coluna e cada objeto vira um registro.
import 'reflect-metadata';

// Importa a classe DataSource do TypeORM.
// O DataSource é a configuração principal de conexão com o banco de dados.
// Ele sabe qual banco usar, onde conectar, quais entidades existem, etc.
import { DataSource } from 'typeorm';

// Importa a biblioteca dotenv, que serve para carregar variáveis de ambiente
// do arquivo .env. Isso evita colocar senhas e dados sensíveis no código.
import * as dotenv from "dotenv";

// Importa as entidades do projeto. Entidades são as classes que representam
// tabelas do banco de dados dentro do código, descrevendo seus campos
// (colunas) e relações com outras tabelas.
import { User } from '../models/User';
import { Post } from '../models/Post';

// Carrega as variáveis de ambiente do arquivo .env para o process.env
dotenv.config();

// Pegamos as variáveis de ambiente definidas no .env através de destructuring.
const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

// Criamos e exportamos a configuração principal do banco de dados.
// Quando você cria uma instância de DataSource, você define:
//   - Tipo do banco (mysql, postgres, etc.)
//   - Host, porta, usuário, senha
//   - Quais entidades usar
//   - Se vai sincronizar tabelas automaticamente (synchronize)
export const AppDataSource = new DataSource({
    type: 'mysql',
    host: DB_HOST,
    port: Number(DB_PORT || "3306"),
    username: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,

    // synchronize: true cria automaticamente as tabelas e colunas com base
    // nas entidades. Útil em desenvolvimento. Em produção deve ser false,
    // para não apagar ou alterar dados automaticamente.
    synchronize: true,

    // logging: true faz o TypeORM mostrar no terminal todos os comandos SQL
    // que ele está executando.
    logging: true,

    // Registramos as entidades (classes que representam tabelas) para que
    // o TypeORM saiba quais existem e crie o mapeamento com o banco.
    entities: [User, Post],
});
```

---

## Criando as entidades

Arquivo `src/models/User.ts`:

```ts
// Decorators são uma funcionalidade do TypeScript que permitem adicionar
// comportamento extra a classes, métodos ou propriedades de forma
// declarativa, usando o símbolo @. É por causa deles que conseguimos
// transformar classes e propriedades em tabelas e colunas no banco.
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Post } from './Post';

// @Entity('users') indica que esta classe representa a tabela "users".
@Entity('users')
export class User {
    // @PrimaryGeneratedColumn() diz ao TypeORM que esta coluna é a chave
    // primária (PK) da tabela, e que o valor dela deve ser gerado
    // automaticamente (auto-incremento).
    @PrimaryGeneratedColumn()
    id: number;

    // @Column define que esta propriedade será uma coluna no banco.
    // length: 100 -> tamanho máximo do campo.
    // nullable: false -> não pode ser nulo.
    @Column({ length: 100, nullable: false })
    name: string;

    // unique: true garante que o valor será único na tabela (não pode repetir).
    @Column({ unique: true })
    email: string;

    // Guardamos aqui o HASH da senha, nunca a senha em texto puro.
    // select: false faz o TypeORM, por padrão, NUNCA trazer este campo quando
    // fizermos um find() normal. Isso é uma proteção extra: mesmo que alguém
    // esqueça de remover a senha manualmente antes de responder ao cliente,
    // o campo já não vem na consulta por padrão. Só vem se pedirmos explicitamente.
    @Column({ select: false })
    password: string;

    // @OneToMany indica que um usuário pode ter vários posts (1:N).
    // () => Post -> função que retorna a entidade relacionada.
    // post => post.user -> indica a propriedade em Post que referencia o User.
    // O TypeORM usa isso para criar a relação e a chave estrangeira
    // automaticamente. A outra ponta dessa relação é declarada em Post.
    @OneToMany(() => Post, post => post.user)
    posts: Post[];
}
```

Arquivo `src/models/Post.ts`:

```ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from './User';

// @Entity('posts') indica que esta classe representa a tabela "posts".
@Entity('posts')
export class Post {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "varchar", length: 100, nullable: false })
    title: string;

    // @ManyToOne indica que vários posts podem pertencer a um único usuário (N:1).
    // () => User -> função que retorna a entidade relacionada.
    // user => user.posts -> indica a propriedade em User que referencia os posts.
    // O TypeORM usa isso para criar a chave estrangeira automaticamente.
    @ManyToOne(() => User, user => user.posts)
    user: User;
}
```

---

## A camada Repository

A ideia do Repository é centralizar todo o acesso ao banco de uma entidade em um único arquivo. O Controller nunca chama `AppDataSource.getRepository(...)` diretamente: ele chama métodos do nosso próprio Repository, que por sua vez usa o repositório do TypeORM por baixo dos panos.

Isso traz vantagens:
- Se um dia você quiser trocar de ORM, ou adicionar cache, ou logar todas as queries, você mexe só aqui, e não em cada controller.
- Fica fácil testar o Repository separadamente do Controller.
- O Controller fica mais legível, porque só lida com o fluxo HTTP, não com detalhes de query.

Arquivo `src/repositories/UserRepository.ts`:

```ts
import { AppDataSource } from '../config/data-source';
import { User } from '../models/User';

// Pegamos o repositório padrão do TypeORM para a entidade User.
// Esse repositório já sabe fazer find, save, delete, etc, mas vamos
// "envelopar" ele em funções com nomes que fazem mais sentido para as
// regras do nosso projeto.
const repository = AppDataSource.getRepository(User);

export const UserRepository = {
    // Busca todos os usuários, incluindo os posts relacionados (JOIN).
    async findAll() {
        return repository.find({ relations: ['posts'] });
    },

    // Busca um único usuário pelo id, incluindo os posts relacionados.
    async findById(id: number) {
        return repository.findOne({
            where: { id },
            relations: ['posts'],
        });
    },

    // Busca um usuário pelo email, trazendo a senha também.
    // Usamos addSelect porque marcamos password com select: false na entidade,
    // então por padrão ela não vem. Esse método será usado para checar a
    // senha (por exemplo, em uma futura tela de login).
    async findByEmailWithPassword(email: string) {
        return repository
            .createQueryBuilder('user')
            .addSelect('user.password')
            .where('user.email = :email', { email })
            .getOne();
    },

    // Cria a instância do User em memória (ainda não salva no banco).
    // Mantemos esse passo separado do save() porque, em alguns casos,
    // o Controller pode precisar mexer no objeto antes de persistir.
    create(data: Partial<User>) {
        return repository.create(data);
    },

    // Salva (insere ou atualiza, dependendo se o objeto já tem id) no banco.
    async save(user: User) {
        return repository.save(user);
    },

    // Remove um usuário do banco pelo id.
    // delete retorna um objeto com informação sobre quantas linhas foram afetadas.
    async delete(id: number) {
        return repository.delete(id);
    },
};
```

Arquivo `src/repositories/PostRepository.ts`:

```ts
import { AppDataSource } from '../config/data-source';
import { Post } from '../models/Post';

const repository = AppDataSource.getRepository(Post);

export const PostRepository = {
    // Busca todos os posts, incluindo os dados do usuário dono de cada post.
    async findAll() {
        return repository.find({ relations: ['user'] });
    },

    async findById(id: number) {
        return repository.findOne({
            where: { id },
            relations: ['user'],
        });
    },

    create(data: Partial<Post>) {
        return repository.create(data);
    },

    async save(post: Post) {
        return repository.save(post);
    },

    async delete(id: number) {
        return repository.delete(id);
    },
};
```

Note que nos dois arquivos acima exportamos um objeto literal (`{ findAll, findById, ... }`) em vez de uma classe. Funciona de forma parecida com uma classe, mas é uma forma mais simples quando não precisamos guardar nenhum estado interno, só agrupar funções relacionadas.

---

## Middlewares

Um middleware, no Express, é uma função que recebe `req`, `res` e uma terceira coisa chamada `next`. Ele roda no meio do caminho entre a requisição chegar e o Controller ser executado (por isso o nome "middle" + "ware"). Um middleware pode:

- Olhar ou alterar a requisição antes dela chegar ao Controller.
- Interromper o fluxo e responder direto (por exemplo, se a validação falhar).
- Deixar a requisição seguir adiante, chamando `next()`.

### 1. asyncHandler - evitando repetir try/catch em todo controller

Funções `async` que tomam erro (uma Promise rejeitada) dentro de uma rota do Express não são capturadas automaticamente pelo Express. Se não tratarmos isso, um erro no banco pode travar a requisição sem nenhuma resposta para o cliente. A solução tradicional é colocar `try/catch` em cada método do Controller, mas isso repete muito código. Em vez disso, criamos um encapsulador:

Arquivo `src/middlewares/asyncHandler.ts`:

```ts
import { Request, Response, NextFunction, RequestHandler } from 'express';

// asyncHandler recebe uma função de controller (que é async, e pode rejeitar)
// e devolve uma nova função, que o Express consegue usar normalmente.
//
// O que ela faz: chama a função original dentro de um Promise.resolve(),
// e se der erro, em vez de deixar a aplicação quebrar, chama next(error).
// Isso entrega o erro para o middleware de tratamento de erros
// (errorHandler.ts), que veremos a seguir.
export function asyncHandler(fn: RequestHandler) {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
```

### 2. errorHandler - middleware central de tratamento de erros

No Express, um middleware de erro é reconhecido por ter quatro parâmetros (`err, req, res, next`), em vez dos três normais. Ele deve ser registrado por último, depois de todas as rotas, porque o Express só chama um middleware de erro quando algum `next(error)` é disparado em algum lugar antes dele.

Arquivo `src/middlewares/errorHandler.ts`:

```ts
import { Request, Response, NextFunction } from 'express';

// Esse middleware centraliza o tratamento de erros da aplicação inteira.
// Em vez de cada controller decidir como formatar uma resposta de erro,
// todo erro inesperado cai aqui, e respondemos de forma padronizada.
export function errorHandler(
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) {
    console.error('Erro capturado pelo errorHandler:', err);

    // Erro de violação de chave única do MySQL (ex: email duplicado).
    // O TypeORM repassa o código de erro original do driver do banco.
    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'Registro duplicado (email já existente).' });
    }

    return res.status(500).json({ message: 'Erro interno no servidor.' });
}
```

### 3. validateUser - validação de entrada antes do Controller

Em vez de o Controller checar se `name`, `email` e `password` vieram preenchidos, deixamos essa responsabilidade em um middleware específico, que roda antes da rota.

Arquivo `src/middlewares/validateUser.ts`:

```ts
import { Request, Response, NextFunction } from 'express';

// Middleware usado nas rotas de criação e atualização de usuário.
// Se algum campo obrigatório estiver faltando, respondemos com 400 (Bad Request)
// e NUNCA chamamos next(), ou seja, o Controller nem chega a ser executado.
export function validateUser(req: Request, res: Response, next: NextFunction) {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            message: 'Os campos name, email e password são obrigatórios.',
        });
    }

    if (password.length < 6) {
        return res.status(400).json({
            message: 'A senha deve ter pelo menos 6 caracteres.',
        });
    }

    // Tudo certo, deixa a requisição seguir para o Controller.
    next();
}
```

### 4. validatePost - validação de entrada para posts

Arquivo `src/middlewares/validatePost.ts`:

```ts
import { Request, Response, NextFunction } from 'express';

export function validatePost(req: Request, res: Response, next: NextFunction) {
    const { title, userId } = req.body;

    if (!title || !userId) {
        return res.status(400).json({
            message: 'Os campos title e userId são obrigatórios.',
        });
    }

    next();
}
```

---

## Entendendo o bcrypt

`bcrypt` é uma biblioteca de hashing especializada em senhas. Diferente de um hash comum (como MD5 ou SHA256 puro), o bcrypt é propositalmente "lento" e incorpora um "salt" (um valor aleatório) automaticamente em cada hash gerado, o que dificulta ataques de força bruta e de rainbow table.

Os dois métodos principais que vamos usar:

- `bcrypt.hash(senhaTextoPuro, saltRounds)`: gera o hash de uma senha. `saltRounds` é o "custo" do processamento (quanto maior, mais seguro e mais lento). Usaremos `10`, que é o padrão recomendado para a maioria dos casos.
- `bcrypt.compare(senhaTextoPuro, hashSalvo)`: compara uma senha em texto puro com um hash já salvo, retornando `true` ou `false`. Vamos deixar essa parte pronta no Repository (`findByEmailWithPassword`), mesmo sem ainda termos uma rota de login, porque ela será reaproveitada em uma futura aula de JWT.

---

## Controllers com CRUD completo

O Controller fica responsável apenas por: ler dados da requisição, chamar o Repository, e formatar a resposta. Toda a lógica de banco já está no Repository, e toda a validação de entrada já aconteceu no Middleware antes da requisição chegar aqui.

Arquivo `src/controllers/UserController.ts`:

```ts
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { UserRepository } from '../repositories/UserRepository';

export class UserController {
    // GET /users -> lista todos os usuários
    async list(req: Request, res: Response) {
        const users = await UserRepository.findAll();
        return res.json(users);
    }

    // GET /users/:id -> busca um usuário específico
    async getById(req: Request, res: Response) {
        const id = Number(req.params.id);
        const user = await UserRepository.findById(id);

        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        return res.json(user);
    }

    // POST /users -> cria um novo usuário
    async create(req: Request, res: Response) {
        const { name, email, password } = req.body;

        // Geramos o hash da senha ANTES de criar o objeto User.
        // 10 é o número de saltRounds: o "custo" computacional do hash.
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = UserRepository.create({
            name,
            email,
            password: hashedPassword,
        });

        const savedUser = await UserRepository.save(user);

        // Removemos a senha do objeto antes de devolver na resposta.
        // Mesmo o campo sendo select:false nas buscas normais, aqui o objeto
        // savedUser ainda está em memória com a senha (pois acabamos de criá-lo),
        // então apagamos manualmente antes de responder ao cliente.
        const { password: _, ...userWithoutPassword } = savedUser;

        return res.status(201).json(userWithoutPassword);
    }

    // PUT /users/:id -> atualiza um usuário existente
    async update(req: Request, res: Response) {
        const id = Number(req.params.id);
        const { name, email, password } = req.body;

        const user = await UserRepository.findById(id);

        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        // Atualizamos só os campos que vieram no corpo da requisição.
        if (name) user.name = name;
        if (email) user.email = email;

        // Se uma nova senha foi enviada, geramos um novo hash para ela.
        // Se não foi enviada, mantemos a senha antiga sem alteração.
        if (password) {
            user.password = await bcrypt.hash(password, 10);
        }

        const updatedUser = await UserRepository.save(user);

        const { password: _, ...userWithoutPassword } = updatedUser;

        return res.json(userWithoutPassword);
    }

    // DELETE /users/:id -> remove um usuário
    async delete(req: Request, res: Response) {
        const id = Number(req.params.id);

        const result = await UserRepository.delete(id);

        // affected indica quantas linhas foram removidas.
        // Se for 0, significa que não existia usuário com esse id.
        if (result.affected === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        // 204 (No Content) é o status correto para "deu certo, mas não tenho
        // nada para retornar no corpo da resposta".
        return res.status(204).send();
    }
}
```

Arquivo `src/controllers/PostController.ts`:

```ts
import { Request, Response } from 'express';
import { PostRepository } from '../repositories/PostRepository';
import { UserRepository } from '../repositories/UserRepository';

export class PostController {
    // GET /posts -> lista todos os posts, com o usuário dono de cada um
    async list(req: Request, res: Response) {
        const posts = await PostRepository.findAll();
        return res.json(posts);
    }

    // GET /posts/:id -> busca um post específico
    async getById(req: Request, res: Response) {
        const id = Number(req.params.id);
        const post = await PostRepository.findById(id);

        if (!post) {
            return res.status(404).json({ message: 'Post não encontrado.' });
        }

        return res.json(post);
    }

    // POST /posts -> cria um novo post vinculado a um usuário existente
    async create(req: Request, res: Response) {
        const { title, userId } = req.body;

        const user = await UserRepository.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        const post = PostRepository.create({ title, user });
        const savedPost = await PostRepository.save(post);

        return res.status(201).json(savedPost);
    }

    // PUT /posts/:id -> atualiza o título (e/ou o dono) de um post
    async update(req: Request, res: Response) {
        const id = Number(req.params.id);
        const { title, userId } = req.body;

        const post = await PostRepository.findById(id);

        if (!post) {
            return res.status(404).json({ message: 'Post não encontrado.' });
        }

        if (title) post.title = title;

        if (userId) {
            const user = await UserRepository.findById(userId);
            if (!user) {
                return res.status(404).json({ message: 'Usuário não encontrado.' });
            }
            post.user = user;
        }

        const updatedPost = await PostRepository.save(post);
        return res.json(updatedPost);
    }

    // DELETE /posts/:id -> remove um post
    async delete(req: Request, res: Response) {
        const id = Number(req.params.id);

        const result = await PostRepository.delete(id);

        if (result.affected === 0) {
            return res.status(404).json({ message: 'Post não encontrado.' });
        }

        return res.status(204).send();
    }
}
```

---

## Rotas

Aqui conectamos os middlewares de validação, o `asyncHandler`, e cada método do Controller à sua URL correspondente.

Arquivo `src/routes/index.ts`:

```ts
import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { PostController } from '../controllers/PostController';
import { validateUser } from '../middlewares/validateUser';
import { validatePost } from '../middlewares/validatePost';
import { asyncHandler } from '../middlewares/asyncHandler';

const routes = Router();
const userController = new UserController();
const postController = new PostController();

// Rotas de usuário.
// validateUser roda primeiro: se os dados estiverem inválidos, a requisição
// já é interrompida ali, sem nem chegar ao Controller.
// asyncHandler envolve o método do controller para capturar erros assíncronos.
routes.get('/users', asyncHandler(userController.list.bind(userController)));
routes.get('/users/:id', asyncHandler(userController.getById.bind(userController)));
routes.post('/users', validateUser, asyncHandler(userController.create.bind(userController)));
routes.put('/users/:id', asyncHandler(userController.update.bind(userController)));
routes.delete('/users/:id', asyncHandler(userController.delete.bind(userController)));

// Rotas de post.
routes.get('/posts', asyncHandler(postController.list.bind(postController)));
routes.get('/posts/:id', asyncHandler(postController.getById.bind(postController)));
routes.post('/posts', validatePost, asyncHandler(postController.create.bind(postController)));
routes.put('/posts/:id', asyncHandler(postController.update.bind(postController)));
routes.delete('/posts/:id', asyncHandler(postController.delete.bind(postController)));

export default routes;
```

Por que usamos `.bind(userController)`? Quando passamos `userController.list` como referência de função (sem chamar ela), o JavaScript perde o contexto de `this` dentro do método. Como nossos métodos não usam `this` internamente (eles dependem do `UserRepository`, importado direto no topo do arquivo), isso na prática não causaria erro no nosso caso atual, mas o `.bind()` é uma boa prática para garantir que `this` sempre aponte para a instância correta, caso algum método do Controller passe a depender de `this` no futuro.

---

## Servidor (`server.ts`)

O `errorHandler` precisa ser o último middleware registrado, depois das rotas, exatamente como explicado mais acima.

Arquivo `src/server.ts`:

```ts
import "reflect-metadata";
import express, { Application } from "express";
import router from "./routes";
import { AppDataSource } from "./config/data-source";
import { errorHandler } from "./middlewares/errorHandler";

const app: Application = express();
const PORTA: number = 3000;

app.use(express.json());

// .initialize() é um método do TypeORM que abre a conexão com o banco
// usando as configurações definidas em data-source.ts, carrega as
// entidades e executa a sincronização (criação das tabelas, já que
// synchronize: true está definido). É assíncrono, por isso retorna uma
// Promise: o que está dentro de .then() roda se der certo, e o que está
// dentro de .catch() roda se houver erro.
AppDataSource.initialize()
    .then(() => {
        console.log("Banco conectado com sucesso");

        app.use(router);

        // O errorHandler precisa ser o último app.use() da cadeia.
        // O Express só identifica esse middleware como "tratador de erro"
        // porque ele tem 4 parâmetros (err, req, res, next), e só o chama
        // quando algum next(error) é disparado em algum middleware ou rota
        // anterior (é exatamente isso que o asyncHandler faz quando captura
        // uma falha).
        app.use(errorHandler);

        app.listen(PORTA, () => {
            console.log(`Servidor rodando na porta ${PORTA}`);
        });
    })
    .catch((err) => console.error("Erro ao conectar no banco:", err));
```

---

## Resumo do fluxo completo de uma requisição

Para fixar, vamos seguir o caminho de um `POST /users` do início ao fim:

1. A requisição chega na rota `POST /users`.
2. O middleware `validateUser` roda primeiro. Se faltar algum campo, a requisição já é respondida com erro 400 e para por aqui.
3. Se passou na validação, o `asyncHandler` chama o método `create` do `UserController`.
4. O `UserController.create` lê `name`, `email` e `password` do `req.body`, gera o hash da senha com `bcrypt.hash`, e chama `UserRepository.create` e `UserRepository.save`.
5. O `UserRepository` é o único lugar que efetivamente conversa com o `AppDataSource` e executa a query no MySQL através do TypeORM.
6. O resultado volta para o Controller, que remove a senha do objeto e responde ao cliente com status 201.
7. Se em qualquer um desses passos der um erro inesperado (ex: queda de conexão com o banco), o `asyncHandler` captura esse erro e repassa para o `errorHandler`, que formata uma resposta de erro padronizada.

---

## Exercícios práticos

1. Crie a entidade `Category`, com pelo menos os campos `id` (PK, auto-incremento) e `name` (string).
2. Crie a entidade `Product`, com os campos `id` (PK, auto-incremento), `name` (string), `price` (número) e `category` (referência para `Category`, relação ManyToOne).
3. Configure o relacionamento entre `Category` e `Product`: uma categoria pode ter muitos produtos, e um produto pertence a uma única categoria.
4. Crie a `CategoryRepository` e a `ProductRepository`, seguindo o mesmo padrão usado em `UserRepository` e `PostRepository`.
5. Crie o `CategoryController` e o `ProductController` com CRUD completo (list, getById, create, update, delete), usando os repositories do exercício anterior. A rota `GET /products` deve incluir os dados da categoria associada usando `relations`.
6. Crie os middlewares `validateCategory` e `validateProduct`, seguindo o mesmo padrão de `validateUser` e `validatePost`.
7. Registre todas as novas rotas em `src/routes/index.ts`, sempre envolvendo os controllers com `asyncHandler`.
8. (Desafio) No `UserRepository`, crie um método `existsByEmail(email: string)` que retorna `true` ou `false`, e use ele dentro do middleware `validateUser` para impedir a criação de um usuário com um email já cadastrado, respondendo com status 409 nesse caso, sem precisar esperar o erro chegar até o `errorHandler`.

---

## Resumo geral

- ORM converte objetos/classes em tabelas; o TypeORM usa decorators para fazer esse mapeamento.
- A arquitetura segue MVC sem View, com uma camada extra de Repository: Rota -> Middleware -> Controller -> Repository -> Banco.
- A camada Repository isola todo o acesso ao banco em um único lugar por entidade, deixando os Controllers mais simples e focados só no fluxo HTTP.
- Middlewares tiram responsabilidades repetidas (validação, tratamento de erro) de dentro dos Controllers.
- `asyncHandler` evita que erros em funções `async` derrubem a requisição sem resposta para o cliente.
- `errorHandler` centraliza o tratamento de erros, sempre registrado por último na cadeia de middlewares.
- `bcrypt.hash` transforma a senha em um hash seguro antes de salvar no banco; a senha original nunca é armazenada.
- O campo `password` na entidade `User` usa `select: false` para não vazar acidentalmente em buscas normais, e é removido manualmente das respostas onde ainda aparece em memória.
