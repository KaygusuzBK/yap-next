import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';
import { Project } from './project.entity';
import { Task } from './task.entity';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  content: string;

  @Column()
  authorId: string;

  @Column({ nullable: true })
  taskId?: string;

  @Column({ nullable: true })
  projectId?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, user => user.comments)
  author: User;

  @ManyToOne(() => Task, task => task.comments, { nullable: true })
  task: Task;

  @ManyToOne(() => Project, { nullable: true })
  project: Project;
} 