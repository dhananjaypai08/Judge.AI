import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { baseSepolia } from 'viem/chains';

// Define Base Sepolia with custom RPC
const baseSepoliaCustom = {
  ...baseSepolia,
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC!] },
    public: { http: [process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC!] }
  }
};

export const config = getDefaultConfig({
  appName: 'Judge.AI Betting',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID!,
  chains: [baseSepoliaCustom],
  ssr: true,
});

export const SUPPORTED_CHAINS = [baseSepoliaCustom];