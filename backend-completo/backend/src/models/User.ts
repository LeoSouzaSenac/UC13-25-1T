import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm"
import { Post } from "./Post"


@Entity('users') // cria uma tabela chamada 'users'
export class User{

    @PrimaryGeneratedColumn() // marca o atributo como uma coluna com PRIMARY KEY
    id:number

    // lenght define qual o número máximo de caracteres
    // nullable:false marca a coluna como NOT NULL
    @Column({length:100, nullable:false}) // marca o atributo como uma coluna comum
    name:string

    // unique:true marca a coluna como UNIQUE
    @Column({length:100, unique:true})
    email:string

    
    @Column({length:255, nullable:false})
    password:string

    // um para muitos
    // um usuário pode ter MUITOS posts
    // passamos dois parâmetros:
    // o primeiro é uma arrow function que retorna a entidade/model com a qual User se relaciona (Post)
    // o segundo parâmetro indica qual a propriedade dentro da model Post que referencia o User. 
    // com isso, temos as nossas chaves estrangeiras criadas
    @OneToMany(() => Post, post => post.user)
    posts: Post[]
}