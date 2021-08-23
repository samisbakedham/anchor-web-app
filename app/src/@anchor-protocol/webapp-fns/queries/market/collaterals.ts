import { bAsset, JSDateTime, u, UST } from '@anchor-protocol/types';

export interface MarketCollateralsHistory {
  timestamp: JSDateTime;
  total_value: u<UST>;
  collaterals: Array<{ symbol: string; collateral: u<bAsset>; price: UST }>;
}

export interface MarketCollateralsData {
  now: MarketCollateralsHistory;
  history: MarketCollateralsHistory[];
}

export type MarketCollateralsQueryParams = {
  endpoint: string;
};

export async function marketCollateralsQuery({
  endpoint,
}: MarketCollateralsQueryParams): Promise<MarketCollateralsData> {
  const now: MarketCollateralsHistory = await fetch(`${endpoint}/collaterals`)
    .then((res) => res.json())
    .then((data: MarketCollateralsHistory) => ({
      ...data,
      timestamp: Date.now() as JSDateTime,
    }));

  const history: MarketCollateralsHistory[] = await fetch(
    `${endpoint}/collaterals/1d`,
  )
    .then((res) => res.json())
    .then((data: MarketCollateralsHistory[]) => {
      return [...data.reverse(), now];
    });

  return {
    now,
    history,
  };
}
