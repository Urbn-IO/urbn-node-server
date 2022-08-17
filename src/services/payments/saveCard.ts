import { CardAuthorization } from "../../entities/CardAuthorization";
import { User } from "../../entities/User";

export const saveCardPaystack = async (payload: any) => {
  const userId = payload.metadata.userId;
  const defaultCard = payload.metadata.defaultCard;
  const email = payload.metadata.email;
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
