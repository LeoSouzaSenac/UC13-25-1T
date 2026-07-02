# Aula - API REST com TypeORM, Services, Repositories e Middlewares (MVC sem View)

## Objetivos da aula

- Entender o que é um ORM e como o TypeORM facilita o trabalho com banco de dados.
- Criar entidades e mapear para tabelas usando decorators.
- Implementar relacionamentos (One-to-Many, Many-to-One) no TypeORM.
- Entender por que separar o acesso ao banco em uma camada própria de Repository, além do Controller.
- Entender por que existe também uma camada de Service entre o Controller e o Repository, e o que ela concentra.
- Implementar o CRUD completo (Create, Read, Update, Delete) para `User` e `Post`.
- Criar middlewares simples de validação e de tratamento de erros.
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

O projeto vai seguir um padrão MVC sem View, com duas camadas extras entre a Rota e o banco de dados: Service e Repository.

```
Rota -> Middleware -> Controller -> Service -> Repository -> Banco de Dados
```

Cada seta representa uma responsabilidade diferente, e cada camada só conhece a camada imediatamente abaixo dela. O Controller não fala diretamente com o Repository, ele sempre passa pelo Service.

### Responsabilidade de cada camada

- **Model (Entidade)**: descreve a estrutura dos dados e como eles se relacionam entre si. Não tem lógica de negócio, é só a "planta" da tabela.
- **Repository**: é o único lugar do projeto que conversa diretamente com o `AppDataSource` e com os métodos do TypeORM (`find`, `save`, `delete`, etc). Concentra todas as queries relacionadas a uma entidade, sem saber nada sobre regras de negócio.
- **Service**: concentra a lógica de negócio da aplicação. É aqui que vivem regras como "a senha precisa ser transformada em hash antes de salvar", "não pode existir dois usuários com o mesmo email", "se o usuário não existir, lance um erro". O Service chama um ou mais Repositories para buscar ou persistir dados, mas nunca fala diretamente com `req` e `res` (ele não sabe que existe um HTTP por trás de quem o chamou). Isso permite, por exemplo, reaproveitar a mesma regra de negócio em outro lugar (um script, uma fila, um teste) sem depender do Express.
- **Middleware**: funções que rodam antes (ou depois) do controller, para validar dados, tratar erros, checar permissões, etc. Servem para tirar responsabilidades repetidas de dentro dos controllers.
- **Controller**: recebe a requisição HTTP, extrai os dados necessários (`req.body`, `req.params`), chama o Service para executar a operação, e devolve uma resposta HTTP (`res.json`, `res.status`). Não deveria conter lógica de acesso a banco, nem lógica de negócio, nem validação pesada: ele só traduz HTTP para uma chamada de Service, e o resultado do Service de volta para HTTP.
- **Routes**: apenas conecta uma URL + método HTTP (GET, POST, PUT, DELETE) a um método do Controller. Não tem lógica nenhuma, só encaminhamento.

Resumindo a diferença entre Service e Repository, que costuma gerar dúvida: o Repository sabe **como buscar/salvar dados** (a query); o Service sabe **o que fazer com esses dados** (a regra de negócio). Um exemplo prático: gerar o hash da senha com bcrypt é uma regra de negócio (vai para o Service); executar o `INSERT` no banco é acesso a dado (vai para o Repository).

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
 |- services/
 |   |- UserService.ts
 |   |- PostService.ts
 |- middlewares/
 |   |- errorHandler.ts
 |   |- validateUser.ts
 |   |- validatePost.ts
 |- controllers/
 |   |- UserController.ts
 |   |- PostController.ts
 |- routes/
 |   |- index.ts
 |- utils/
 |   |- omitPassword.ts
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
import { AppDataSource } from "../config/data-source";
import { User } from "../models/User";

// Um repository (repositório) é um objeto do TypeORM que contém todas as
// funções que precisamos para trabalhar com o banco, ligado a uma entidade
// específica (nesse caso, User).
const repo = AppDataSource.getRepository(User);

export const UserRepository = {
    // Aqui vamos criar os métodos que fazem o CRUD de usuário.

    // Busca todos os usuários.
    async findAll() {
        // o método find() vem do TypeORM. Ele procura algo em uma tabela,
        // e aceita como parâmetro um objeto com opções para essa busca.
        // Nesse caso, estamos buscando também os posts relacionados com
        // este usuário: quando buscarmos os usuários, o que inclui o
        // 'Joãozinho', o servidor também vai retornar no JSON todos os
        // posts dele, incluindo a vez em que ele xingou sua tia.
        return repo.find({ relations: ['posts'] });
    },

    async findById(id: number) {
        return repo.findOne({ where: { id }, relations: ['posts'] });
    },

    async create(data: { name: string; email: string; password: string }) {
        // cria o usuário (só em memória, ainda não vai pro banco)
        const user = repo.create(data);
        // salva ele no banco
        return repo.save(user);
    },

    // save recebe um User já existente (com id) e apenas grava as alterações.
    // Quem decide o que mudou é o Service — o Repository só salva.
    async save(user: User) {
        return repo.save(user);
    },

    // delete retorna um objeto com informação sobre quantas linhas foram
    // afetadas (result.affected), que o Service usa pra saber se realmente
    // existia um usuário com esse id.
    async delete(id: number) {
        return repo.delete(id);
    },
};
```

> Aqui o `create` já faz o `create` + `save` num único método. É mais
> direto: quem chama não precisa se preocupar com dois passos separados, só
> passa os dados e recebe o usuário já salvo (com `id` preenchido) de volta.
> Já para `update`, reaproveitamos o `findById` que já existe, alteramos o
> objeto e chamamos `save` — por isso não precisamos de um método `update`
> separado no Repository.

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

Note que em `PostRepository` mantemos `create` e `save` separados (diferente do `UserRepository` acima). Os dois jeitos são válidos — o importante é que, dentro do mesmo arquivo, o padrão seja consistente.

---

## A camada Service

O Repository sabe buscar e salvar dados, mas não sabe nada sobre regras de negócio. Se colocássemos a geração do hash de senha, ou a checagem de "esse usuário existe?", direto no Controller, voltaríamos ao mesmo problema do início da aula: o Controller acumulando responsabilidades demais.

A camada Service existe exatamente para isso: ela fica entre o Controller e o Repository, e concentra toda a lógica de negócio da aplicação. O Controller chama o Service, o Service decide as regras e chama o Repository quando precisa ler ou gravar algo no banco.

Algumas regras que pertencem ao Service (e não ao Controller nem ao Repository):
- Gerar o hash da senha com bcrypt antes de salvar um usuário.
- Verificar se o usuário existe antes de tentar atualizar ou deletar, e lançar um erro caso não exista.
- Verificar se o usuário dono de um post existe antes de criar o post.
- Qualquer decisão de negócio que não seja "ler/escrever no banco" nem "lidar com req/res".

Repare que o Service, diferente do Controller, não recebe `req` e `res`: ele recebe e retorna apenas dados simples (strings, números, objetos das entidades). Isso é proposital, porque o Service não deveria saber que está sendo chamado a partir de uma requisição HTTP.

Quando uma regra de negócio falha (por exemplo, "usuário não encontrado"), o Service lança um erro (`throw`) em vez de montar uma resposta HTTP. Quem decide o status code e o formato da resposta é sempre o Controller (com try/catch) ou, em caso de erro inesperado, o `errorHandler`.

Arquivo `src/services/UserService.ts`:

```ts
import { UserRepository } from "../repositories/UserRepository"
import bcrypt from 'bcrypt';
import { omitPassword } from "../utils/omitPassword";

// A camada Service é responsável por chamar os métodos de Repository e
// cuidar das validações das nossas regras de negócio (ex: um usuário
// precisa ter email válido, etc).

// Aqui estamos criando uma classe de erro que estende a classe Error.
// Isso permite que, mais tarde, o Controller identifique o tipo de erro
// de uma forma mais clara.
export class NotFoundError extends Error {}

export const UserService = {

    // Como para listar não precisamos validar nada, aqui só chamamos o
    // método do Repository mesmo, pois o Controller NÃO PODE se comunicar
    // diretamente com Repository, e sim com Service.
    async listAll() {
        return UserRepository.findAll();
    },

    async getById(id: number) {
        const user = await UserRepository.findById(id);

        // Aqui vai nossa primeira validação: se não encontramos um user
        // com esse id, ele não existe. Se não existe, lançamos um erro.
        if (!user) {
            throw new NotFoundError('Usuário não encontrado!');
        }

        // Se encontrou, não cai no 'if' ali em cima, então podemos usar o
        // return e retornar o user.
        return user;
    },

    async create(data: { name: string; email: string; password: string }) {
        // Este método gera uma senha criptografada.
        const hashedPassword = await bcrypt.hash(data.password, 10);

        // isso gera um objeto que é mais ou menos assim:
        /*
            const user = {
                name: "Joãozin da Quebrada",
                email: "joazinqbd@gmail.com",
                password: "$2A7806m.jfheui.97566"
            }
        */
        const user = await UserRepository.create({
            name: data.name,
            email: data.email,
            password: hashedPassword,
        });

        return omitPassword(user);
    },

    // Atualiza um usuário existente.
    async update(
        id: number,
        data: { name?: string; email?: string; password?: string }
    ) {
        // Reaproveitamos o getById daqui de cima: ele já busca o usuário
        // e já lança NotFoundError se não existir, então não precisamos
        // repetir essa checagem aqui.
        const user = await UserRepository.findById(id);

        if (!user) {
            throw new NotFoundError('Usuário não encontrado!');
        }

        // Só alteramos os campos que realmente vieram preenchidos.
        // Assim, dá pra atualizar só o nome, por exemplo, sem precisar
        // reenviar email e senha.
        if (data.name) user.name = data.name;
        if (data.email) user.email = data.email;

        // Se veio uma senha nova, geramos um novo hash pra ela.
        // Se não veio, mantemos a senha antiga sem alteração.
        if (data.password) {
            user.password = await bcrypt.hash(data.password, 10);
        }

        const updatedUser = await UserRepository.save(user);

        return omitPassword(updatedUser);
    },

    // Remove um usuário. Se o id não existir, result.affected vai ser 0,
    // e é assim que sabemos que não tinha nada pra deletar.
    async delete(id: number) {
        const result = await UserRepository.delete(id);

        if (result.affected === 0) {
            throw new NotFoundError('Usuário não encontrado!');
        }
    },
};
```

Arquivo `src/utils/omitPassword.ts`:

```ts
// Esta função serve para remover o campo de senha (password) de um objeto User.
// Isso vai fazer com que, quando chamarmos ela em Services, ele envie ao
// banco o usuário normal (completo) mas envie para o Controller um usuário
// que não tem senha, assim o JSON de resposta não contém a senha do usuário.
import { User } from "../models/User";

export function omitPassword(user: User) {
    // copiamos o valor da senha do user para a variável password
    // aí, o resto (id, name, email) fica dentro da variável rest
    // e é ela que retornamos
    const { password, ...rest } = user;
    return rest;
}
```

Arquivo `src/services/PostService.ts`:

```ts
import { PostRepository } from '../repositories/PostRepository';
import { UserRepository } from '../repositories/UserRepository';
import { NotFoundError } from './UserService';

export const PostService = {
    async listAll() {
        return PostRepository.findAll();
    },

    async getById(id: number) {
        const post = await PostRepository.findById(id);

        if (!post) {
            throw new NotFoundError('Post não encontrado.');
        }

        return post;
    },

    // Cria um post, mas antes verifica se o usuário dono dele realmente existe.
    // Essa verificação é uma regra de negócio, por isso vive aqui, e não no
    // Controller nem no Repository.
    async create(data: { title: string; userId: number }) {
        const user = await UserRepository.findById(data.userId);

        if (!user) {
            throw new NotFoundError('Usuário não encontrado.');
        }

        const post = PostRepository.create({ title: data.title, user });
        return PostRepository.save(post);
    },

    async update(id: number, data: { title?: string; userId?: number }) {
        const post = await PostRepository.findById(id);

        if (!post) {
            throw new NotFoundError('Post não encontrado.');
        }

        if (data.title) post.title = data.title;

        if (data.userId) {
            const user = await UserRepository.findById(data.userId);
            if (!user) {
                throw new NotFoundError('Usuário não encontrado.');
            }
            post.user = user;
        }

        return PostRepository.save(post);
    },

    async delete(id: number) {
        const result = await PostRepository.delete(id);

        if (result.affected === 0) {
            throw new NotFoundError('Post não encontrado.');
        }
    },
};
```

Como o `NotFoundError` é lançado dentro do Service (e não respondido diretamente como JSON), precisamos que o Controller saiba reconhecer esse tipo de erro e repassá-lo para o `errorHandler`. É isso que o `try/catch` + `next(error)` fazem, como veremos nos Controllers mais abaixo.

---

## Middlewares

Um middleware, no Express, é uma função que roda **no meio do caminho** entre a requisição chegar no servidor e o Controller ser executado (por isso o nome: "middle" + "ware"). Ele recebe `req`, `res` e uma terceira coisa chamada `next`.

Ele pode fazer duas coisas:
- Interromper a requisição e responder direto (ex: "faltou um campo, erro 400").
- Deixar a requisição seguir adiante, chamando `next()`.

Nessa aula vamos usar só dois tipos de middleware: um para **validar dados** e um para **tratar erros**.

### 1. validateUser — validando os dados antes do Controller

Em vez do Controller ficar checando se `name`, `email` e `password` vieram preenchidos, colocamos essa checagem em um middleware, que roda antes da rota chamar o Controller.

Arquivo `src/middlewares/validateUser.ts`:

```ts
import { Request, Response, NextFunction } from 'express';

// Esse middleware roda antes de criar ou atualizar um usuário.
// Se faltar algum campo obrigatório, respondemos com 400 (Bad Request)
// e NUNCA chamamos next() — ou seja, o Controller nem chega a ser executado.
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

    // Passou em tudo, então deixamos a requisição seguir para o Controller.
    next();
}
```

### 2. validatePost — mesma ideia, para posts

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

Repare que os dois seguem exatamente o mesmo formato: pega os campos do `req.body`, confere se está tudo certo, e ou responde com erro (sem chamar `next()`) ou deixa passar (chamando `next()`).

### 3. errorHandler — o único lugar que decide como um erro vira resposta

Esse é o middleware mais importante da aula. A ideia dele é simples: em vez de cada Controller decidir sozinho como formatar uma resposta de erro, todo erro da aplicação cai aqui, e é só esse arquivo que decide o status code e a mensagem.

No Express, um middleware é reconhecido como "tratador de erro" quando tem **4 parâmetros** (`err, req, res, next`), em vez dos 3 normais. Ele precisa ser registrado por **último**, depois de todas as rotas — o Express só chama ele quando alguém chama `next(erro)` em algum lugar antes.

Arquivo `src/middlewares/errorHandler.ts`:

```ts
import { Request, Response, NextFunction } from 'express';
import { NotFoundError } from '../services/UserService';

export function errorHandler(
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) {
    // Sempre bom logar o erro real no terminal, pra facilitar o debug.
    console.error('Erro capturado pelo errorHandler:', err);

    // Se foi um NotFoundError (lançado lá no Service), sabemos que é
    // "usuário/post não encontrado", então respondemos 404.
    if (err instanceof NotFoundError) {
        return res.status(404).json({ message: err.message });
    }

    // Esse código de erro é específico do MySQL: ele acontece quando
    // tentamos salvar algo que quebra uma regra de "unique" (ex: dois
    // usuários com o mesmo email).
    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'Registro duplicado (email já existente).' });
    }

    // Qualquer outro erro que a gente não previu vira um 500 genérico.
    return res.status(500).json({ message: 'Erro interno no servidor.' });
}
```

> Repare que não usamos nenhum middleware extra para lidar com erros
> assíncronos: cada método do Controller usa `try/catch` diretamente, o que
> deixa bem visível o que acontece quando algo dá errado.

---

## Entendendo o bcrypt

`bcrypt` é uma biblioteca de hashing especializada em senhas. Diferente de um hash comum (como MD5 ou SHA256 puro), o bcrypt é propositalmente "lento" e incorpora um "salt" (um valor aleatório) automaticamente em cada hash gerado, o que dificulta ataques de força bruta e de rainbow table.

Os dois métodos principais que vamos usar:

- `bcrypt.hash(senhaTextoPuro, saltRounds)`: gera o hash de uma senha. `saltRounds` é o "custo" do processamento (quanto maior, mais seguro e mais lento). Usaremos `10`, que é o padrão recomendado para a maioria dos casos.
- `bcrypt.compare(senhaTextoPuro, hashSalvo)`: compara uma senha em texto puro com um hash já salvo, retornando `true` ou `false`. Vamos usar esse método numa futura aula de login/JWT.

---

## Controllers

O Controller fica responsável apenas por: ler dados da requisição, chamar o Service, e formatar a resposta — usando `try/catch` para capturar qualquer erro e repassar pro `errorHandler` através de `next(error)`.

Arquivo `src/controllers/UserController.ts`:

```ts
import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/UserService';

export class UserController {
    // GET /users -> lista todos os usuários
    async list(req: Request, res: Response, next: NextFunction) {
        try {
            const users = await UserService.listAll();
            return res.json(users);
        } catch (error) {
            // next(error) joga o erro pro errorHandler, que decide o
            // status e a mensagem certa.
            next(error);
        }
    }

    // GET /users/:id -> busca um usuário específico
    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Number(req.params.id);
            const user = await UserService.getById(id);
            return res.json(user);
        } catch (error) {
            next(error);
        }
    }

    // POST /users -> cria um novo usuário
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const { name, email, password } = req.body;
            const user = await UserService.create({ name, email, password });
            return res.status(201).json(user);
        } catch (error) {
            next(error);
        }
    }

    // PUT /users/:id -> atualiza um usuário existente
    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Number(req.params.id);
            const { name, email, password } = req.body;
            const user = await UserService.update(id, { name, email, password });
            return res.json(user);
        } catch (error) {
            next(error);
        }
    }

    // DELETE /users/:id -> remove um usuário
    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Number(req.params.id);
            await UserService.delete(id);

            // 204 (No Content) é o status correto para "deu certo, mas não
            // tenho nada para retornar no corpo da resposta".
            return res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
}
```

Arquivo `src/controllers/PostController.ts`:

```ts
import { Request, Response, NextFunction } from 'express';
import { PostService } from '../services/PostService';

export class PostController {
    async list(req: Request, res: Response, next: NextFunction) {
        try {
            const posts = await PostService.listAll();
            return res.json(posts);
        } catch (error) {
            next(error);
        }
    }

    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Number(req.params.id);
            const post = await PostService.getById(id);
            return res.json(post);
        } catch (error) {
            next(error);
        }
    }

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const { title, userId } = req.body;
            const post = await PostService.create({ title, userId });
            return res.status(201).json(post);
        } catch (error) {
            next(error);
        }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Number(req.params.id);
            const { title, userId } = req.body;
            const post = await PostService.update(id, { title, userId });
            return res.json(post);
        } catch (error) {
            next(error);
        }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Number(req.params.id);
            await PostService.delete(id);
            return res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
}
```

---

## Rotas

Arquivo `src/routes/index.ts`:

```ts
import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { PostController } from '../controllers/PostController';
import { validateUser } from '../middlewares/validateUser';
import { validatePost } from '../middlewares/validatePost';

const routes = Router();
const userController = new UserController();
const postController = new PostController();

// Rotas de usuário.
// validateUser roda primeiro: se os dados estiverem inválidos, a requisição
// já é interrompida ali, sem nem chegar ao Controller.
// .bind(userController) garante que o "this" dentro do método continue
// apontando pra instância certa quando o Express chamar essa função.
routes.get('/users', userController.list.bind(userController));
routes.get('/users/:id', userController.getById.bind(userController));
routes.post('/users', validateUser, userController.create.bind(userController));
routes.put('/users/:id', userController.update.bind(userController));
routes.delete('/users/:id', userController.delete.bind(userController));

// Rotas de post.
routes.get('/posts', postController.list.bind(postController));
routes.get('/posts/:id', postController.getById.bind(postController));
routes.post('/posts', validatePost, postController.create.bind(postController));
routes.put('/posts/:id', postController.update.bind(postController));
routes.delete('/posts/:id', postController.delete.bind(postController));

export default routes;
```

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
        // quando algum next(error) é disparado em algum middleware, rota
        // ou controller anterior.
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
3. Se passou na validação, o Express chama o método `create` do `UserController`.
4. O `UserController.create` lê `name`, `email` e `password` do `req.body`, dentro de um `try`, e chama `UserService.create`, passando esses dados adiante.
5. O `UserService.create` aplica a regra de negócio: gera o hash da senha com `bcrypt.hash`, chama `UserRepository.create` (que já cria e salva), e usa `omitPassword` pra remover a senha do objeto antes de devolver o resultado.
6. O `UserRepository` é o único lugar que efetivamente conversa com o `AppDataSource` e executa a query no MySQL através do TypeORM.
7. O resultado sobe de volta: Repository -> Service -> Controller, que responde ao cliente com status 201.
8. Se em qualquer um desses passos der um erro (seja um `NotFoundError` lançado por um Service, seja um erro inesperado como queda de conexão com o banco), o `catch` do Controller chama `next(error)`, que joga o erro pro `errorHandler`, formatando uma resposta de erro padronizada.

---

## Exercícios práticos

1. Crie a entidade `Category`, com pelo menos os campos `id` (PK, auto-incremento) e `name` (string).
2. Crie a entidade `Product`, com os campos `id` (PK, auto-incremento), `name` (string), `price` (número) e `category` (referência para `Category`, relação ManyToOne).
3. Configure o relacionamento entre `Category` e `Product`: uma categoria pode ter muitos produtos, e um produto pertence a uma única categoria.
4. Crie a `CategoryRepository` e a `ProductRepository`, seguindo o mesmo padrão usado em `UserRepository`/`PostRepository`.
5. Crie o `CategoryService` e o `ProductService`, seguindo o mesmo padrão usado em `UserService`/`PostService` (incluindo o uso de `NotFoundError` quando um registro não existir).
6. Crie o `CategoryController` e o `ProductController` com CRUD completo (list, getById, create, update, delete), chamando sempre o Service correspondente, nunca o Repository diretamente. A rota `GET /products` deve incluir os dados da categoria associada usando `relations`.
7. Crie os middlewares `validateCategory` e `validateProduct`, seguindo o mesmo padrão de `validateUser`/`validatePost`.
8. Registre todas as novas rotas em `src/routes/index.ts`.
9. (Desafio) No `UserService`, crie um método `existsByEmail(email: string)` que use o `UserRepository` e retorne `true` ou `false`, e use esse método dentro de `UserService.create` para lançar um erro próprio (ex: `ConflictError`) quando o email já estiver cadastrado, antes mesmo de tentar gerar o hash da senha.
10. (Desafio, avançado) Depois de fazer os exercícios acima e sentir a repetição do `try/catch` em todo método, pesquisem sobre o padrão `asyncHandler` (uma função de ordem superior que embrulha o Controller e captura o erro automaticamente) e refatorem os Controllers pra usar ele.

---

## Resumo geral

- ORM converte objetos/classes em tabelas; o TypeORM usa decorators para fazer esse mapeamento.
- A arquitetura segue MVC sem View, com duas camadas extras: Rota -> Middleware -> Controller -> Service -> Repository -> Banco.
- A camada Repository isola todo o acesso ao banco em um único lugar por entidade, sem saber nada de regras de negócio.
- A camada Service concentra a lógica de negócio (hash de senha, checagens de existência, regras de validação mais complexas), chamando um ou mais Repositories e nunca lidando diretamente com `req`/`res`.
- O Controller fica enxuto: só traduz HTTP em chamada de Service e o retorno do Service de volta em resposta HTTP, usando `try/catch` para capturar erros e repassá-los com `next(error)`.
- Middlewares tiram responsabilidades repetidas (validação, tratamento de erro) de dentro dos Controllers.
- `errorHandler` centraliza o tratamento de erros, inclusive os erros de negócio lançados pelos Services (como `NotFoundError`), e é sempre registrado por último na cadeia de middlewares.
- `bcrypt.hash` transforma a senha em um hash seguro antes de salvar no banco; a senha original nunca é armazenada, e essa lógica vive no Service, não no Controller.
- O campo `password` na entidade `User` usa `select: false` para não vazar acidentalmente em buscas normais, e é removido manualmente das respostas através da função utilitária `omitPassword`.
