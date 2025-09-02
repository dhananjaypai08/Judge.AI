import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { baseSepolia, base } from 'viem/chains';


const baseCustom = {
  ...base,
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC!] },
    public: { http: [process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC!] }
  }
};

export const config = getDefaultConfig({
  appName: 'Judge.AI Betting',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID!,
  chains: [baseCustom],
  ssr: true,
});

export const SUPPORTED_CHAINS = [baseCustom];