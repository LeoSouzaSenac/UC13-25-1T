# **Aula 4: Models, Services, Controllers e Rotas no Express**

## **Objetivos da Aula**

* Entender o conceito de **MVC (Model-View-Controller)**.
* Compreender a importância da camada **Service** na arquitetura.
* Estruturar um projeto Express com separação correta de responsabilidades.
* Criar um **CRUD básico** usando boas práticas de organização.

---

# **1. O que é MVC?**

O **MVC (Model-View-Controller)** é um padrão de arquitetura que organiza a aplicação separando responsabilidades.

* **Model (Modelo)** → Representa os dados e a estrutura da entidade.
* **Controller (Controlador)** → Recebe requisições HTTP e delega a lógica para os services.
* **View (Visão)** → Interface com o usuário (não será usada aqui, pois estamos criando uma API).

### **Problema do MVC puro**

Em aplicações reais, o Controller pode ficar sobrecarregado com regras de negócio.

### **Solução: Service Layer**

A camada **Service** é responsável por:

* Regras de negócio
* Processamento de dados
* Comunicação com o Model

---

# **2. Estrutura do Projeto**

```
express-mvc/
│── src/
│   ├── models/
│   │   ├── User.ts
│   ├── services/
│   │   ├── UserService.ts
│   ├── controllers/
│   │   ├── UserController.ts
│   ├── routes/
│   │   ├── UserRoutes.ts
│   ├── server.ts
│── package.json
│── tsconfig.json
```

---

# **3. Responsabilidade de cada camada**

### Model

* Define estrutura dos dados
* Representa a entidade
* Não contém regras de negócio

### Service

* Contém toda a lógica da aplicação
* Manipula dados (CRUD)
* Regras de validação e consistência

### Controller

* Recebe requisições HTTP
* Chama o Service
* Retorna respostas HTTP

### Routes

* Define endpoints
* Direciona requisições para Controllers

---

# **4. Implementação do CRUD**

---

## **Model – `models/User.ts`**

```ts
export class User {
    public id: number;
    public nome: string;
    public email: string;

    constructor(id: number, nome: string, email: string) {
        this.id = id;
        this.nome = nome;
        this.email = email;
    }
}

export const usuarios: User[] = [];
```

---

## **Service – `services/UserService.ts`**

Aqui fica toda a regra de negócio.

```ts
import { User, usuarios } from "../models/User";

export class UserService {

    create(id: number, nome: string, email: string): User {
        const usuario = new User(id, nome, email);
        usuarios.push(usuario);
        return usuario;
    }

    findAll(): User[] {
        return usuarios;
    }

    update(id: number, nome: string, email: string): User | null {
        const usuario = usuarios.find(u => u.id === id);

        if (!usuario) {
            return null;
        }

        usuario.nome = nome;
        usuario.email = email;

        return usuario;
    }

    delete(id: number): boolean {
        const index = usuarios.findIndex(u => u.id === id);

        if (index === -1) {
            return false;
        }

        usuarios.splice(index, 1);
        return true;
    }
}
```

---

## **Controller – `controllers/UserController.ts`**

O Controller apenas recebe e responde requisições.

```ts
import { Request, Response } from "express";
import { UserService } from "../services/UserService";

export class UserController {

    private service = new UserService();

    createUser(req: Request, res: Response): Response {
        const { id, nome, email } = req.body;

        if (!id || !nome || !email) {
            return res.status(400).json({ mensagem: "Id, nome e email são obrigatórios!" });
        }

        const usuario = this.service.create(id, nome, email);

        return res.status(201).json({
            mensagem: "Usuário criado com sucesso!",
            usuario
        });
    }

    listAllUsers(req: Request, res: Response): Response {
        const users = this.service.findAll();
        return res.status(200).json(users);
    }

    updateUser(req: Request, res: Response): Response {
        const id = Number(req.params.id);
        const { nome, email } = req.body;

        if (!nome || !email) {
            return res.status(400).json({ mensagem: "Nome e email são obrigatórios!" });
        }

        const usuario = this.service.update(id, nome, email);

        if (!usuario) {
            return res.status(404).json({ mensagem: "Usuário não encontrado!" });
        }

        return res.status(200).json({
            mensagem: "Usuário atualizado com sucesso!",
            usuario
        });
    }

    deleteUser(req: Request, res: Response): Response {
        const id = Number(req.params.id);

        const deleted = this.service.delete(id);

        if (!deleted) {
            return res.status(404).json({ mensagem: "Usuário não encontrado!" });
        }

        return res.status(204).send();
    }
}
```

---

## **Routes – `routes/UserRoutes.ts`**

```ts
import { Router } from "express";
import { UserController } from "../controllers/UserController";

const router = Router();
const controller = new UserController();

router.get("/users", (req, res) => controller.listAllUsers(req, res));
router.post("/users", (req, res) => controller.createUser(req, res));
router.put("/users/:id", (req, res) => controller.updateUser(req, res));
router.delete("/users/:id", (req, res) => controller.deleteUser(req, res));

export default router;
```

---

## **Server – `server.ts`**

```ts
import express, { Application } from "express";
import userRoutes from "./routes/UserRoutes";

const app: Application = express();
const PORT = 3000;

app.use(express.json());
app.use(userRoutes);

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
```

---

# **5. Fluxo da aplicação**

Quando uma requisição chega:

1. **Route** recebe a requisição
2. Encaminha para o **Controller**
3. O **Controller valida entrada e chama o Service**
4. O **Service executa a regra de negócio**
5. O resultado volta para o Controller
6. O Controller retorna a resposta HTTP

---

# **6. Exercícios**

1. Criar entidade **Produto** com MVC + Service.
2. Implementar validações no Service (ex: email duplicado).
3. Adicionar busca por ID no Service.
4. Melhorar tratamento de erros com mensagens padronizadas.

---

# **Resumo**

* MVC organiza a estrutura da aplicação.
* O **Service separa a lógica de negócio do Controller**.
* O Controller deve ser leve e apenas orquestrar chamadas.
* Essa arquitetura melhora manutenção, escalabilidade e organização do código.
