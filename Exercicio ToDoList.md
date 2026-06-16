Exercicio: API DE TO DO LIST

Objetivo:
Construir uma API REST para gerenciamento de tarefas utilizando Express.

---

Entidade principal: Tarefa

Cada tarefa deve possuir os seguintes campos:

* id
* titulo
* descricao
* status (valores permitidos: pendente, em_andamento, concluida)
* prioridade (valores permitidos: baixa, media, alta)
* created_at
* updated_at

---

Requisitos obrigatórios (CRUD)

A API deve implementar os seguintes endpoints:

* POST /tarefas
  Criar uma nova tarefa

* GET /tarefas
  Listar todas as tarefas

* GET /tarefas/:id
  Buscar uma tarefa específica pelo id

* PUT /tarefas/:id
  Atualizar todos os campos de uma tarefa

* PATCH /tarefas/:id
  Atualizar parcialmente uma tarefa

* DELETE /tarefas/:id
  Remover uma tarefa
