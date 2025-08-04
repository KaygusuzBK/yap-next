import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Project } from './project.entity';
import { Task } from './task.entity';
import { Comment } from './comment.entity';

export enum UserRole {
  ADMIN = 'admin',
  PROJECT_LEADER = 'project_leader',
  TEAM_MEMBER = 'team_member',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ nullable: true })
  avatar?: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.TEAM_MEMBER,
  })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  lastActive?: Date;

  // Relations
  @OneToMany(() => Project, project => project.owner)
  ownedProjects: Project[];

  @OneToMany(() => Task, task => task.assignee)
  assignedTasks: Task[];

  @OneToMany(() => Comment, comment => comment.author)
  comments: Comment[];
} 