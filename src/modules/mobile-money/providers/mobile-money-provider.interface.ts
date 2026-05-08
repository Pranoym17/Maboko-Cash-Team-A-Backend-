import { MobileMoneyDepositDto } from '../dto/mobile-money-deposit.dto';
import { MobileMoneyWithdrawDto } from '../dto/mobile-money-withdraw.dto';

export interface IMobileMoneyProvider {
  initiateDeposit(dto: MobileMoneyDepositDto, reference: string): Promise<any>;
  initiateWithdrawal(dto: MobileMoneyWithdrawDto, reference: string): Promise<any>;
}
