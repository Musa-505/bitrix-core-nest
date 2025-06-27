// core-service/src/users/user.entity.ts
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

export enum UserStage {
  NEW = 'NEW',
  PREPAYMENT_INVOICE = 'PREPAYMENT_INVOICE',
  CONTRACT_SIGNED = 'CONTRACT_SIGNED',
  COMPLETED = 'COMPLETED',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  full_name: string;

  @Column({ unique: true })
  phone: string;

  @Column({
    type: 'enum',
    enum: UserStage,
    default: UserStage.NEW,
  })
  stage: UserStage;

  @Column({ nullable: true })
  bitrix_id?: number;
}