# **Introdução ao Desenvolvimento Back-end com TypeScript**

## 🏗️ **1. O que é Back-end? E como ele se diferencia do Front-end e Fullstack?**

O desenvolvimento de software se divide em três principais áreas:

| Tipo         | O que faz?                                        | Exemplos                                      |
|--------------|--------------------------------------------------|-----------------------------------------------|
| **Front-end** | Interface do usuário, interatividade, estilização | HTML, CSS, JavaScript, React, Vue.js          |
| **Back-end**  | Lógica de negócio, segurança, banco de dados, APIs | Node.js, TypeScript, Express, NestJS          |
| **Fullstack** | Trabalha tanto no front-end quanto no back-end   | Conhece React e Express, por exemplo          |

### 🎭 **Analogia: Restaurante**

- **Front-end** → O garçom e o cardápio (interação com o cliente).
- **Back-end** → A cozinha (processamento dos pedidos).
- **Banco de dados** → O estoque (onde os ingredientes são armazenados).

Nesta UC, vamos nos especializar no **back-end**, garantindo que o "cozinheiro" do sistema funcione corretamente.

---

## 🚀 **2. Introdução ao TypeScript**

### 🔹 **O que é TypeScript?**

TypeScript é um **superset do JavaScript** que adiciona **tipagem estática** e funcionalidades avançadas, ajudando na escrita de código mais seguro e organizado.

### 🔄 **Como o TypeScript funciona? (Transpilação para JavaScript)**

O navegador e o Node.js não entendem TypeScript. Ele precisa ser convertido em JavaScript antes de ser executado. Esse processo é chamado de **transpilação**.

```ts
// Código TypeScript
let nome: string = "Daniel";
console.log(nome);
```

Após ser "transpilado" pelo TypeScript, vira:

```js
// Código JavaScript gerado
var nome = "Daniel";
console.log(nome);
```

Isso significa que podemos usar TypeScript sem medo, pois no final **o código será sempre convertido para JavaScript compatível com qualquer ambiente**.

---

## 🛠 **3. Configuração do Ambiente de Desenvolvimento**

### 📌 **3.1 Instalando Node.js e NPM**

O **Node.js** é um ambiente para rodar JavaScript no servidor. O **NPM (Node Package Manager)** é o gerenciador de pacotes que permite instalar bibliotecas.

🔹 **Passo 1: Baixar e instalar o Node.js**  
Acesse: [https://nodejs.org/](https://nodejs.org/) e baixe a versão **LTS**.

🔹 **Passo 2: Verificar instalação**  
Após instalar, abra o terminal e execute:  
```bash
node -v
npm -v
```
Se aparecer um número de versão, significa que está funcionando corretamente! 🎉

---

### 🖥 **3.2 Instalando e Configurando o VS Code**

🔹 **Baixar o VS Code:**  
[https://code.visualstudio.com/](https://code.visualstudio.com/)

🔹 **Extensões recomendadas:**  
- **TSLint Snippets** → Para manter um código padronizado.
- **Prettier** → Para formatar código automaticamente.
- **Thunder Client** → Para testar APIs sem precisar do `Postman`.
- **Material Icon Theme** → Para melhorar a visualização de arquivos.

---

### 📁 **3.3 Criando o Primeiro Projeto com TypeScript**

1️⃣ **Criar uma pasta para o projeto e acessar ela:**  
```bash
mkdir meu-backend && cd meu-backend
```

2️⃣ **Inicializar um projeto Node.js:**  
```bash
npm init -y
```

3️⃣ **Instalar o TypeScript no projeto:**  
```bash
npm install typescript ts-node-dev @types/node -D
```

4️⃣ **Criar o arquivo de configuração do TypeScript:**  
```bash
npx tsc --init
```

Isso gera um arquivo `tsconfig.json`, que controla a transpilação do TypeScript.

### 🔹 **Explicação do `tsconfig.json`**

Vamos modificar algumas configurações para otimizar o projeto:

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

- **`target`**: Define para qual versão do JavaScript o TypeScript vai transpilar.
- **`module`**: Define o sistema de módulos usado (CommonJS para Node.js).
- **`outDir`**: Define onde os arquivos transpilados vão ser salvos.
- **`rootDir`**: Define onde os arquivos TypeScript estão localizados.
- **`strict`**: Ativa verificações mais rígidas no código.
- **`esModuleInterop`**: Habilita a importação de módulos no estilo ES6 para módulos CommonJS.
- **`include`**: Define quais arquivos ou pastas devem ser incluídos da compilação.
- **`exclude`**: Define quais arquivos ou pastas devem ser excluídos da compilação.
---

## 🌐 **4. O que é o Express.js?**

O **Express.js** é um framework minimalista para Node.js que facilita a criação de servidores e APIs.

### ✅ **Por que usar Express?**

- Simples e rápido.
- Permite criar APIs REST de forma fácil.
- Possui um grande ecossistema e comunidade ativa.

---

## 🚀 **5. Criando um Servidor com TypeScript e Express**

### 📌 **5.1 Instalando o Express**

🔹 **Instalar o Express e suas tipagens**:  
```bash
npm install express  
npm install @types/express -D
```

**Mas por que instalamos `@types/express`?**

O Express é escrito em JavaScript, mas estamos usando TypeScript. O pacote `@types/express` fornece os tipos necessários para que o TypeScript entenda o Express corretamente.

---

### 📁 **5.2 Criando a estrutura do projeto**

```
meu-backend/
│── src/
│   ├── server.ts
│── tsconfig.json
│── package.json
```

Agora, vamos criar o arquivo `server.ts`. Aqui estão **duas versões** desse código:

### **Versão 1: `server.ts` sem tipagem explícita**

```ts
import express from 'express';

const app = express();
const PORT = 3000;

// Middleware para permitir que o Express interprete JSON
app.use(express.json());

// Rota GET para a raiz
app.get('/', (req, res) => {
  res.send('🚀 Servidor TypeScript rodando!');
});

// Iniciando o servidor
app.listen(PORT, () => {
  console.log(`🔥 Servidor rodando em http://localhost:${PORT}`);
});
```

### **Versão 2: `server.ts` com tipagem explícita**

```ts
import express, { Application, Request, Response } from 'express';

const app: Application = express();  // Tipando 'app' como 'Application'
const PORT: number = 3000;  // Tipagem da porta como número

// Middleware para permitir que o Express interprete JSON
app.use(express.json());

// Rota GET para a raiz
app.get('/', (req: Request, res: Response): void => {
  res.send('🚀 Servidor TypeScript rodando!');
});

// Iniciando o servidor
app.listen(PORT, (): void => {
  console.log(`🔥 Servidor rodando em http://localhost:${PORT}`);
});
```

### Explicando este código

1. `const app: Application = express();`: App representa o objeto express, ou seja, a instância do nosso servidor backend. Depois de criado, podemos usar estes métodos:

| Exemplo                         | Função                  |
| ------------------------------- | ----------------------- |
| `app.get(...)`                  | Define rotas GET        |
| `app.post(...)`                 | Define rotas POST       |
| `app.use(...)`                  | Aplica middlewares      |
| `app.listen(...)`               | Inicia o servidor       |
| `app.use('/api', router)`       | Encaixar rotas externas |
| `app.set(...)` / `app.get(...)` | Configurações internas  |

#### 2.`const PORT: number = 3000;`: 
Define a porta 3000 para o servidor escutar (significa que o servidor está “ouvindo” essa porta esperando por conexões ou pedidos (requests)).
Sobre portas, pense no seu computador ou servidor como um prédio. Dentro desse prédio, existem várias portas. Cada porta serve para um tipo diferente de serviço ou conversa.
Quando alguém quer falar com um serviço específico (por exemplo, um site, um email, um jogo), essa pessoa precisa bater na porta certa.

#### 3. `app.use(express.json());`

Essa linha faz com que o **Express consiga entender e converter o corpo das requisições em JSON** (por exemplo: `{ "nome": "Leo" }`) para **objetos JavaScript acessíveis via `req.body`**.

#### 4. `app.get('/', (req: Request, res: Response): void => {  res.send('🚀 Servidor TypeScript rodando!');});`: 
app.get() define uma rota do tipo GET no caminho /. Quando alguém acessar http://localhost:3000/, o Express executa essa função. Essa função recebe dois argumentos:
req: representa a requisição do cliente (navegador, por exemplo). Os tipos Request e Response vem da biblioteca do express. 

res: representa a resposta que o servidor vai enviar.

res.send() envia uma mensagem como resposta.

Mas porque usamos send() e não um simples console.log()?

 console.log(...) → Só aparece no terminal do servidor
Serve apenas para debugar ou ver informações internamente no servidor (onde o Node.js está rodando).
O cliente (ex: navegador) nunca verá isso. É como um "diário" do servidor. Só o desenvolvedor vê isso no terminal!

res.send(...) → Responde ao cliente
Envia uma resposta real para o cliente (navegador, app, Postman, ThunderClient etc.).Sem isso, o cliente ficaria esperando para sempre, sem resposta.
É como dizer: "Toma aqui o conteúdo que você pediu!". Exemplo:
```ts
res.send('Bem-vindo!');
```
 O navegador vai exibir "Bem-vindo!" na tela, porque o servidor enviou isso de volta.

| Termo      | O que é                               | De onde vem | Por que usar                                                                       |
| ---------- | ------------------------------------- | ----------- | ---------------------------------------------------------------------------------- |
| `Request`  | Tipo que representa a requisição HTTP | `express`   | Permite acessar `req.body`, `req.params`, etc. com segurança                       |
| `Response` | Tipo que representa a resposta HTTP   | `express`   | Permite usar `res.send()`, `res.json()`, etc., com dicas e validação do TypeScript |


#### 5: `app.listen(PORT, (): void => {  console.log(`🔥 Servidor rodando em http://localhost:${PORT}`);});`:
app.listen(PORT, ...): inicia o servidor na porta informada (por exemplo, 3000).
(): void => { ... }: é uma função de callback (executada assim que o servidor começa a funcionar).
console.log(...): apenas imprime no terminal uma mensagem dizendo que o servidor está no ar.



---

### 🧠 Explicando por partes:

- `app.use()` → Adiciona um **middleware**, ou seja, uma função que processa a requisição **antes** dela chegar nas suas rotas.
- `express.json()` → É um middleware pronto do Express que **lê o corpo da requisição** quando ele está no formato JSON.
- **Sem esse middleware**, o Express **não entenderia os dados JSON enviados** (por exemplo, no corpo de um POST).
- **Com ele**, o Express **converte o JSON automaticamente** e deixa os dados disponíveis em `req.body`.

---

### 📦 O que são Middlewares?

Middlewares são **funções que ficam "no meio do caminho"** entre a requisição do cliente e a resposta do servidor.

Eles podem:

- 📖 Ler dados (como JSON)
- 🔐 Verificar se o usuário está logado
- 📝 Registrar ações no log
- ✅ Validar dados
- 🔄 Fazer outras tarefas antes de enviar a resposta

---

### 🍽️ Analogia simples: restaurante

Imagine um cliente fazendo um pedido em um restaurante:

1. O cliente faz o pedido.
2. O pedido passa por várias etapas:
   - O garçom anota.
   - A cozinha prepara.
   - Alguém confere.
3. Só depois o prato vai para a mesa.

👉 Essas etapas são como **middlewares**: cada uma faz algo **antes da resposta final (comida na mesa)**.

---

### ✅ No nosso caso:

O middleware `express.json()` faz o papel de:
> “Antes de continuar, **converta o corpo da requisição em JSON**.”

Assim, você pode acessar os dados direto em `req.body`.

---


### **Diferenças e Importância da Tipagem**

1. **Tipagem de `app` como `Application`**: No TypeScript, a variável `app` é do tipo `express.Application`. Embora o Express funcione corretamente sem tipagem explícita, é uma boa prática tipar a variável `app` como `Application`. Isso ajuda a evitar erros, já que o TypeScript vai fornecer autocompletar e verificações de tipo em todas as operações que você faz com o `app`.

2. **Tipagem de `req` e `res`**: Ao adicionar as tipagens explícitas para `req` (Request) e `res` (Response), você garante que o TypeScript consiga verificar os tipos de dados com os quais está lidando nas rotas. Por exemplo, ele vai verificar se os parâmetros da requisição são compatíveis com o esperado e pode até te avisar sobre erros antes de você rodar o código.

3. **`PORT` tipado como `number`**: Embora o TypeScript consiga inferir o tipo de `PORT` com base no valor atribuído, sempre é uma boa prática tipar explicitamente variáveis, especialmente se o valor de `PORT` for modificado ou se você estiver trabalhando com valores mais complexos. Isso ajuda a evitar bugs e confusões.

---

# 🔥 **6. Como Rodar a Aplicação**

Para rodar o servidor TypeScript com recarga automática durante o desenvolvimento, vamos usar o `ts-node-dev`. O `ts-node-dev` é uma ferramenta que transpila o código TypeScript em tempo real, permitindo que as mudanças sejam refletidas sem precisar reiniciar o servidor manualmente.

🔹 **Rodando a aplicação com `ts-node-dev`**
Execute o seguinte comando para rodar o servidor com `ts-node-dev`:

```bash
npx ts-node-dev src/server.ts
```

Esse comando irá:

1. Rodar o arquivo `server.ts` localizado na pasta `src`.
2. Fazer a transpilação automática do código TypeScript sempre que você fizer uma alteração.
3. Reiniciar o servidor sem precisar de intervenção manual.

---

# 🏆 **Recapitulando**

✅ Aprendemos as diferenças entre **Front-end, Back-end e Fullstack**.   
✅ Compreendemos o que é **TypeScript e como ele funciona**.   
✅ Configuramos **o ambiente de desenvolvimento (VS Code, Node.js, TypeScript)**.   
✅ Criamos um servidor usando **Express.js e TypeScript**, com e sem tipagem explícita.   
✅ Aprendemos a rodar o servidor com **`ts-node-dev`** para um desenvolvimento mais ágil.

---

# 🎯 **Exercícios**

- Tente criar uma nova rota no servidor que retorne seu nome.  
- Experimente mudar a porta do servidor.
- Implemente as seguintes rotas no servidor:

## `GET /`

* Resposta: `"Servidor está funcionando perfeitamente 🚀"`

## 📍 `GET /meunome`

* Resposta: `"Olá, meu nome é [Seu Nome]!"`
  *(Substitua `[Seu Nome]` pelo seu nome real.)*



sem emoji
