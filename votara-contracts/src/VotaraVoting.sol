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

    struct Poll {
        bytes32 pollId;
        uint256 groupId; // Semaphore group ID for this poll (0 if not activated)
        bool isActive; // Whether poll is activated
        mapping(uint8 => uint256) optionVotes; // optionIndex => vote count
    }

    // pollId => Poll
    mapping(bytes32 => Poll) public polls;

    // Track all poll IDs
    bytes32[] public pollIds;

    // Events
    event PollCreated(
        bytes32 indexed pollId
    );

    event PollActivated(
        bytes32 indexed pollId,
        uint256 groupId
    );

    event VoteCast(
        bytes32 indexed pollId,
        uint8 optionIndex,
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
     * @notice Activate a poll on-chain
     * @param _pollId Unique identifier for the poll (hash)
     * @param _groupId Semaphore group ID for eligible voters
     */
    function activatePoll(
        bytes32 _pollId,
        uint256 _groupId
    ) external onlyOwner {
        require(_pollId != bytes32(0), "Poll ID cannot be empty");
        require(polls[_pollId].pollId == bytes32(0), "Poll already exists");

        Poll storage newPoll = polls[_pollId];
        newPoll.pollId = _pollId;
        newPoll.groupId = _groupId;

        pollIds.push(_pollId);

        emit PollActivated(_pollId, _groupId);
    }
    
    /**
     * @notice Cast a vote on a poll using Semaphore proof
     * @param _pollId ID of the poll
     * @param _optionIndex Index of the chosen option (0-255)
     * @param _proof Semaphore proof struct
     */
    function castVote(
        bytes32 _pollId,
        uint8 _optionIndex,
        ISemaphore.SemaphoreProof calldata _proof
    ) external {
        Poll storage poll = polls[_pollId];

        require(poll.pollId != bytes32(0), "Poll does not exist");
        require(_proof.message == uint256(_optionIndex), "Message must match option index");

        // Verify the Semaphore proof
        semaphore.validateProof(poll.groupId, _proof);

        // Increment vote count for the chosen option
        poll.optionVotes[_optionIndex]++;

        emit VoteCast(_pollId, _optionIndex, _proof.nullifier);
    }

    /**
     * @notice Get vote count for a specific option in a poll
     * @param _pollId ID of the poll
     * @param _optionIndex Index of the option (0-255)
     * @return Number of votes for the option
     */
    function getVoteCount(bytes32 _pollId, uint8 _optionIndex)
        external
        view
        returns (uint256)
    {
        return polls[_pollId].optionVotes[_optionIndex];
    }

    /**
     * @notice Check if poll exists
     * @param _pollId ID of the poll
     * @return Whether the poll exists
     */
    function pollExists(bytes32 _pollId) external view returns (bool) {
        return polls[_pollId].pollId != bytes32(0);
    }

    /**
     * @notice Get poll group ID
     * @param _pollId ID of the poll
     * @return Semaphore group ID
     */
    function getPollGroupId(bytes32 _pollId) external view returns (uint256) {
        return polls[_pollId].groupId;
    }

    /**
     * @notice Get total number of polls
     * @return Total number of polls created
     */
    function getTotalPolls() external view returns (uint256) {
        return pollIds.length;
    }

    /**
     * @notice Get poll ID by index
     * @param _index Index in the pollIds array
     * @return Poll ID at the given index
     */
    function getPollIdByIndex(uint256 _index) external view returns (bytes32) {
        require(_index < pollIds.length, "Index out of bounds");
        return pollIds[_index];
    }
}

