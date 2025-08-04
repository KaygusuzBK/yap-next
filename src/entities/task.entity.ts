import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { User } from './user.entity';
import { Project } from './project.entity';
import { Comment } from './comment.entity';

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  COMPLETED = 'completed',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.TODO,
  })
  status: TaskStatus;

  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
  })
  priority: TaskPriority;

  @Column({ nullable: true })
  assigneeId?: string;

  @Column()
  projectId: string;

  @Column({ type: 'date', nullable: true })
  dueDate?: Date;

  @Column({ type: 'int', nullable: true })
  estimatedHours?: number;

  @Column({ type: 'int', default: 0 })
  actualHours: number;

  @Column({ nullable: true })
  parentTaskId?: string;

  @Column({ type: 'simple-array', nullable: true })
  dependencies: string[];

  @Column({ type: 'simple-array', default: [] })
  tags: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, user => user.assignedTasks)
  assignee: User;

  @ManyToOne(() => Project, project => project.tasks)
  project: Project;

  @OneToMany(() => Comment, comment => comment.task)
  comments: Comment[];

  @ManyToOne(() => Task, task => task.subtasks, { nullable: true })
  parentTask: Task;

  @OneToMany(() => Task, task => task.parentTask)
  subtasks: Task[];
} 