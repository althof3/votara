// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Script, console} from "forge-std/Script.sol";
import {VotaraVoting} from "../src/VotaraVoting.sol";

contract DeployScript is Script {
    function run() external returns (VotaraVoting) {
        // Get Semaphore address from environment variable
        address semaphoreAddress = vm.envAddress("SEMAPHORE_ADDRESS");
        
        console.log("Deploying VotaraVoting contract...");
        console.log("Semaphore address:", semaphoreAddress);
        
        vm.startBroadcast();
        
        VotaraVoting voting = new VotaraVoting(semaphoreAddress);
        
        vm.stopBroadcast();
        
        console.log("VotaraVoting deployed at:", address(voting));
        
        return voting;
    }
}

