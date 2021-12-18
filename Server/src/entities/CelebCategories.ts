import {
  BaseEntity,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import { Categories } from "./Categories";
import { Celebrity } from "./Celebrity";

@Entity()
export class CelebCategories extends BaseEntity {
  @PrimaryColumn()
  celebId: number;

  @PrimaryColumn()
  categoryId: number;

  @ManyToOne(() => Celebrity, (celebrity) => celebrity.categoriesConn, {
    primary: true,
  })
  @JoinColumn({ name: "celebId" })
  celebrity: Promise<Celebrity>;

  @ManyToOne(() => Categories, (categories) => categories.celebConn, {
    primary: true,
  })
  @JoinColumn({ name: "categoryId" })
  category: Promise<Categories>;
}
