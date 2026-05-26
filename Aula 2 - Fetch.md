# Consumindo APIs com `fetch()` e Métodos HTTP

# 1. Introdução

Na aula passada aprendemos o que é uma API.

Agora vamos aprender como o JavaScript conversa com APIs usando:

* `fetch()`
* Métodos HTTP
* `async`
* `await`

Com isso será possível:

* buscar dados;
* enviar informações;
* atualizar informações;
* apagar informações.

---

# 2. O Que é `fetch()`?

`fetch()` é uma função do JavaScript usada para fazer requisições HTTP.

Ela envia pedidos para APIs e recebe respostas.

Exemplo:

```js id="qq7j6q"
fetch("https://api.exemplo.com")
```

---

# 3. O Que é HTTP?

HTTP é o protocolo usado para comunicação entre:

* navegadores;
* sites;
* APIs;
* servidores.

Toda vez que acessamos um site ou API, usamos HTTP.

---

# 4. Métodos HTTP

Os métodos HTTP indicam o que queremos fazer.

Os principais são:

| Método | Função          |
| ------ | --------------- |
| GET    | Buscar dados    |
| POST   | Criar dados     |
| PUT    | Atualizar dados |
| DELETE | Apagar dados    |

---

# 5. GET — Buscar Informações

O método GET é usado para pegar dados.

Exemplo:

* buscar usuários;
* buscar produtos;
* buscar Pokémon.

---

## Exemplo GET

```js id="y1j5oo"
fetch("https://pokeapi.co/api/v2/pokemon/pikachu")
```

Esse código busca informações do Pikachu.

---

# 6. POST — Criar Informações

POST é usado para enviar novos dados para a API.

Exemplo:

* criar usuário;
* cadastrar produto;
* enviar mensagem.

---

# 7. PUT — Atualizar Informações

PUT é usado para atualizar algo que já existe.

Exemplo:

* editar usuário;
* alterar senha;
* atualizar produto.

---

# 8. DELETE — Apagar Informações

DELETE remove informações.

Exemplo:

* apagar usuário;
* remover comentário;
* excluir produto.

---

# 9. O Problema da Internet

A resposta da API não chega instantaneamente.

A internet demora alguns milissegundos.

Por isso usamos:

* `async`
* `await`

---

# 10. O Que é `async`?

`async` transforma a função em assíncrona.

Ela permite usar `await`.

---

## Exemplo

```js id="vrxnjm"
async function buscarDados() {

}
```

---

# 11. O Que é `await`?

`await` significa:

> “Espere terminar.”

---

## Exemplo

```js id="uvjef8"
const resposta = await fetch("https://api.exemplo.com");
```

O JavaScript espera a resposta da API.

---

# 12. Estrutura Básica do `fetch()`

```js id="b0ffx1"
async function buscarDados() {

    const resposta = await fetch("URL");

    const dados = await resposta.json();

    console.log(dados);

}
```

---

# 13. Entendendo Cada Parte

## Fazendo a requisição

```js id="6c05sa"
await fetch("URL");
```

Faz o pedido para a API.

---

## Convertendo JSON

```js id="x7zdfm"
await resposta.json();
```

Transforma a resposta em objeto JavaScript.

---

## Mostrando os dados

```js id="4d06um"
console.log(dados);
```

Exibe os dados no console.

---

# 14. O Que é JSON?

JSON é um formato usado para troca de informações.

Exemplo:

```json id="x09iwm"
{
    "nome": "Leonardo",
    "idade": 25
}
```

---

# 15. Acessando Dados JSON

```js id="av7gkp"
dados.nome
dados.idade
```

---

# 16. Exemplo Completo com GET

## HTML

```html id="o5izcr"
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>Pokémon API</title>
</head>
<body>

    <h1>Buscar Pokémon</h1>

    <input id="pokemon">

    <button onclick="buscarPokemon()">
        Buscar
    </button>

    <h2 id="nome"></h2>

    <img id="imagem">

    <script src="script.js"></script>

</body>
</html>
```

---

# 17. JavaScript

```js id="jndqu3"
async function buscarPokemon() {

    const pokemon = document
        .getElementById("pokemon")
        .value;

    const resposta = await fetch(
        `https://pokeapi.co/api/v2/pokemon/${pokemon}`
    );

    const dados = await resposta.json();

    document.getElementById("nome")
        .textContent = dados.name;

    document.getElementById("imagem")
        .src = dados.sprites.front_default;
}
```

---

# 18. Fluxo da Aplicação

1. Usuário digita o Pokémon
2. Usuário clica no botão
3. `fetch()` faz o pedido
4. API responde
5. JSON é convertido
6. Dados aparecem na tela

---

# 19. Configurando Métodos HTTP

Por padrão, `fetch()` usa GET.

Mas podemos configurar outros métodos.

A configuração fica dentro de um objeto.

---

# 20. Estrutura Completa do `fetch`

```js id="8p96im"
fetch("URL", {

    method: "GET"

})
```

---

# 21. Exemplo de POST

```js id="gwyvbj"
fetch("https://api.exemplo.com/usuarios", {

    method: "POST"

})
```

---

# 22. Enviando Dados com POST

Quando usamos POST, normalmente enviamos informações.

Exemplo:

* nome;
* email;
* senha.

---

# 23. Body

Os dados enviados ficam em:

```js id="d03gmy"
body
```

---

# 24. Exemplo Completo de POST

```js id="g70iq4"
async function cadastrarUsuario() {

    const resposta = await fetch(
        "https://jsonplaceholder.typicode.com/users",
        {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                nome: "Leonardo",
                idade: 25

            })

        }
    );

    const dados = await resposta.json();

    console.log(dados);

}
```

---

# 25. Explicando o POST

## method

```js id="h3cl8p"
method: "POST"
```

Define o método HTTP.

---

## headers

```js id="xgx4m4"
headers: {
    "Content-Type": "application/json"
}
```

Informa para a API que estamos enviando JSON.

---

## body

```js id="pbjlwm"
body: JSON.stringify({
    nome: "Leonardo"
})
```

Envia os dados.

---

## JSON.stringify()

Transforma objeto JavaScript em JSON.

---

# 26. Exemplo PUT

```js id="b6w7u0"
fetch("https://api.exemplo.com/usuarios/1", {

    method: "PUT",

    headers: {
        "Content-Type": "application/json"
    },

    body: JSON.stringify({

        nome: "Novo Nome"

    })

})
```

Atualiza um usuário.

---

# 27. Exemplo DELETE

```js id="e3d38u"
fetch("https://api.exemplo.com/usuarios/1", {

    method: "DELETE"

})
```

Remove um usuário.

---

# 28. Tratamento de Erros

Problemas podem acontecer:

* internet caiu;
* API offline;
* dados inválidos.

Para isso usamos:

* `try`
* `catch`

---

# 29. Exemplo com `try/catch`

```js id="7gsqgq"
async function buscarPokemon() {

    try {

        const resposta = await fetch(
            "https://pokeapi.co/api/v2/pokemon/pikachu"
        );

        const dados = await resposta.json();

        console.log(dados);

    } catch {

        console.log("Erro ao buscar dados");

    }
}
```

---

# 30. Exercícios

## Exercício 1

Busque:

* pikachu
* mewtwo
* charizard

---

## Exercício 2

Mostre:

* nome;
* altura;
* peso.

---

## Exercício 3

Crie um formulário que envie:

* nome;
* email.

Usando POST.

---

## Exercício 4

Faça um botão de deletar usando DELETE.
