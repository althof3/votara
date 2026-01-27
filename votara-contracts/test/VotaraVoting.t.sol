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

    bytes32 constant POLL_ID = keccak256("poll-1");
    uint256 constant GROUP_ID = 1;

    event PollActivated(
        bytes32 indexed pollId,
        uint256 groupId
    );

    event VoteCast(
        bytes32 indexed pollId,
        uint8 optionIndex,
        uint256 nullifierHash
    );

    function setUp() public {
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");

        semaphore = new MockSemaphore();
        voting = new VotaraVoting(address(semaphore));
    }

    function testCreatePoll() public {
        vm.expectEmit(true, false, false, true);
        emit PollActivated(POLL_ID, GROUP_ID);

        voting.activatePoll(POLL_ID, GROUP_ID);

        assertTrue(voting.pollExists(POLL_ID));
        assertEq(voting.getPollGroupId(POLL_ID), GROUP_ID);
    }

    function testCannotCreateDuplicatePoll() public {
        voting.activatePoll(POLL_ID, GROUP_ID);

        vm.expectRevert("Poll already exists");
        voting.activatePoll(POLL_ID, GROUP_ID);
    }

    function testCastVote() public {
        voting.activatePoll(POLL_ID, GROUP_ID);

        uint8 optionIndex = 1;
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
        emit VoteCast(POLL_ID, optionIndex, nullifierHash);

        voting.castVote(POLL_ID, optionIndex, proof);

        uint256 voteCount = voting.getVoteCount(POLL_ID, optionIndex);
        assertEq(voteCount, 1);
    }

    function testCannotCastVoteWithInvalidProof() public {
        voting.activatePoll(POLL_ID, GROUP_ID);

        uint8 optionIndex = 1;
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
        voting.castVote(POLL_ID, optionIndex, proof);
    }

    function testCannotCastVoteOnNonExistentPoll() public {
        bytes32 fakePollId = keccak256("fake-poll");
        uint8 optionIndex = 1;
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

        vm.expectRevert("Poll does not exist");
        voting.castVote(fakePollId, optionIndex, proof);
    }

    function testMultipleVotesOnDifferentOptions() public {
        voting.activatePoll(POLL_ID, GROUP_ID);

        // Cast votes for different options
        for (uint8 i = 0; i < 3; i++) {
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

            voting.castVote(POLL_ID, i, proof);
        }

        // Check vote counts
        assertEq(voting.getVoteCount(POLL_ID, 0), 1);
        assertEq(voting.getVoteCount(POLL_ID, 1), 1);
        assertEq(voting.getVoteCount(POLL_ID, 2), 1);
    }

    function testGetTotalPolls() public {
        voting.activatePoll(POLL_ID, GROUP_ID);
        voting.activatePoll(keccak256("poll-2"), GROUP_ID);

        assertEq(voting.getTotalPolls(), 2);
    }

    function testGetPollIdByIndex() public {
        voting.activatePoll(POLL_ID, GROUP_ID);

        bytes32 retrievedId = voting.getPollIdByIndex(0);
        assertEq(retrievedId, POLL_ID);
    }
}

