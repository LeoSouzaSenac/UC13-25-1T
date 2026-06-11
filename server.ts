import express from "express";
import { pool } from "./database";

/*
    A variável app recebe a instância do express. Ou seja, dentro dela, agora temos um objeto que, quando chamarmos, nos dá acesso a vários métodos diferentes que vamos precisar para criar nosso servidor backend.
*/
const app = express();

/*
    Identifica em que porta nosso servidor escutará as requisições.
*/
const PORT = 3000;

// Estamos dizendo que nosso servidor vai utilizar e se comunicar, nas requisições e respostas, usando JSON
app.use(express.json());

// Rotas são métodos especiais que são chamados para fazer uma determinada requisição. Cada uma tem um método HTTP (GET, POST, PUT, DELETE). O método, no express, é feito desta forma:
// o primeiro argumento é o caminho para acessar esta rota, e o segundo argumento é a função executada quando chamarmos esta rota
// app.metodoHTTP('caminho', () => {})

// Método GET -> buscar uma informação
// req é o objeto da requisição
// res é o objeto da resposta
app.get("/mensagem", (req, res) => {
  res.status(200).send("Olá galera!");
});

app.get("/meunome", (req, res) => {
  res.status(200).send("Meu nome é Fulanin.");
});

// LISTAR USUÁRIOS
app.get("/usuarios", async (req, res) => {
  // tente fazer a consulta no banco
  try {
    // query('consultaSQL') é um método da biblioteca do mysql2 que executa comandos SQL. Neste caso, estamos fazendo um SELECT e armazenando as informações na variável 'usuarios'

    const [usuarios] = await pool.query("SELECT * FROM usuarios");

    // retorna a resposta com status 200 (OK) e envia a lista de usuarios em formato JSON
    return res.status(200).json(usuarios);
  } catch (erro) {
    // se der errado, cai aqui e mostra o erro
    console.log("Erro: ", erro);
    // Status 500 -> Erro no servidor
    return res.status(500).json("Erro ao buscar usuários: " + erro);
  }
});

// CRIA USUARIOS
app.post("/usuarios", async (req, res) => {
  try {
    const { nome, email, senha } = req.body; // estas informações enviamos no corpo da nossa requisição

    const [resultado] = await pool.query(
      "INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)",
      [nome, email, senha]
    );

    // Status 201 -> Dado criado com sucesso
    return res.status(201).json("Usuário criado com sucesso!");
  } catch (erro) {
    return res.status(500).json("Erro interno do servidor: " + erro);
  }
});

// UPDATE -> ATUALIZAR
app.put("/usuarios/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { nome, email, senha } = req.body;

    const [resultado] = await pool.query(
      "UPDATE usuarios SET nome = ?, email = ?, senha = ? WHERE id = ?",
      [nome, email, senha, id]
    );

    return res.status(200).json("Usuário atualizado com sucesso!");
  } catch (erro) {
    return res.status(500).json("Erro interno do servidor: " + erro);
  }
});

// DELETE -> DELETAR / APAGAR
app.delete("/usuarios/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [resultado] = await pool.query(
      "DELETE FROM usuarios WHERE id = ?",
      [id]
    );

    return res.status(200).json("Usuário foi pro vinagre!");
  } catch (erro) {
    return res.status(500).json("Erro interno do servidor: " + erro);
  }
});

// listen() é o método do express para colocar nosso servidor no ar. Ele precisa que passemos duas coisas como parâmetro:
// o primeiro é a porta
// o segundo é uma função que vai ser executada quando o servidor estiver no ar
app.listen(PORT, () => {
  console.log("O servidor está no ar, ufa");
});

// http://localhost:3000/mensagem






