// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {ISemaphore} from "@semaphore-protocol/contracts/interfaces/ISemaphore.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title VotaraVoting
 * @notice Minimal on-chain voting contract with Semaphore-based Sybil resistance
 * @dev Only stores essential data on-chain. Metadata (title, description, etc.) stored off-chain
 */
contract VotaraVoting is Ownable {
    ISemaphore public semaphore;

    struct Vote {
        bytes32 voteId;
        uint256 groupId; // Semaphore group ID for this vote
        mapping(uint256 => uint256) optionVotes; // optionIndex => vote count
    }

    // voteId => Vote
    mapping(bytes32 => Vote) public votes;

    // Track all vote IDs
    bytes32[] public voteIds;

    // Events
    event VoteCreated(
        bytes32 indexed voteId,
        uint256 groupId
    );

    event VoteCast(
        bytes32 indexed voteId,
        uint256 optionIndex,
        uint256 nullifierHash
    );
    
    /**
     * @notice Constructor
     * @param _semaphore Address of the Semaphore contract
     */
    constructor(address _semaphore) Ownable() {
        require(_semaphore != address(0), "Invalid Semaphore address");
        semaphore = ISemaphore(_semaphore);
    }
    
    /**
     * @notice Create a new vote
     * @param _voteId Unique identifier for the vote (hash)
     * @param _groupId Semaphore group ID for eligible voters
     */
    function createVote(
        bytes32 _voteId,
        uint256 _groupId
    ) external onlyOwner {
        require(_voteId != bytes32(0), "Vote ID cannot be empty");
        require(votes[_voteId].voteId == bytes32(0), "Vote already exists");

        Vote storage newVote = votes[_voteId];
        newVote.voteId = _voteId;
        newVote.groupId = _groupId;

        voteIds.push(_voteId);

        emit VoteCreated(_voteId, _groupId);
    }
    
    /**
     * @notice Cast a vote using Semaphore proof
     * @param _voteId ID of the vote
     * @param _optionIndex Index of the chosen option (used as message)
     * @param _proof Semaphore proof struct
     */
    function castVote(
        bytes32 _voteId,
        uint256 _optionIndex,
        ISemaphore.SemaphoreProof calldata _proof
    ) external {
        Vote storage vote = votes[_voteId];

        require(vote.voteId != bytes32(0), "Vote does not exist");
        require(vote.active, "Vote is not active");
        require(_proof.message == _optionIndex, "Message must match option index");

        // Verify the Semaphore proof
        semaphore.validateProof(vote.groupId, _proof);

        // Increment vote count for the chosen option
        vote.optionVotes[_optionIndex]++;

        emit VoteCast(_voteId, _optionIndex, _proof.nullifier);
    }
    
    /**
     * @notice End a vote manually
     * @param _voteId ID of the vote to end
     */
    function endVote(bytes32 _voteId) external onlyOwner {
        Vote storage vote = votes[_voteId];
        require(vote.voteId != bytes32(0), "Vote does not exist");
        require(vote.active, "Vote already ended");

        vote.active = false;
        emit VoteEnded(_voteId);
    }

    /**
     * @notice Get vote results for a specific option
     * @param _voteId ID of the vote
     * @param _optionIndex Index of the option
     * @return Number of votes for the option
     */
    function getVoteCount(bytes32 _voteId, uint256 _optionIndex)
        external
        view
        returns (uint256)
    {
        return votes[_voteId].optionVotes[_optionIndex];
    }

    /**
     * @notice Check if vote exists
     * @param _voteId ID of the vote
     * @return Whether the vote exists
     */
    function voteExists(bytes32 _voteId) external view returns (bool) {
        return votes[_voteId].voteId != bytes32(0);
    }

    /**
     * @notice Check if vote is active
     * @param _voteId ID of the vote
     * @return Whether the vote is active
     */
    function isVoteActive(bytes32 _voteId) external view returns (bool) {
        return votes[_voteId].active;
    }

    /**
     * @notice Get vote group ID
     * @param _voteId ID of the vote
     * @return Semaphore group ID
     */
    function getVoteGroupId(bytes32 _voteId) external view returns (uint256) {
        return votes[_voteId].groupId;
    }

    /**
     * @notice Get total number of votes
     * @return Total number of votes created
     */
    function getTotalVotes() external view returns (uint256) {
        return voteIds.length;
    }

    /**
     * @notice Get vote ID by index
     * @param _index Index in the voteIds array
     * @return Vote ID at the given index
     */
    function getVoteIdByIndex(uint256 _index) external view returns (bytes32) {
        require(_index < voteIds.length, "Index out of bounds");
        return voteIds[_index];
    }
}

