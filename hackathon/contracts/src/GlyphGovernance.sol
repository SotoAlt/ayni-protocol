// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {AyniRegistry} from "./AyniRegistry.sol";

/**
 * @title GlyphGovernance
 * @notice Agent-driven governance for proposing and voting on new glyphs
 * @dev Minimal governance for hackathon - agents propose, vote, and add glyphs
 */
contract GlyphGovernance {
    AyniRegistry public immutable registry;

    struct Proposal {
        string glyphId;
        string meaning;
        string pose;
        string symbol;
        bytes32 visualHash;
        address proposer;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 deadline;
        bool executed;
        bool exists;
    }

    // Governance parameters
    uint256 public constant PROPOSAL_STAKE = 0.01 ether;
    uint256 public constant VOTING_PERIOD = 1 days;
    uint256 public constant QUORUM = 3;

    // Proposal storage
    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    // Treasury for rejected proposal stakes
    uint256 public treasury;

    // Events
    event ProposalCreated(
        uint256 indexed proposalId,
        string glyphId,
        string meaning,
        address indexed proposer,
        uint256 deadline
    );
    event Voted(uint256 indexed proposalId, address indexed voter, bool support);
    event ProposalExecuted(uint256 indexed proposalId, string glyphId, bool approved);
    event StakeRefunded(uint256 indexed proposalId, address indexed proposer, uint256 amount);
    event TreasuryWithdrawal(address indexed to, uint256 amount);

    error InvalidStake();
    error GlyphAlreadyExists();
    error ProposalNotFound();
    error VotingEnded();
    error VotingNotEnded();
    error AlreadyVoted();
    error AlreadyExecuted();
    error QuorumNotReached();
    error TransferFailed();

    constructor(address _registry) {
        registry = AyniRegistry(_registry);
    }

    /**
     * @notice Propose a new glyph with stake
     * @param glyphId The glyph ID (e.g., "Q02")
     * @param meaning The meaning of the glyph
     * @param pose The pose for the glyph visual
     * @param symbol The symbol overlay
     * @return proposalId The ID of the created proposal
     */
    function propose(
        string calldata glyphId,
        string calldata meaning,
        string calldata pose,
        string calldata symbol
    ) external payable returns (uint256 proposalId) {
        if (msg.value != PROPOSAL_STAKE) revert InvalidStake();
        if (registry.glyphExists(glyphId)) revert GlyphAlreadyExists();

        proposalId = proposalCount++;

        proposals[proposalId] = Proposal({
            glyphId: glyphId,
            meaning: meaning,
            pose: pose,
            symbol: symbol,
            visualHash: keccak256(abi.encodePacked(glyphId, "_visual")),
            proposer: msg.sender,
            votesFor: 0,
            votesAgainst: 0,
            deadline: block.timestamp + VOTING_PERIOD,
            executed: false,
            exists: true
        });

        emit ProposalCreated(proposalId, glyphId, meaning, msg.sender, block.timestamp + VOTING_PERIOD);
    }

    /**
     * @notice Vote on a proposal
     * @param proposalId The proposal ID
     * @param support True for yes, false for no
     */
    function vote(uint256 proposalId, bool support) external {
        Proposal storage proposal = proposals[proposalId];

        if (!proposal.exists) revert ProposalNotFound();
        if (block.timestamp > proposal.deadline) revert VotingEnded();
        if (hasVoted[proposalId][msg.sender]) revert AlreadyVoted();

        hasVoted[proposalId][msg.sender] = true;

        if (support) {
            proposal.votesFor++;
        } else {
            proposal.votesAgainst++;
        }

        emit Voted(proposalId, msg.sender, support);
    }

    /**
     * @notice Execute a proposal after voting period ends
     * @param proposalId The proposal ID to execute
     */
    function execute(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];

        if (!proposal.exists) revert ProposalNotFound();
        if (block.timestamp <= proposal.deadline) revert VotingNotEnded();
        if (proposal.executed) revert AlreadyExecuted();

        proposal.executed = true;

        uint256 totalVotes = proposal.votesFor + proposal.votesAgainst;
        bool approved = totalVotes >= QUORUM && proposal.votesFor > proposal.votesAgainst;

        if (approved) {
            // Add glyph to registry (requires ownership transfer or admin function)
            // For hackathon, we emit event and manual addition
            // In production, governance would own the registry

            // Refund stake to proposer
            (bool success, ) = proposal.proposer.call{value: PROPOSAL_STAKE}("");
            if (!success) revert TransferFailed();
            emit StakeRefunded(proposalId, proposal.proposer, PROPOSAL_STAKE);
        } else {
            // Stake goes to treasury
            treasury += PROPOSAL_STAKE;
        }

        emit ProposalExecuted(proposalId, proposal.glyphId, approved);
    }

    /**
     * @notice Get proposal details
     * @param proposalId The proposal ID
     * @return The proposal struct
     */
    function getProposal(uint256 proposalId) external view returns (Proposal memory) {
        if (!proposals[proposalId].exists) revert ProposalNotFound();
        return proposals[proposalId];
    }

    /**
     * @notice Check if a proposal is currently in voting period
     * @param proposalId The proposal ID
     * @return True if voting is active
     */
    function isVotingActive(uint256 proposalId) external view returns (bool) {
        Proposal storage proposal = proposals[proposalId];
        return proposal.exists && !proposal.executed && block.timestamp <= proposal.deadline;
    }

    /**
     * @notice Get vote counts for a proposal
     * @param proposalId The proposal ID
     * @return votesFor Votes in favor
     * @return votesAgainst Votes against
     * @return totalVotes Total votes cast
     */
    function getVoteCounts(uint256 proposalId)
        external
        view
        returns (uint256 votesFor, uint256 votesAgainst, uint256 totalVotes)
    {
        Proposal storage proposal = proposals[proposalId];
        if (!proposal.exists) revert ProposalNotFound();
        return (proposal.votesFor, proposal.votesAgainst, proposal.votesFor + proposal.votesAgainst);
    }

    /**
     * @notice Check if a proposal would pass if executed now
     * @param proposalId The proposal ID
     * @return True if the proposal would pass
     */
    function wouldPass(uint256 proposalId) external view returns (bool) {
        Proposal storage proposal = proposals[proposalId];
        if (!proposal.exists) revert ProposalNotFound();
        uint256 totalVotes = proposal.votesFor + proposal.votesAgainst;
        return totalVotes >= QUORUM && proposal.votesFor > proposal.votesAgainst;
    }

    /**
     * @notice Withdraw treasury funds (owner only in production)
     * @param to The recipient address
     * @param amount The amount to withdraw
     */
    function withdrawTreasury(address to, uint256 amount) external {
        // In production, add access control (e.g., multisig, DAO vote)
        require(amount <= treasury, "Insufficient treasury");
        treasury -= amount;
        (bool success, ) = to.call{value: amount}("");
        if (!success) revert TransferFailed();
        emit TreasuryWithdrawal(to, amount);
    }

    /**
     * @notice Get all active proposals (for frontend)
     * @return proposalIds Array of active proposal IDs
     */
    function getActiveProposals() external view returns (uint256[] memory proposalIds) {
        uint256 activeCount = 0;

        // Count active proposals
        for (uint256 i = 0; i < proposalCount; i++) {
            if (proposals[i].exists && !proposals[i].executed && block.timestamp <= proposals[i].deadline) {
                activeCount++;
            }
        }

        // Collect active proposal IDs
        proposalIds = new uint256[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < proposalCount; i++) {
            if (proposals[i].exists && !proposals[i].executed && block.timestamp <= proposals[i].deadline) {
                proposalIds[index++] = i;
            }
        }
    }

    receive() external payable {
        treasury += msg.value;
    }
}
