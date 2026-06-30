# Atividade - Criando entidades com TypeORM

## Objetivo

Nesta atividade, você deverá aplicar os conceitos estudados em aula para criar um projeto utilizando **TypeScript** e **TypeORM**, modelando duas entidades relacionadas e gerando as tabelas no banco de dados.

---

## Cenário

Você irá desenvolver um sistema simples para armazenar informações sobre **Seleções** e seus **Jogadores**.

Uma **Seleção** pode possuir vários **Jogadores**, e cada **Jogador** pertence a apenas uma **Seleção**.

---

## Entidades

### Seleção

A entidade **Seleção** deve possuir os seguintes atributos:

- `id`
- `nome`
- `pais`
- `tecnico`
- `rankingFifa`
- `anoFundacao`

---

### Jogador

A entidade **Jogador** deve possuir os seguintes atributos:

- `id`
- `nome`
- `numeroCamisa`
- `posicao`
- `idade`
- `altura`
- `peso`
- `gols`

---

## Relacionamento

Implemente o relacionamento entre as entidades utilizando o TypeORM:

- Uma **Seleção** possui vários **Jogadores**
- Um **Jogador** pertence a apenas uma **Seleção**

---

## O que deve ser entregue

Ao final da atividade, o projeto deve conter:

- Projeto configurado com **TypeScript** e **TypeORM**;
- As entidades `Selecao` e `Jogador`;
- O relacionamento entre as entidades corretamente implementado;
- As tabelas criadas no banco de dados por meio do TypeORM.
