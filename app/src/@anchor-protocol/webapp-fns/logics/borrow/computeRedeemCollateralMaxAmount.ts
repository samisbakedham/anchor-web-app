import type { bAsset, Rate, u } from '@anchor-protocol/types';
import { moneyMarket } from '@anchor-protocol/types';
import big, { Big, BigSource } from 'big.js';

// maxAmount = balance - (loan_amount / bLunaMaxLtv / oraclePrice)

// TODO
export function computeRedeemCollateralMaxAmount(
  marketBorrowerInfo: moneyMarket.market.BorrowerInfoResponse,
  overseerCollaterals: moneyMarket.overseer.CollateralsResponse,
  oraclePrices: moneyMarket.oracle.PricesResponse,
  maxLtv: Rate<BigSource>,
): u<bAsset<Big>> {
  return big(0) as u<bAsset<Big>>;
  //const withdrawable = big(borrower.balance).minus(
  //  big(borrowInfo.loan_amount).div(bLunaMaxLtv).div(oracle.rate),
  //);
  //return (withdrawable.lt(0) ? big(0) : withdrawable) as ubLuna<Big>;
}
