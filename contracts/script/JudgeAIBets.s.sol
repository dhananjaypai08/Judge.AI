// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {Judge_AIBets} from "../src/Judge_AIBets.sol";
import {Project} from "../src/types/Index.sol";

contract JudgeAIBetsScript is Script {
    Judge_AIBets public judgeAIBets;

    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address usdcAddress = vm.envAddress("USDC_ADDRESS");

        Project[12] memory projects = [
            Project("Netrum Base Identity", 91, "https://images.unsplash.com/photo-1500000000?w=400&h=400&fit=crop&crop=center", "Revolutionary Base identity protocol enabling seamless onchain authentication and user verification with advanced security features.", "https://devfolio.co/projects/netrum-base-identity-827c", "Infrastructure", "95"),
            Project("AroundTheWorld", 90, "https://images.unsplash.com/photo-1500000001?w=400&h=400&fit=crop&crop=center", "Global travel and exploration platform leveraging Base blockchain for location-based rewards and social gaming experiences.", "https://devfolio.co/projects/aroundtheworld-3de7", "Gaming", "95"),
            Project("ERI", 90, "https://images.unsplash.com/photo-1500000002?w=400&h=400&fit=crop&crop=center", "Next-generation decentralized reputation and identity system built for the Base ecosystem with smart contract integration.", "https://devfolio.co/projects/eri-a999", "Infrastructure", "88"),
            Project("poidh", 90, "https://images.unsplash.com/photo-1500000003?w=400&h=400&fit=crop&crop=center", "Proof-of-achievement social platform where users verify accomplishments through community validation and onchain rewards.", "https://devfolio.co/projects/poidh-e59d", "Social", "90"),
            Project("EventChain", 91, "https://images.unsplash.com/photo-1500000004?w=400&h=400&fit=crop&crop=center", "Decentralized event management platform connecting organizers and attendees with blockchain-based ticketing and verification.", "https://devfolio.co/projects/eventchain-fad3", "Productivity", "90"),
            Project("PoEP", 90, "https://images.unsplash.com/photo-1500000005?w=400&h=400&fit=crop&crop=center", "Proof of Event Participation protocol creating verifiable onchain credentials for digital and physical event attendance.", "https://devfolio.co/projects/poep-5368", "NFT/Creator", "90"),
            Project("Seer (BASED)", 91, "https://images.unsplash.com/photo-1500000006?w=400&h=400&fit=crop&crop=center", "Advanced prediction market platform leveraging collective intelligence for forecasting with Base-native token rewards.", "https://devfolio.co/projects/seer-based-b54a", "DeFi", "88"),
            Project("MortalCoin", 91, "https://images.unsplash.com/photo-1500000007?w=400&h=400&fit=crop&crop=center", "Innovative mortality-based cryptocurrency creating sustainable tokenomics through lifecycle-aware smart contracts.", "https://devfolio.co/projects/mortalcoin-17f0", "DeFi", "88"),
            Project("Umanity", 90, "https://images.unsplash.com/photo-1500000008?w=400&h=400&fit=crop&crop=center", "Humanitarian impact platform connecting donors with verified causes using transparent blockchain-based funding mechanisms.", "https://devfolio.co/projects/umanity-dfdf", "Impact/Social Good", "88"),
            Project("Meta WorkBase", 90, "https://images.unsplash.com/photo-1500000009?w=400&h=400&fit=crop&crop=center", "Decentralized workspace platform for remote collaboration with onchain task management and contributor rewards.", "https://devfolio.co/projects/meta-workbase-b5b5", "Productivity", "88"),
            Project("UPool", 91, "https://images.unsplash.com/photo-1500000010?w=400&h=400&fit=crop&crop=center", "Community-driven liquidity pooling platform enabling users to participate in collective investment strategies on Base.", "https://devfolio.co/projects/upool-88d3", "DeFi", "90"),
            Project("Bloom", 90, "https://images.unsplash.com/photo-1500000011?w=400&h=400&fit=crop&crop=center", "Creative content platform empowering artists and creators with blockchain-based monetization and fan engagement tools.", "https://devfolio.co/projects/bloom-d701", "Entertainment", "90")
        ];

        vm.startBroadcast(deployerPrivateKey);
        judgeAIBets = new Judge_AIBets(projects, usdcAddress);
        vm.stopBroadcast();
        console.log("Contract Deployed to :", address(judgeAIBets));
    }
}
