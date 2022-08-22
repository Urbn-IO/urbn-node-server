import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class CallLogs extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  requestId: number;
  @Column()
  participantA: string;
  @Column({ nullable: true })
  participantB?: string;
  @Column()
  callDurationInSeconds: number;
  @Column({ nullable: true })
  elapsedDurationInSeconds?: number;
}
