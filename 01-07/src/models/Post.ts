import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm"
import { User } from "./User"


@Entity('posts')
export class Post{
    @PrimaryGeneratedColumn()
    id:number

    @Column({type:"varchar", length:100, nullable:false})
    title:string

    @ManyToOne(() => User, user => user.posts)
    user:User
}