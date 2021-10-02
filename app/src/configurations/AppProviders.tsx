import { AddressProviderFromJson } from '@anchor-protocol/anchor.js';
import {
  ANCHOR_TX_REFETCH_MAP,
  AnchorWebappProvider,
  createAnchorContractAddress,
  DEFAULT_ADDESS_MAP,
} from '@anchor-protocol/webapp-provider';
import { webworkerMantleFetch } from '@libs/mantle';
import { GlobalStyle } from '@libs/neumorphism-ui/themes/GlobalStyle';
import { patchReactQueryFocusRefetching } from '@libs/patch-react-query-focus-refetching';
import { SnackbarProvider } from '@libs/snackbar';
import { BrowserInactiveProvider } from '@libs/use-browser-inactive';
import { GoogleAnalytics } from '@libs/use-google-analytics';
import { useLongtimeNoSee } from '@libs/use-longtime-no-see';
import { RouterScrollRestoration } from '@libs/use-router-scroll-restoration';
import { RouterWalletStatusRecheck } from '@libs/use-router-wallet-status-recheck';
import { CW20Contract } from '@libs/webapp-fns';
import {
  BankProvider as WebappBankProvider,
  TerraWebappProvider,
} from '@libs/webapp-provider';
import { captureException } from '@sentry/react';
import { ReadonlyWalletSession } from '@terra-dev/readonly-wallet';
import {
  NetworkInfo,
  WalletControllerChainOptions,
  WalletProvider,
} from '@terra-money/wallet-provider';
import { useReadonlyWalletDialog } from 'components/dialogs/useReadonlyWalletDialog';
import { useRequestReloadDialog } from 'components/dialogs/useRequestReloadDialog';
import { SnackbarContainer } from 'components/SnackbarContainer';
import { ThemeProvider } from 'contexts/theme';
import { GA_TRACKING_ID, onProduction } from 'env';
import React, { ReactNode, useCallback } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { BrowserRouter as Router } from 'react-router-dom';

patchReactQueryFocusRefetching();

const queryClient = new QueryClient();

const errorReporter =
  process.env.NODE_ENV === 'production' ? captureException : undefined;

const cw20TokenContracts = (
  network: NetworkInfo,
): Record<string, CW20Contract> => {
  const contractAddressMap = DEFAULT_ADDESS_MAP(network);
  const addressProvider = new AddressProviderFromJson(contractAddressMap);
  const contractAddress = createAnchorContractAddress(
    addressProvider,
    contractAddressMap,
  );

  return {
    uaUST: {
      contractAddress: contractAddress.cw20.aUST,
    },
    ubLuna: {
      contractAddress: contractAddress.cw20.bLuna,
    },
    ubEth: {
      contractAddress: contractAddress.cw20.bEth,
    },
    uANC: {
      contractAddress: contractAddress.cw20.ANC,
    },
    uAncUstLP: {
      contractAddress: contractAddress.cw20.AncUstLP,
    },
    ubLunaLunaLP: {
      contractAddress: contractAddress.cw20.bLunaLunaLP,
    },
  };
};

const maxCapTokenDenoms: Record<string, string> = {
  maxTaxUUSD: 'uusd',
};

function Providers({ children }: { children: ReactNode }) {
  return (
    /** React App routing :: <Link>, <NavLink>, useLocation(), useRouteMatch()... */
    <Router>
      <QueryClientProvider client={queryClient}>
        <BrowserInactiveProvider>
          <TerraWebappProvider
            mantleFetch={webworkerMantleFetch}
            txRefetchMap={ANCHOR_TX_REFETCH_MAP}
            txErrorReporter={errorReporter}
            queryErrorReporter={errorReporter}
          >
            <WebappBankProvider
              cw20TokenContracts={cw20TokenContracts}
              maxCapTokenDenoms={maxCapTokenDenoms}
            >
              <AnchorWebappProvider>
                {/** Theme Providing to Styled-Components and Material-UI */}
                <ThemeProvider initialTheme="light">
                  {/** Snackbar Provider :: useSnackbar() */}
                  <SnackbarProvider>
                    {/** Application Layout */}
                    {children}
                  </SnackbarProvider>
                </ThemeProvider>
              </AnchorWebappProvider>
            </WebappBankProvider>
          </TerraWebappProvider>
        </BrowserInactiveProvider>
      </QueryClientProvider>
    </Router>
  );
}

export function AppProviders({
  children,
  walletConnectChainIds,
  defaultNetwork,
}: { children: ReactNode } & WalletControllerChainOptions) {
  const [openReadonlyWalletSelector, readonlyWalletSelectorElement] =
    useReadonlyWalletDialog();

  const [_openRequestReload, requestReloadElement] = useRequestReloadDialog();

  const openRequestReload = useCallback(
    () => _openRequestReload({}),
    [_openRequestReload],
  );

  const createReadonlyWalletSession = useCallback(
    (networks: NetworkInfo[]): Promise<ReadonlyWalletSession | null> => {
      return openReadonlyWalletSelector({
        networks,
      });
    },
    [openReadonlyWalletSelector],
  );

  // If the user didn't see the app over 2 days,
  // reload browser for more stablity when the user visit again.
  useLongtimeNoSee({ longtime: 1000 * 60 * 60 * 48, onSee: openRequestReload });

  return (
    /** Terra Station Wallet Address :: useWallet() */
    <WalletProvider
      defaultNetwork={defaultNetwork}
      walletConnectChainIds={walletConnectChainIds}
      connectorOpts={{
        bridge: onProduction
          ? 'https://walletconnect.terra.dev/'
          : 'https://tequila-walletconnect.terra.dev/',
      }}
      createReadonlyWalletSession={createReadonlyWalletSession}
    >
      <Providers>
        {/* Router Actions ======================== */}
        {/** Send Google Analytics Page view every Router's location changed */}
        {typeof GA_TRACKING_ID === 'string' && (
          <GoogleAnalytics trackingId={GA_TRACKING_ID} />
        )}
        {/** Scroll Restore every Router's basepath changed */}
        <RouterScrollRestoration />
        {/** Re-Check Terra Station Wallet Status every Router's pathname changed */}
        <RouterWalletStatusRecheck />
        {/* Theme ================================= */}
        {/** Styled-Components Global CSS */}
        <GlobalStyle />
        {/* Layout ================================ */}
        {children}
        {/* Portal ================================ */}
        <SnackbarContainer />

        {readonlyWalletSelectorElement}
        {requestReloadElement}
      </Providers>
    </WalletProvider>
  );
}
