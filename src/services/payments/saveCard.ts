import { CardAuthorization } from "../../entities/CardAuthorization";
import { User } from "../../entities/User";
import { TransactionsMetadata } from "../../types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const saveCardPaystack = async (payload: any) => {
  const metadata = payload.metadata as TransactionsMetadata;
  const userId = metadata.userId;
  const defaultCard = String(metadata.defaultCard) === "true";
  const email = metadata.email;
  const {
    authorization_code,
    card_type,
    last4,
    exp_month,
    exp_year,
    bin,
    bank,
    channel,
    signature,
    reusable,
    country_code,
    account_name,
  } = payload.authorization;
  try {
    const user = await User.findOne({ where: { userId } });

    await CardAuthorization.create({
      email,
      accountName: account_name,
      authorizationCode: authorization_code,
      cardType: card_type,
      last4,
      expMonth: exp_month,
      expYear: exp_year,
      bin,
      bank,
      channel,
      signature,
      reusable,
      countryCode: country_code,
      user,
      defaultCard,
    } as CardAuthorization).save();
  } catch (err) {
    console.error(err);
  }
};
