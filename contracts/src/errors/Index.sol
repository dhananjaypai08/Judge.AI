// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

error NotOwner(address user);
error ReentrantCall();
error NoETH(address user);
error ProjectNotFound(uint8 id);
error NoZeroValue();
error AlreadyDeclared(uint8 projectId);
error NotDeclared(uint8 projectId);
error NoWinners(uint8 projectId);