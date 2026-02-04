import { defineChain } from 'viem';

/**
 * Chain configuration type
 */
export interface ChainConfig {
  id: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

/**
 * Monad Testnet chain definition for viem
 */
export const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: {
    name: 'MON',
    symbol: 'MON',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-rpc.monad.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Monad Explorer',
      url: 'https://testnet.monad.xyz',
    },
  },
});

/**
 * Get chain configuration
 */
export function getChainConfig(): ChainConfig {
  return {
    id: monadTestnet.id,
    name: monadTestnet.name,
    rpcUrl: monadTestnet.rpcUrls.default.http[0],
    explorerUrl: monadTestnet.blockExplorers.default.url,
    nativeCurrency: monadTestnet.nativeCurrency,
  };
}
