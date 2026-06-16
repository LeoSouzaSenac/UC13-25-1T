# Aula 4: Models, Services, Controllers e Rotas no Express com MySQL

## Objetivos da Aula

* Entender o conceito de MVC.
* Compreender a importância da camada Service.
* Utilizar MySQL para persistência de dados.
* Organizar uma API Express utilizando boas práticas.
* Criar um CRUD completo conectado ao banco de dados.

---

# 1. O que é MVC?

MVC (Model-View-Controller) é um padrão de arquitetura utilizado para separar responsabilidades dentro da aplicação.

## Model

Responsável por representar a estrutura dos dados.

Exemplo:

```ts
export class Usuario {

    private id?: number;
    private email: string;
    private senha: string;

    constructor(
        email: string,
        senha: string,
        id?: number
    ) {
        this.id = id;
        this.email = email;
        this.senha = senha;
    }

    public getId(): number | undefined {
        return this.id;
    }

    public setId(id: number): void {
        this.id = id;
    }

    public getEmail(): string {
        return this.email;
    }

    public setEmail(email: string): void {
        this.email = email;
    }

    public getSenha(): string {
        return this.senha;
    }

    public setSenha(senha: string): void {
        this.senha = senha;
    }
}
```

## Controller

Recebe requisições HTTP.

Exemplos:

* GET
* POST
* PUT
* DELETE

O Controller não deve conter regras de negócio.

## View

Camada visual da aplicação.

Como estamos criando uma API REST, não utilizaremos Views.

---

# Problema do MVC Tradicional

Quando a aplicação cresce, o Controller acaba acumulando:

* Validações
* Consultas ao banco
* Regras de negócio
* Processamentos

Isso torna o código difícil de manter.

---

# Solução: Service Layer

A camada Service é responsável por:

* Regras de negócio
* Validações
* Comunicação com o banco de dados
* Processamento de dados

Fluxo:

```txt
Route
 ↓
Controller
 ↓
Service
 ↓
Banco de Dados
```

---

# 2. Estrutura do Projeto

```txt
src/
│
├── controllers/
│   └── UsuarioController.ts
│
├── services/
│   └── UsuarioService.ts
│
├── routes/
│   └── UsuarioRoutes.ts
│
├── models/
│   └── Usuario.ts
│
├── database.ts
│
└── server.ts
```

---

# 3. Configuração do Banco

## database.ts

```ts
import mysql from "mysql2/promise";

export const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "root",
    database: "biblioteca"
});
```

---

# 4. Criando a Tabela

```sql
CREATE DATABASE biblioteca;

USE biblioteca;

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    senha VARCHAR(100) NOT NULL
);
```

---

# 5. Model

## models/Usuario.ts

```ts
export class Usuario {

    private id?: number;
    private email: string;
    private senha: string;

    constructor(
        email: string,
        senha: string,
        id?: number
    ) {
        this.id = id;
        this.email = email;
        this.senha = senha;
    }

    public getId(): number | undefined {
        return this.id;
    }

    public setId(id: number): void {
        this.id = id;
    }

    public getEmail(): string {
        return this.email;
    }

    public setEmail(email: string): void {
        this.email = email;
    }

    public getSenha(): string {
        return this.senha;
    }

    public setSenha(senha: string): void {
        this.senha = senha;
    }
}
```

---

# 6. Service

Toda a lógica da aplicação ficará aqui.

## services/UsuarioService.ts

```ts
import { pool } from "../database";
import { Usuario } from "../models/Usuario";

export class UsuarioService {

    async create(email: string, senha: string) {

        const usuario = new Usuario(
            email,
            senha
        );

        const [result] = await pool.query(
            "INSERT INTO usuarios (email, senha) VALUES (?, ?)",
            [
                usuario.getEmail(),
                usuario.getSenha()
            ]
        );

        return result;
    }

    async findAll() {

        const [rows] = await pool.query(
            "SELECT * FROM usuarios"
        );

        return rows;
    }

    async findById(id: number) {

        const [rows]: any = await pool.query(
            "SELECT * FROM usuarios WHERE id = ?",
            [id]
        );

        return rows[0];
    }

    async update(
        id: number,
        email: string,
        senha: string
    ) {

        const [result] = await pool.query(
            `UPDATE usuarios
             SET email = ?, senha = ?
             WHERE id = ?`,
            [
                email,
                senha,
                id
            ]
        );

        return result;
    }

    async delete(id: number) {

        const [result] = await pool.query(
            "DELETE FROM usuarios WHERE id = ?",
            [id]
        );

        return result;
    }
}
```

---

# 7. Controller

Recebe requisições HTTP e chama o Service.

## controllers/UsuarioController.ts

```ts
import { Request, Response } from "express";
import { UsuarioService } from "../services/UsuarioService";

export class UsuarioController {

    private service = new UsuarioService();

    async createUsuario(
        req: Request,
        res: Response
    ) {

        try {

            const { email, senha } = req.body;

            if (!email || !senha) {
                return res.status(400).json({
                    mensagem: "Email e senha são obrigatórios"
                });
            }

            await this.service.create(
                email,
                senha
            );

            return res.status(201).json({
                mensagem: "Usuário criado com sucesso"
            });

        } catch {

            return res.status(500).json({
                mensagem: "Erro interno"
            });

        }
    }

    async listUsuarios(
        req: Request,
        res: Response
    ) {

        try {

            const usuarios =
                await this.service.findAll();

            return res.status(200).json(
                usuarios
            );

        } catch {

            return res.status(500).json({
                mensagem: "Erro interno"
            });

        }
    }

    async getUsuario(
        req: Request,
        res: Response
    ) {

        try {

            const id = Number(
                req.params.id
            );

            const usuario =
                await this.service.findById(id);

            if (!usuario) {
                return res.status(404).json({
                    mensagem: "Usuário não encontrado"
                });
            }

            return res.status(200).json(
                usuario
            );

        } catch {

            return res.status(500).json({
                mensagem: "Erro interno"
            });

        }
    }

    async updateUsuario(
        req: Request,
        res: Response
    ) {

        try {

            const id = Number(
                req.params.id
            );

            const { email, senha } = req.body;

            await this.service.update(
                id,
                email,
                senha
            );

            return res.status(200).json({
                mensagem: "Usuário atualizado com sucesso"
            });

        } catch {

            return res.status(500).json({
                mensagem: "Erro interno"
            });

        }
    }

    async deleteUsuario(
        req: Request,
        res: Response
    ) {

        try {

            const id = Number(
                req.params.id
            );

            await this.service.delete(id);

            return res.status(204).send();

        } catch {

            return res.status(500).json({
                mensagem: "Erro interno"
            });

        }
    }
}
```

---

# 8. Routes

Define os endpoints da aplicação.

## routes/UsuarioRoutes.ts

```ts
import { Router } from "express";
import { UsuarioController } from "../controllers/UsuarioController";

const router = Router();

const controller =
    new UsuarioController();

router.get(
    "/usuarios",
    (req, res) =>
        controller.listUsuarios(req, res)
);

router.get(
    "/usuarios/:id",
    (req, res) =>
        controller.getUsuario(req, res)
);

router.post(
    "/usuarios",
    (req, res) =>
        controller.createUsuario(req, res)
);

router.put(
    "/usuarios/:id",
    (req, res) =>
        controller.updateUsuario(req, res)
);

router.delete(
    "/usuarios/:id",
    (req, res) =>
        controller.deleteUsuario(req, res)
);

export default router;
```

---

# 9. Servidor

## server.ts

```ts
import express from "express";
import usuarioRoutes from "./routes/UsuarioRoutes";

const app = express();

app.use(express.json());

app.use(usuarioRoutes);

app.listen(3000, () => {
    console.log(
        "Servidor rodando na porta 3000"
    );
});
```

---

# 10. Fluxo da Aplicação

Quando uma requisição chega:

1. A Route recebe a requisição.
2. Encaminha para o Controller.
3. O Controller valida os dados.
4. O Controller chama o Service.
5. O Service executa SQL no banco.
6. O resultado retorna para o Controller.
7. O Controller envia a resposta HTTP.

Fluxo:

```txt
Cliente
   ↓
Route
   ↓
Controller
   ↓
Service
   ↓
MySQL
```

---

# Exercícios

1. Adicionar validação para email duplicado.
2. Criar endpoint para buscar usuário por ID.
3. Validar tamanho mínimo da senha.
4. Retornar mensagem de erro personalizada.
5. Impedir cadastro com email vazio.
6. Criar endpoint para alterar apenas a senha.

---

# Resumo

* MVC organiza o projeto.
* Routes recebem requisições.
* Controllers controlam o fluxo.
* Services contêm regras de negócio.
* Models representam as entidades.
* MySQL realiza persistência dos dados.
* A separação de responsabilidades facilita manutenção e escalabilidade.
