// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { NotOwner, ReentrantCall, NoETH, ProjectNotFound, NoZeroValue, AlreadyDeclared, NotDeclared, NoWinners } from "./errors/Index.sol" ;
import { Project } from "./types/Index.sol";
import { IERC20 } from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";


contract Judge_AIBets {
    address private owner;
    bool private _locked;
    Project[12] private projects;
    IERC20 private immutable usdc;
    uint8 public constant totalProjects = 12;
    uint256 public constant HOUSE_EDGE_BPS = 100; // 1% (basis points)

    mapping(address => mapping(uint8 => uint256[2])) private USDCuser_bets; // [0]=win, [1]=lose
    mapping(uint8 => uint256[2]) private USDCbets_onproject; // [0]=win, [1]=lose

    mapping(uint8 => bool) private projectDeclared;
    mapping(uint8 => bool) private projectResult;

    address[] private usdcBettors;
    mapping(address => bool) private isUsdcBettor;

    mapping(address => mapping(uint8 => bool)) public rewardClaimed;

    event Bet(address user, uint8 projectId, uint256 amount, bool onWin, uint256 timestamp);
    event ProjectResultDeclared(uint8 projectId, bool result);
    event RewardPaid(address user, uint256 amount);
    event OwnerChanged(address oldOwner, address newOwner);

    modifier nonReentrant() {
        if (_locked) revert ReentrantCall();
        _locked = true;
        _;
        _locked = false;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner(msg.sender);
        _;
    }

    constructor(Project[12] memory _projects, address _usdc) {
        owner = msg.sender;
        projects = _projects;
        usdc = IERC20(_usdc);
    }

    function changeOwner(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero address");
        emit OwnerChanged(owner, newOwner);
        owner = newOwner;
    }

    function getAllProjects() public view returns (Project[12] memory) {
        return projects;
    }


    function betOnProjectWithUSDC(uint8 projectId, uint256 amount, bool onWin) external nonReentrant {
        if (amount == 0) revert NoZeroValue();
        if (projectId > 11) revert ProjectNotFound(projectId);
        if (!isUsdcBettor[msg.sender]) {
            usdcBettors.push(msg.sender);
            isUsdcBettor[msg.sender] = true;
        }
        uint8 outcome = onWin ? 0 : 1;
        USDCuser_bets[msg.sender][projectId][outcome] += amount;
        USDCbets_onproject[projectId][outcome] += amount;
        usdc.transferFrom(msg.sender, address(this), amount);
        emit Bet(msg.sender, projectId, amount, onWin, block.timestamp);
    }



    function getUserBetsUSDC(address user, uint8 projectId) public view returns (uint256 winBet, uint256 loseBet) {
        winBet = USDCuser_bets[user][projectId][0];
        loseBet = USDCuser_bets[user][projectId][1];
    }

    function getUSDCBetsOnProject(uint8 projectId) public view returns (uint256 winTotal, uint256 loseTotal) {
        winTotal = USDCbets_onproject[projectId][0];
        loseTotal = USDCbets_onproject[projectId][1];
    }

    function declareProjectResult(uint8 projectId, bool result) external onlyOwner nonReentrant {
        if (projectId > 11) revert ProjectNotFound(projectId);
        if (projectDeclared[projectId]) revert AlreadyDeclared(projectId);
        projectDeclared[projectId] = true;
        projectResult[projectId] = result;
        emit ProjectResultDeclared(projectId, result);
    }

    function claimReward(uint8 projectId) external nonReentrant {
        require(projectDeclared[projectId], "Not declared");
        require(!rewardClaimed[msg.sender][projectId], "Already claimed");
        uint8 outcome = projectResult[projectId] ? 0 : 1;
        uint256 userBet = USDCuser_bets[msg.sender][projectId][outcome];
        require(userBet > 0, "No winning bet");
        uint256 totalWinningPool = USDCbets_onproject[projectId][outcome];
        uint256 totalLosingPool = USDCbets_onproject[projectId][1 - outcome];
        require(totalWinningPool > 0, "No winners");
        uint256 houseEdge = (totalLosingPool * HOUSE_EDGE_BPS) / 10000;
        uint256 distributable = totalLosingPool - houseEdge;
        uint256 reward = userBet;
        if (distributable > 0) {
            reward += (userBet * distributable) / totalWinningPool;
        }
        rewardClaimed[msg.sender][projectId] = true;
        require(usdc.transfer(msg.sender, reward), "USDC Transfer failed");
        emit RewardPaid(msg.sender, reward);
    }

    function getProjectResult(uint8 projectId) public view returns (bool declared, bool result) {
        if (projectId > 11) revert ProjectNotFound(projectId);
        declared = projectDeclared[projectId];
        result = projectResult[projectId];
    }

    function hasUserWonUSDC(address user, uint8 projectId) public view returns (bool) {
        if (projectId > 11) revert ProjectNotFound(projectId);
        if (!projectDeclared[projectId]) return false;
        uint8 outcome = projectResult[projectId] ? 0 : 1;
        return USDCuser_bets[user][projectId][outcome] > 0;
    }

    function withdrawFromContract(address recipient) external onlyOwner {
        for (uint8 i = 0; i < totalProjects; i++) {
            require(projectDeclared[i], "All results not declared");
        }
        usdc.transfer(recipient, usdc.balanceOf(address(this)));
    }

    receive() external payable {
        revert("ETH not accepted");
    }

    fallback() external payable {
        revert("ETH not accepted");
    }
}
