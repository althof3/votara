// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Test, console} from "forge-std/Test.sol";
import {VotaraVoting} from "../src/VotaraVoting.sol";
import {ISemaphore} from "@semaphore-protocol/contracts/interfaces/ISemaphore.sol";

contract MockSemaphore {
    mapping(uint256 => bool) public validProofs;

    function setValidProof(uint256 nullifierHash, bool valid) external {
        validProofs[nullifierHash] = valid;
    }

    function validateProof(
        uint256, // groupId
        ISemaphore.SemaphoreProof calldata proof
    ) external view {
        require(validProofs[proof.nullifier], "Invalid proof");
    }
}

contract VotaraVotingTest is Test {
    VotaraVoting public voting;
    MockSemaphore public semaphore;
    
    address public owner;
    address public user1;
    address public user2;
    
    string constant VOTE_ID = "vote-1";
    string constant TITLE = "Test Vote";
    string constant DESCRIPTION = "This is a test vote";
    uint256 constant GROUP_ID = 1;
    uint256 constant TOTAL_OPTIONS = 3;
    uint256 constant DURATION = 7 days;
    
    event VoteCreated(
        string indexed voteId,
        string title,
        uint256 groupId,
        uint256 totalOptions,
        uint256 startTime,
        uint256 endTime
    );
    
    event VoteCast(
        string indexed voteId,
        uint256 optionIndex,
        uint256 nullifierHash
    );
    
    function setUp() public {
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        
        semaphore = new MockSemaphore();
        voting = new VotaraVoting(address(semaphore));
    }
    
    function testCreateVote() public {
        vm.expectEmit(true, false, false, true);
        emit VoteCreated(
            VOTE_ID,
            TITLE,
            GROUP_ID,
            TOTAL_OPTIONS,
            block.timestamp,
            block.timestamp + DURATION
        );
        
        voting.createVote(
            VOTE_ID,
            TITLE,
            DESCRIPTION,
            GROUP_ID,
            TOTAL_OPTIONS,
            DURATION
        );
        
        (
            string memory title,
            string memory description,
            uint256 groupId,
            uint256 totalOptions,
            uint256 totalVotes,
            uint256 startTime,
            uint256 endTime,
            bool active
        ) = voting.getVoteDetails(VOTE_ID);
        
        assertEq(title, TITLE);
        assertEq(description, DESCRIPTION);
        assertEq(groupId, GROUP_ID);
        assertEq(totalOptions, TOTAL_OPTIONS);
        assertEq(totalVotes, 0);
        assertEq(startTime, block.timestamp);
        assertEq(endTime, block.timestamp + DURATION);
        assertTrue(active);
    }
    
    function testCannotCreateDuplicateVote() public {
        voting.createVote(VOTE_ID, TITLE, DESCRIPTION, GROUP_ID, TOTAL_OPTIONS, DURATION);
        
        vm.expectRevert("Vote already exists");
        voting.createVote(VOTE_ID, TITLE, DESCRIPTION, GROUP_ID, TOTAL_OPTIONS, DURATION);
    }
    
    function testCannotCreateVoteWithInsufficientOptions() public {
        vm.expectRevert("Must have at least 2 options");
        voting.createVote(VOTE_ID, TITLE, DESCRIPTION, GROUP_ID, 1, DURATION);
    }
    
    function testCastVote() public {
        voting.createVote(VOTE_ID, TITLE, DESCRIPTION, GROUP_ID, TOTAL_OPTIONS, DURATION);

        uint256 optionIndex = 1;
        uint256 nullifierHash = 12345;

        // Create Semaphore proof struct
        ISemaphore.SemaphoreProof memory proof = ISemaphore.SemaphoreProof({
            merkleTreeDepth: 20,
            merkleTreeRoot: 1,
            nullifier: nullifierHash,
            message: optionIndex,
            scope: GROUP_ID,
            points: [uint256(0), 0, 0, 0, 0, 0, 0, 0]
        });

        // Set valid proof in mock
        semaphore.setValidProof(nullifierHash, true);

        vm.expectEmit(true, false, false, true);
        emit VoteCast(VOTE_ID, optionIndex, nullifierHash);

        voting.castVote(VOTE_ID, optionIndex, proof);

        uint256 voteCount = voting.getVoteCount(VOTE_ID, optionIndex);
        assertEq(voteCount, 1);
    }

    function testCannotCastVoteWithInvalidProof() public {
        voting.createVote(VOTE_ID, TITLE, DESCRIPTION, GROUP_ID, TOTAL_OPTIONS, DURATION);

        uint256 optionIndex = 1;
        uint256 nullifierHash = 12345;

        ISemaphore.SemaphoreProof memory proof = ISemaphore.SemaphoreProof({
            merkleTreeDepth: 20,
            merkleTreeRoot: 1,
            nullifier: nullifierHash,
            message: optionIndex,
            scope: GROUP_ID,
            points: [uint256(0), 0, 0, 0, 0, 0, 0, 0]
        });

        // Don't set valid proof - should fail
        vm.expectRevert("Invalid proof");
        voting.castVote(VOTE_ID, optionIndex, proof);
    }

    function testCannotCastVoteAfterEnd() public {
        voting.createVote(VOTE_ID, TITLE, DESCRIPTION, GROUP_ID, TOTAL_OPTIONS, DURATION);

        // Fast forward past end time
        vm.warp(block.timestamp + DURATION + 1);

        uint256 optionIndex = 1;
        uint256 nullifierHash = 12345;

        ISemaphore.SemaphoreProof memory proof = ISemaphore.SemaphoreProof({
            merkleTreeDepth: 20,
            merkleTreeRoot: 1,
            nullifier: nullifierHash,
            message: optionIndex,
            scope: GROUP_ID,
            points: [uint256(0), 0, 0, 0, 0, 0, 0, 0]
        });

        semaphore.setValidProof(nullifierHash, true);

        vm.expectRevert("Vote has ended");
        voting.castVote(VOTE_ID, optionIndex, proof);
    }

    function testEndVote() public {
        voting.createVote(VOTE_ID, TITLE, DESCRIPTION, GROUP_ID, TOTAL_OPTIONS, DURATION);

        voting.endVote(VOTE_ID);

        (, , , , , , , bool active) = voting.getVoteDetails(VOTE_ID);
        assertFalse(active);
    }

    function testGetAllVoteCounts() public {
        voting.createVote(VOTE_ID, TITLE, DESCRIPTION, GROUP_ID, TOTAL_OPTIONS, DURATION);

        // Cast votes for different options
        for (uint256 i = 0; i < TOTAL_OPTIONS; i++) {
            uint256 nullifierHash = 1000 + i;

            ISemaphore.SemaphoreProof memory proof = ISemaphore.SemaphoreProof({
                merkleTreeDepth: 20,
                merkleTreeRoot: 1,
                nullifier: nullifierHash,
                message: i,
                scope: GROUP_ID,
                points: [uint256(0), 0, 0, 0, 0, 0, 0, 0]
            });

            semaphore.setValidProof(nullifierHash, true);

            voting.castVote(VOTE_ID, i, proof);
        }

        uint256[] memory counts = voting.getAllVoteCounts(VOTE_ID);
        assertEq(counts.length, TOTAL_OPTIONS);

        for (uint256 i = 0; i < TOTAL_OPTIONS; i++) {
            assertEq(counts[i], 1);
        }
    }

    function testGetTotalVotes() public {
        voting.createVote(VOTE_ID, TITLE, DESCRIPTION, GROUP_ID, TOTAL_OPTIONS, DURATION);
        voting.createVote("vote-2", "Vote 2", "Description 2", GROUP_ID, 2, DURATION);

        assertEq(voting.getTotalVotes(), 2);
    }

    function testGetVoteIdByIndex() public {
        voting.createVote(VOTE_ID, TITLE, DESCRIPTION, GROUP_ID, TOTAL_OPTIONS, DURATION);

        string memory retrievedId = voting.getVoteIdByIndex(0);
        assertEq(retrievedId, VOTE_ID);
    }
}

