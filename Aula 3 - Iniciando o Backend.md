# Introdução ao Desenvolvimento Back-end com TypeScript

## 1. O que é Back-end? E como ele se diferencia do Front-end e Fullstack?

O desenvolvimento de software pode ser dividido em três áreas principais:

| Tipo      | O que faz?                                          | Exemplos                                 |
| --------- | --------------------------------------------------- | ---------------------------------------- |
| Front-end | Interface do usuário, interatividade e estilização  | HTML, CSS, JavaScript, React, Vue.js     |
| Back-end  | Lógica de negócio, segurança, banco de dados e APIs | Node.js, TypeScript, Express, NestJS     |
| Fullstack | Atua tanto no front-end quanto no back-end          | React, Express, Node.js, bancos de dados |

### Analogia: Restaurante

* Front-end → Garçom e cardápio (interação com o cliente).
* Back-end → Cozinha (processamento dos pedidos).
* Banco de dados → Estoque (armazenamento dos ingredientes).

Nesta unidade curricular, o foco será o desenvolvimento back-end, responsável pelo processamento das informações e pela comunicação com bancos de dados e outros sistemas.

---

## 2. Introdução ao TypeScript

### O que é TypeScript?

TypeScript é um superset do JavaScript desenvolvido pela Microsoft que adiciona recursos como:

* Tipagem estática
* Interfaces
* Classes avançadas
* Melhor suporte a orientação a objetos
* Maior segurança durante o desenvolvimento

Seu principal objetivo é reduzir erros e tornar o código mais organizado e previsível.

---

### Como o TypeScript funciona? (Transpilação)

Os navegadores e o Node.js executam JavaScript, não TypeScript.

Por esse motivo, o código TypeScript precisa ser convertido para JavaScript antes de ser executado. Esse processo é chamado de transpilação.

Código TypeScript:

```ts
let nome: string = "Daniel";
console.log(nome);
```

Código JavaScript gerado:

```js
var nome = "Daniel";
console.log(nome);
```

Dessa forma, podemos utilizar os recursos do TypeScript sem perder compatibilidade com os ambientes JavaScript.

---

## 3. Configuração do Ambiente de Desenvolvimento

### 3.1 Instalando Node.js e NPM

O Node.js permite executar JavaScript fora do navegador.

O NPM (Node Package Manager) é o gerenciador de pacotes utilizado para instalar bibliotecas e dependências.

#### Passo 1: Instalar o Node.js

Acesse:

[https://nodejs.org/](https://nodejs.org/)

Baixe e instale a versão LTS.

#### Passo 2: Verificar a instalação

Abra o terminal e execute:

```bash
node -v
npm -v
```

Se forem exibidos números de versão, a instalação foi concluída com sucesso.

---

### 3.2 Instalando e Configurando o VS Code

Download:

[https://code.visualstudio.com/](https://code.visualstudio.com/)

Extensões recomendadas:

* TSLint Snippets
* Prettier
* Thunder Client
* Material Icon Theme

---

### 3.3 Criando o Primeiro Projeto com TypeScript

Criar a pasta do projeto:

```bash
mkdir meu-backend
cd meu-backend
```

Inicializar o projeto Node:

```bash
npm init -y
```

Instalar TypeScript e dependências:

```bash
npm install typescript ts-node-dev @types/node -D
```

Criar o arquivo de configuração:

```bash
npx tsc --init
```

---

### Configurando o tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES6",
    "module": "CommonJS",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules"]
}
```

#### Principais configurações

| Configuração    | Função                                     |
| --------------- | ------------------------------------------ |
| target          | Define a versão do JavaScript gerada       |
| module          | Define o sistema de módulos                |
| outDir          | Pasta dos arquivos compilados              |
| rootDir         | Pasta dos arquivos TypeScript              |
| strict          | Ativa verificações rigorosas               |
| esModuleInterop | Compatibilidade com importações ES Modules |
| include         | Arquivos incluídos na compilação           |
| exclude         | Arquivos ignorados na compilação           |

---

## 4. O que é o Express.js?

Express.js é um framework para Node.js utilizado para construir servidores web e APIs.

### Vantagens do Express

* Simplicidade
* Rapidez no desenvolvimento
* Grande comunidade
* Fácil integração com bancos de dados
* Estrutura flexível

---

## 5. Criando um Servidor com TypeScript e Express

### 5.1 Instalando o Express

Instalação do framework:

```bash
npm install express
```

Instalação das tipagens:

```bash
npm install @types/express -D
```

O pacote `@types/express` fornece informações de tipagem para que o TypeScript consiga entender corretamente os recursos do Express.

---

### Estrutura do Projeto

```text
meu-backend/
│
├── src/
│   └── server.ts
│
├── package.json
├── tsconfig.json
```

---

### Versão sem tipagem explícita

```ts
import express from 'express';

const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Servidor TypeScript rodando!');
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
```

---

### Versão com tipagem explícita

```ts
import express, { Application, Request, Response } from 'express';

const app: Application = express();
const PORT: number = 3000;

app.use(express.json());

app.get('/', (req: Request, res: Response): void => {
  res.send('Servidor TypeScript rodando!');
});

app.listen(PORT, (): void => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
```

---

## Explicação do Código

### 1. Instância do Express

```ts
const app: Application = express();
```

Cria a aplicação Express que representará nosso servidor.

Principais métodos disponíveis:

| Método       | Função             |
| ------------ | ------------------ |
| app.get()    | Cria rotas GET     |
| app.post()   | Cria rotas POST    |
| app.put()    | Cria rotas PUT     |
| app.delete() | Cria rotas DELETE  |
| app.use()    | Aplica middlewares |
| app.listen() | Inicia o servidor  |

---

### 2. Definição da Porta

```ts
const PORT: number = 3000;
```

Define a porta em que o servidor ficará escutando requisições.

Uma porta funciona como um canal de comunicação entre clientes e servidores.

Exemplos comuns:

| Porta | Serviço         |
| ----- | --------------- |
| 80    | HTTP            |
| 443   | HTTPS           |
| 3000  | Desenvolvimento |
| 3306  | MySQL           |

---

### 3. Middleware express.json()

```ts
app.use(express.json());
```

Permite que o Express interprete automaticamente requisições contendo JSON.

Exemplo de JSON enviado:

```json
{
  "nome": "Leonardo"
}
```

Após a conversão, os dados ficam disponíveis em:

```ts
req.body
```

---

## O que são Middlewares?

Middlewares são funções executadas entre a chegada da requisição e o envio da resposta.

Eles podem:

* Validar dados
* Ler JSON
* Realizar autenticação
* Registrar logs
* Tratar erros

### Fluxo simplificado

```text
Cliente
   ↓
Middleware
   ↓
Middleware
   ↓
Rota
   ↓
Resposta
```

---

### Analogia

Imagine um restaurante:

1. Cliente faz o pedido.
2. Garçom registra o pedido.
3. Cozinha prepara a refeição.
4. Conferência final.
5. Entrega ao cliente.

Cada etapa representa um middleware executando alguma tarefa antes da resposta final.

---

### 4. Definindo uma Rota

```ts
app.get('/', (req: Request, res: Response): void => {
  res.send('Servidor TypeScript rodando!');
});
```

Quando o usuário acessar:

```text
http://localhost:3000/
```

Essa função será executada.

#### Request

Representa a requisição recebida.

Exemplos:

```ts
req.body
req.params
req.query
req.headers
```

#### Response

Representa a resposta enviada ao cliente.

Exemplos:

```ts
res.send()
res.json()
res.status()
```

---

### Por que usar res.send() em vez de console.log()?

```ts
console.log("Teste");
```

Exibe uma mensagem apenas no terminal do servidor.

Já:

```ts
res.send("Teste");
```

Envia uma resposta para o cliente.

Sem uma resposta, o navegador permaneceria aguardando indefinidamente.

---

### 5. Iniciando o Servidor

```ts
app.listen(PORT, (): void => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
```

Esse comando coloca o servidor em execução e o mantém aguardando conexões.

---

## Importância da Tipagem

### Tipagem da aplicação

```ts
const app: Application = express();
```

Fornece autocompletar e validações mais precisas.

---

### Tipagem de Request e Response

```ts
(req: Request, res: Response)
```

Permite que o TypeScript valide o acesso aos dados da requisição e resposta.

---

### Tipagem da Porta

```ts
const PORT: number = 3000;
```

Garante que apenas números possam ser atribuídos à variável.

---

## 6. Executando a Aplicação

Para iniciar o servidor em modo de desenvolvimento:

```bash
npx ts-node-dev src/server.ts
```

Benefícios:

* Executa arquivos TypeScript diretamente.
* Detecta alterações automaticamente.
* Reinicia o servidor sem intervenção manual.

---

## Revisão

* Diferenças entre Front-end, Back-end e Fullstack.
* Conceitos fundamentais do TypeScript.
* Configuração do ambiente Node.js.
* Instalação e utilização do Express.
* Criação de um servidor utilizando TypeScript.
* Uso de middlewares.
* Execução do projeto com ts-node-dev.

---

# Exercícios

### Exercício 1

Crie uma rota:

```http
GET /meunome
```

Resposta esperada:

```text
Olá, meu nome é Leonardo!
```

(Substitua pelo seu nome.)

---

### Exercício 2

Altere a porta do servidor para outra porta disponível.

---

### Exercício 3

Implemente as seguintes rotas:

#### GET /

Resposta:

```text
Servidor está funcionando perfeitamente.
```

#### GET /meunome

Resposta:

```text
Olá, meu nome é [Seu Nome].
```

#### GET /curso

Resposta:

```text
Estou aprendendo desenvolvimento back-end com TypeScript.
```

#### GET /cidade

Resposta:

```text
Eu moro em [Sua Cidade].
```

(Substitua pelos seus dados.)
