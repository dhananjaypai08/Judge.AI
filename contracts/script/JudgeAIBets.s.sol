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
            Project("Project Alpha", 10, "https://example.com/alpha", "AI project Alpha description.", "https://devfolio.co/alpha", "Track A", "95"),
            Project("Project Beta", 8, "https://example.com/beta", "AI project Beta description.", "https://devfolio.co/beta", "Track B", "90"),
            Project("Project Gamma", 7, "https://example.com/gamma", "AI project Gamma description.", "https://devfolio.co/gamma", "Track C", "88"),
            Project("Project Delta", 9, "https://example.com/delta", "AI project Delta description.", "https://devfolio.co/delta", "Track D", "92"),
            Project("Project Epsilon", 6, "https://example.com/epsilon", "AI project Epsilon description.", "https://devfolio.co/epsilon", "Track E", "85"),
            Project("Project Zeta", 8, "https://example.com/zeta", "AI project Zeta description.", "https://devfolio.co/zeta", "Track F", "89"),
            Project("Project Eta", 7, "https://example.com/eta", "AI project Eta description.", "https://devfolio.co/eta", "Track G", "87"),
            Project("Project Theta", 9, "https://example.com/theta", "AI project Theta description.", "https://devfolio.co/theta", "Track H", "93"),
            Project("Project Iota", 5, "https://example.com/iota", "AI project Iota description.", "https://devfolio.co/iota", "Track I", "80"),
            Project("Project Kappa", 6, "https://example.com/kappa", "AI project Kappa description.", "https://devfolio.co/kappa", "Track J", "84"),
            Project("Project Lambda", 8, "https://example.com/lambda", "AI project Lambda description.", "https://devfolio.co/lambda", "Track K", "91"),
            Project("Project Mu", 7, "https://example.com/mu", "AI project Mu description.", "https://devfolio.co/mu", "Track L", "86")
        ];

        vm.startBroadcast(deployerPrivateKey);
        judgeAIBets = new Judge_AIBets(projects, usdcAddress);
        vm.stopBroadcast();
        console.log("Contract Deployed to :", address(judgeAIBets));
    }
}
