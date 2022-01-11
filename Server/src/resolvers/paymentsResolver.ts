import { initializePayment } from "../api/payments";
import { isAuth } from "../middleware/isAuth";
import { Mutation, Resolver, UseMiddleware } from "type-graphql";

@Resolver()
export class PaymentsResolver {
  @Mutation(() => String)
  @UseMiddleware(isAuth)
  async initPayment() {
    const data = await initializePayment();
    return data;
  }
}
