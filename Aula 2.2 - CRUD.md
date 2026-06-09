# CRUD com Express e MySQL

# O que é CRUD?

CRUD representa as quatro operações mais comuns em sistemas.

| Letra | Significado | Método HTTP |
| ----- | ----------- | ----------- |
| C     | Create      | POST        |
| R     | Read        | GET         |
| U     | Update      | PUT         |
| D     | Delete      | DELETE      |

Exemplos:

* Criar usuário
* Buscar usuário
* Atualizar usuário
* Excluir usuário

---

# Métodos HTTP

## GET

Utilizado para buscar informações.

Exemplo:

```http
GET /usuarios
```

Resposta:

```json
[
  {
    "id": 1,
    "nome": "João"
  }
]
```

---

## POST

Utilizado para criar informações.

Exemplo:

```http
POST /usuarios
```

Body:

```json
{
  "nome": "João",
  "email": "joao@email.com"
}
```

---

## PUT

Utilizado para atualizar um registro inteiro.

Exemplo:

```http
PUT /usuarios/1
```

Body:

```json
{
  "nome": "João Silva",
  "email": "joao@email.com"
}
```

---

## DELETE

Utilizado para remover informações.

Exemplo:

```http
DELETE /usuarios/1
```

---

# Criando o Projeto

## Criar pasta

```bash
mkdir api-usuarios
```

Entrar na pasta:

```bash
cd api-usuarios
```

---

## Inicializar Node

```bash
npm init -y
```

Será criado o arquivo:

```text
package.json
```

---

## Instalar Express

```bash
npm install express
```

---

## Instalar MySQL

```bash
npm install mysql2
```

---

# Estrutura do Projeto

```text
src/

├── db.js
├── server.js
```

---

# Criando o Banco

Abra o MySQL e execute:

```sql
CREATE DATABASE sistema;
```

Selecionar o banco:

```sql
USE sistema;
```

---

# Criando a Tabela

```sql
CREATE TABLE usuarios (

    id INT AUTO_INCREMENT PRIMARY KEY,

    nome VARCHAR(100) NOT NULL,

    email VARCHAR(150) NOT NULL UNIQUE,

    senha VARCHAR(255) NOT NULL,

    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);
```

---

# Entendendo a Tabela

| Campo         | Função           |
| ------------- | ---------------- |
| id            | Identificador    |
| nome          | Nome do usuário  |
| email         | E-mail           |
| senha         | Senha            |
| data_cadastro | Data do cadastro |

---

# Criando a Conexão com o Banco

Arquivo:

```text
db.js
```

Código:

```javascript
const mysql = require('mysql2/promise');

const pool = mysql.createPool({

    host: 'localhost',

    user: 'root',

    password: '123456',

    database: 'sistema',

    waitForConnections: true,

    connectionLimit: 10

});

module.exports = pool;
```

---

# O que é createPool?

O pool cria várias conexões que podem ser reutilizadas.

Sem pool:

```text
Conecta
Usa
Fecha

Conecta
Usa
Fecha
```

Com pool:

```text
Conecta uma vez

Usa várias vezes
Usa várias vezes
Usa várias vezes
```

Mais rápido e mais profissional.

---

# Criando o Servidor

Arquivo:

```text
server.js
```

Importações:

```javascript
const express = require('express');
const db = require('./db');

const app = express();

const PORT = 3000;
```

Permitir JSON:

```javascript
app.use(express.json());
```

---

# GET - Buscar Todos os Usuários

```javascript
app.get('/usuarios', async (req, res) => {

    try {

        const [usuarios] = await db.query(
            'SELECT * FROM usuarios'
        );

        res.status(200).json(usuarios);

    } catch (erro) {

        res.status(500).json({
            erro: 'Erro ao buscar usuários'
        });

    }

});
```

---

# Entendendo o SELECT

```sql
SELECT * FROM usuarios
```

Significa:

```text
Selecione todas as colunas
da tabela usuarios
```

---

# GET - Buscar por ID

```javascript
app.get('/usuarios/:id', async (req, res) => {

    const { id } = req.params;

    const [usuario] = await db.query(

        'SELECT * FROM usuarios WHERE id = ?',

        [id]

    );

    res.json(usuario);

});
```

Exemplo:

```http
GET /usuarios/5
```

O valor 5 ficará em:

```javascript
req.params.id
```

---

# POST - Inserir Usuário

```javascript
app.post('/usuarios', async (req, res) => {

    const { nome, email, senha } = req.body;

    const [resultado] = await db.query(

        `INSERT INTO usuarios
        (nome, email, senha)
        VALUES (?, ?, ?)`,

        [nome, email, senha]

    );

    res.status(201).json({
        mensagem: 'Usuário criado'
    });

});
```

---

# Entendendo o INSERT

```sql
INSERT INTO usuarios
(nome, email, senha)
VALUES
('João', 'joao@email.com', '123')
```

Traduzindo:

```text
Insira um novo registro
na tabela usuarios
```

---

# Testando no Thunder Client

Método:

```http
POST
```

URL:

```text
http://localhost:3000/usuarios
```

Body:

```json
{
  "nome": "João",
  "email": "joao@email.com",
  "senha": "123"
}
```

---

# PUT - Atualizar Usuário

```javascript
app.put('/usuarios/:id', async (req, res) => {

    const { id } = req.params;

    const { nome, email, senha } = req.body;

    await db.query(

        `UPDATE usuarios
         SET nome = ?,
             email = ?,
             senha = ?
         WHERE id = ?`,

        [nome, email, senha, id]

    );

    res.json({
        mensagem: 'Usuário atualizado'
    });

});
```

---

# Entendendo o UPDATE

```sql
UPDATE usuarios
SET nome = 'Maria'
WHERE id = 1
```

Significa:

```text
Atualize os dados
do usuário de ID 1
```

---

# DELETE - Excluir Usuário

```javascript
app.delete('/usuarios/:id', async (req, res) => {

    const { id } = req.params;

    await db.query(

        'DELETE FROM usuarios WHERE id = ?',

        [id]

    );

    res.json({
        mensagem: 'Usuário removido'
    });

});
```

---

# Entendendo o DELETE

```sql
DELETE FROM usuarios
WHERE id = 1
```

Significa:

```text
Remova o usuário de ID 1
```

---

# Iniciando o Servidor

```javascript
app.listen(PORT, () => {

    console.log(
        `Servidor rodando em http://localhost:${PORT}`
    );

});
```

---

# Resumo Final

Fluxo de cadastro:

```text
Thunder Client

      ↓

POST /usuarios

      ↓

Express

      ↓

MySQL

      ↓

Tabela usuarios

      ↓

Resposta JSON
```

Fluxo de busca:

```text
Thunder Client

      ↓

GET /usuarios

      ↓

Express

      ↓

MySQL

      ↓

SELECT

      ↓

Resposta JSON
```

Fluxo completo do CRUD:

```text
CREATE  → POST
READ    → GET
UPDATE  → PUT
DELETE  → DELETE
```

