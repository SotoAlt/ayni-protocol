import { defineChain } from 'viem';

// Monad Testnet chain configuration
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

// Contract addresses (to be updated after deployment)
export const contracts = {
  ayniRegistry: process.env.AYNI_REGISTRY_ADDRESS || '0x0000000000000000000000000000000000000000',
  messageAttestation: process.env.MESSAGE_ATTESTATION_ADDRESS || '0x0000000000000000000000000000000000000000',
  agentRegistry: process.env.AGENT_REGISTRY_ADDRESS || '0x0000000000000000000000000000000000000000',
} as const;

// Server configuration
export const serverConfig = {
  port: parseInt(process.env.PORT || '3000'),
  host: process.env.HOST || '0.0.0.0',
};

// x402 pricing (in MON)
export const pricing = {
  attest: '0.01',      // Gas costs covered
  send: '0.001',       // Server bandwidth
  render: '0.001',     // PNG/SVG compute
  relay: '0.002',      // Encrypted payload relay
} as const;
