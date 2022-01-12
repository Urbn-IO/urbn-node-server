import { initializePayment } from "../api/payments";
import { isAuth } from "../middleware/isAuth";
import { Arg, Mutation, Resolver, UseMiddleware } from "type-graphql";

@Resolver()
export class PaymentsResolver {
  @Mutation(() => String)
  @UseMiddleware(isAuth)
  async initPayment(
    @Arg("email") email: string,
    @Arg("amount") amount: string
  ) {
    const convertedAmount = parseInt(amount) * 100;
    const convertedAmountString = convertedAmount.toString();
    const data = await initializePayment(email, convertedAmountString);
    return data;
  }
}
