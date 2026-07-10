# Como criar um backend do zero

1 - Iniciar digitando no terminal 'npm init -y' para criar o package.json com as informações do nosso projeto. Ele é importante pois, entre outras coisas, grava quais dependências (bibliotecas, etc) nós precisamos instalar para o projeto funcionar.

2 - O próximo passo é instalar as dependências necessárias. Para o nosso backend vamos instalar estas:

```bash
npm install express typeorm reflect-metadata mysql2 dotenv bcrypt
npm install -D typescript @types/node @types/express ts-node-dev @types/bcrypt
```

3 - O próximo passo é criar o `tsconfig.json` através do comando`:

```bash
npx tsc --init
```
Isso vai criar o arquivo, mas precisamos editá-lo. Duas das opções que precisamos inserir nele nós encontramos na documentação do TypeOrm (`https://typeorm.io/docs/getting-started/#typescript-configuration`).
Ele deve ficar mais ou menos assim:

```json
{

  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "module": "nodenext",
    "target": "esnext",
    "strict": true,
    "skipLibCheck": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "strictPropertyInitialization": false
  },
  "include": ["./src"],
  "exclude": ["./node_modules", "./dist"]
}
```

4 - Agora, vamos criar a pasta `src` e todas as outras dentro dela:
```bash
mkdir src && cd src && mkdir config model repositories services controllers middlewares utils routes && touch server.ts
```

5 - Vamos criar também o arquivo `.env` para salvar as informações sensíveis do nosso projeto e que não devem ir para o github. Também vamos criar o `.gitignore` para configurar o que vai e o que não vai para o repositório remoto. Os dois ficam na pasta raiz (antes de `src`):

```bash
touch .env .gitignore
```
Informações que vamos por no `.env`:
```bash
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PWD=root
DB_NAME=rede_social
```

Informações que vamos por no `.gitignore`:
```bash
node_modules
.env
```

6 - Dentro da pasta `config` vamos criar o arquivo `data-source.ts`. Este arquivo vai ser responsável pela conexão com o nosso banco de dados. A primeira coisa que precisamos fazer é ir até este link da documentação do typeorm `https://typeorm.io/docs/getting-started#creating-a-new-datasource`. Lá, vamos encontrar um exemplo de como criar o nosso DataSource:

```ts
const AppDataSource = new DataSource({
    type: "postgres", // tipo do banco (nós usamos o 'mysql')
    host: "localhost", // onde o banco está
    port: 5432, // qual a porta do banco
    username: "root", // o usuário para entrar no banco
    password: "admin", // a senha para entrar no banco
    database: "test", // o nome do banco
    entities: [Photo], // as entidades/models que vão dar origem às nossas tabelas
    synchronize: true, // cria as tabelas do banco quando rodamos o código
    logging: false, // mostra (ou não, se tiver 'false') os comandos SQL no terminal
})
```

Nós precisamos trocar as informações do exemplo do DataSource para as nossas. Algumas destas informações estão no `.env`. Para podermos pegar as variáveis de lá, precisamos fazer o seguinte:

    1 - Importar no início do arquivo:

    ```ts
        import * as dotenv from 'dotenv'
    ```
    2 - Carregar as variáveis do .env para process.env:

    ```ts
        dotenv.config() // sem ele, não vamos conseguir carregar nada
    ```

    3 - Ai sim, nós criamos as variáveis que vão receber os valores de dentro do process.env:

    ```ts
    const {DB_HOST,DB_PORT,DB_USER,DB_PWD,DB_NAME} = process.env // os nomes DEVEM SER OS MESMOS que usamos dentro do .env e NA MESMA ORDEM
    ```

    4 - Agora, vamos utilizar as variáveis do .env dentro do AppDataSource, para ele ficar assim:

    ```ts
    // NÃO PODEMOS NOS ESQUECER DE EXPORTAR O AppDataSource para podermos usá-lo em outros arquivos
    export const AppDataSource = new DataSource({
    type: "mysql", 
    host: DB_HOST,
    port: Number(DB_PORT), // passamos porta para Number através do método Number(DB_PORT) pois ele vem do .env como string ("3306") mas precisamos que seja um number(3306)
    username: DB_USER,
    password: DB_PWD,
    database: DB_NAME,
    entities: [], // deixamos vazio por enquanto porque não criamos as models ainda
    synchronize: true,
    logging: false,
})
    ```


7 - Agora, vamos para a camada Model, onde precisamos criar o arquivo `User.ts`. Ele vai representar uma tabela do nosso banco. Podemos usar a documentação do TypeOrm sobre como criar uma entidade clicando neste link: `https://typeorm.io/docs/getting-started#adding-table-columns`. O exemplo vem assim (vamos usar ele para nos orientar mas não vamos copiar e colar):

```ts
import { Entity, Column } from "typeorm"

@Entity()
export class Photo {
    @Column()
    id: number

    @Column()
    name: string

    @Column()
    description: string

    @Column()
    filename: string

    @Column()
    views: number

    @Column()
    isPublished: boolean
}
```

7.1 - Com base neste exemplo, vamos montar a nossa model, `User.ts`:

```ts 

    import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm'
    import { Post } from "./Post"
    // Marca a classe como uma entidade, ou seja, vai virar uma tabela no banco
    // Se colocarmos uma string dentro dos parênteses, podemos dar um nome específico a essa tabela
    // Se deixarmos vazio, a tabela tem o mesmo nome da classe, só que minúsculo
    @Entity() 
    export class User {

        // marca o atributo como uma coluna com CHAVE PRIMÁRIA e AUTO-INCREMENTO
        @PrimaryGeneratedColumn()
        id:number

        // marca o atributo como uma coluna comum
        // dentro dos parênteses, podemos passar um objeto, ou seja, ENTRE CHAVES {},
        // que contém opções para esta coluna, como: 
          /*
            - type: tipo da coluna no banco (varchar, int, boolean, etc)
            - length: tamanho máximo da coluna, quantos caracteres ou números podem ir nela
            - nullable: permite ou não valores nulos na coluna
            - unique: impede valores repetidos
            - default: permite por um valor padrão nesta coluna (se não colocar um valor ao criar um novo registro, aquela coluna tem um valor pré-definido)
          */  
        @Column({length: 100})
        name:string

        @Column({length:150, unique:true})
        email:string

        @Column()
        password:string

        // Relação:
        // aqui indicamos as relações de User com outra tabela, Post.
        // Um usuário pode ter muitos posts, por isso, @OneToMany()
        // Dentro dos parênteses, colocamos:
        // 1 -> Uma arrow function que retorna qual entidade User se relaciona
        // 2 -> Indica qual o atributo dentro da classe/entidade Post que liga com User
        // Assim, o TypeORM entende como criar as chaves estrangeiras que ligam uma tabela na outra
        @OneToMany(() => Post, post => post.user)
        posts: Post[]
    }
```

7.2 - Criamos a entidade User, agora precisamos criar a entidade Posts. Crie o arquivo `Post.ts`:

```ts
        import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm'
        import { User } from "./User"

        @Entity()
        export class Post {
            @PrimaryGeneratedColumn()
            id:number

            @Column()
            title:string
            // como User tem OneToMany, Post precisa ter o contrário, ManyToOne
            @ManyToOne(() => User, user => user.posts)
            user:User    

        }

```

8 - Agora que finalizamos as models, podemos partir para o próximo passo, que é na camada `repositories`. Crie o arquivo `UserRepository.ts`. Dentro desta camada, nós temos os méotodos que trabalham diretamente com o banco.

8.1 - Primeiro fazemos as importações e criamos o repositório do User. O repositório é um objeto do typeorm que contém todas os métodos para ler, criar, atualizar, deletar um usuário:

```ts
    import { AppDataSource } from "../config/data-source";
    import { User } from "../models/User";

    const repo = AppDataSource.getRepository(User) // cria o repositório do user. Agora ele sabe com que tabela trabalhar
```

8.2 - Agora, dentro deste arquivo nós vamos fazer a primeira camada do CRUD (métodos para Criar / Create, Ler / Read, Atualizar / Update e Deletar / Delete). Vamos fazer um por um. Começaremos pelo método que cria um usuário.

```ts
    const UserRepository = {
        // Método que cria um usuário
        // ele vai receber as informações necessárias para criar um usuário
        // O que um usuário precisa? Se você responder essa pergunta, sempre saberá como criar este método
        // o método é async pois leva um tempo para fazer qualquer coisa no banco
        async create(data: {name:string, email:string, password:string}){
            // repo.create(data) transforma os dados que passamos em um objeto User
            // repo.save salva esse User no banco
            return repo.save(repo.create(data))
        }


    }
```

8.3 - Vamos para outra camada agora, Services. Lá, vamos continuar a trabalhar o `create`, só que agora, a versão do Services. Nesta camada, temos as validações (por exemplo, vamos garantir que um usuario tem os campos que precisa ter antes de registrar), também é aqui que criptografamos senha, etc. Na camada Services, crie o arquivo `UserService.ts`. Primeiro, fazemos as importações: 

```ts
    import { UserRepository } from "../repositories/UserRepository"
    import bcrypt from 'bcrypt';
    import { omitPassword } from "../utils/omitPassword"; // ainda não criamos este método, mas já vamos deixar tudo pronto

    // Aqui estamos criando uma classe de erro que estende a classe Error
    // Isso é para permitir que, mais tarde, o Controller identifique o tipo de erro de uma forma mais clara. Ou seja, quando lançar esse tipo de erro, já sabemos que é porque não encontrou algo. Not Found = Não Encontrado
    export NotFoundError extends Error{}
```

8.4 - Agora, vamos começar a criar o UserService mesmo, com o create:

```ts
    export const UserService = {

        async create(data: {name:string, email:string, password:string}){
            // no Service, sempre precisamos validar as coisas. É nesta camada que fazemos isso.
            if ( !name || !email || !password) {
                // para lançar um erro, precisamos usar a palavra 'throw' que significa 'lançar', seguida da palavra 'new' que significa 'novo' e ai chamar o tipo de erro que queremos, nesse caso, NotFoundError.
                throw new NotFoundError("Os campos são obrigatórios!")
            }
            
            // Se não lançou erro, é porque temos todas as informações necessárias
            // Então, antes de tentar criar um usuário, vamos criptografar a senha
            // bcrypt.hash() gera um hash com a senha escolhida ou seja, criptografa ela
            // não se esqueça do await pois ele é um método assíncrono (ele demora um pouco para terminar de fazer o que mandamos)
            const hash = await bcrypt.hash(data.password, 10)

            // Então podemos criar o usuário, chamando o método da camada repository
            const user = UserRepository.create({data.name, data.email, hash})
            
            // Retornamos o user SEM A SENHA para nunca aparecer a senha do usuário (esse método, o ommitPassword, fará isso. Ainda não criamos ele)
            return ommitPassword(user)
        }
    }
```

8.5 - Agora, vamos criar o método `ommitPassword` na camada `utils`. Este método recebe um user porém 'retira' a senha dele. Assim, sempre que tivermos uma resposta do servidor com as informações de um usuário, ele não mostra a senha. Crie o arquivo `ommitPassword.ts`:

```ts
    // esta função servirá para remover o campo de senha (password) de um objeto User
// Isso vai fazer com que, quando chamarmos ela em Services, ele envia ao banco o usuário normal (completo) mas envia para o Controller um usuário que não tem senha, assim o JSON não contém a senha do usuário

import { User } from "../models/User";

export function omitPassword(user:User){
    // copiamos o valor da senha do user para a variavel password
    // ai, o resto (id, name, email) fica dentro da variavel rest
    // e é ela que retornamos
    const { password, ...rest} = user
    return rest
}
```

8.6 - Agora vamos para a camada Controller. Nesta camada ficam os métodos que recebem a requisição e enviam a resposta do servidor.O Controller chama os métodos criados na Service. Na camada `controllers` crie o arquivo `UserController.ts`

8.7 - Dentro de `UserController.ts`, vamos primeiro cuidar das importações:

```ts
    import { NextFunction, Request, Response } from "express";
    import { UserService } from "../services/UserService";
``` 

8.8 - Depois, criamos o método create, chamando também o create de UserService:

```ts
export class UserController{
    // POST /users -> método que cria um novo usuário
    // o controller recebe os dados de name, email, password através do JSON que enviamos pelo ThunderClient, por exemplo, ou então pelos inputs que podemos colocar em um html
    async create (req:Request, res:Response, next:NextFunction){
        try{

            const { name, email, password } = req.body // pega name, email e password pelo corpo da requisição
            const user = UserService.create({name, email, password}) // chamamos o método do Service
            return res.status(201).json(user) // aqui dizemos que o servidor vai enviar de volta uma mensagem contendo:
            // 1 - O Status de criado com sucesso (201)
            // 2 - um JSON com as informações do usuário criado (name, email, mas sem a senha!) 
        
            
        } catch(error){
            // se algo der errado, o erro vai ser passado adiante, não estamos tratando ele aqui para transformar numa mensagem mais "bonitinha". Estamos passando pra frente, para outro arquivo fazer isso. Mais tarde criaremos ele.
            next(error)
        }
    }
}
```











