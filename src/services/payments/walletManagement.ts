import AppDataSource from '../../config/ormconfig';
import { User } from '../../entities/User';
import { Wallet } from '../../entities/Wallet';
import { WalletTransactions } from '../../entities/WalletTransactions';
import { Currency } from '../../types';

export const createWallet = async (userId: string, currency: Currency) => {
  try {
    const user = await AppDataSource.getRepository(User)
      .createQueryBuilder('user')
      .where('user.userId = :userId', { userId })
      .select('user.id')
      .leftJoinAndSelect('user.wallet', 'wallet')
      .getOne();
    if (!user) return;
    if (!user.wallet) {
      const wallet = Wallet.create({ currency });
      user.wallet = wallet;
      await user.save();
      return;
    }
    return;
  } catch (err) {
    console.log(err);
    return;
  }
};

export const updateWallet = async (userId: string, amount: string) => {
  try {
    const user = await AppDataSource.getRepository(User)
      .createQueryBuilder('user')
      .where('user.userId = :userId', { userId })
      .select('user.id')
      .leftJoinAndSelect('user.wallet', 'wallet')
      .getOne();
    if (!user) return;
    if (!user.wallet) return;
    const walletId = user.wallet.id;
    await Wallet.update(walletId, { balance: amount });
    return;
  } catch (err) {
    console.log(err);
    return;
  }
};

export const createWalletTransaction = async (data: WalletTransactions) => {
  try {
    await WalletTransactions.save(data);
    return;
  } catch (err) {
    console.log(err);
    return;
  }
};
