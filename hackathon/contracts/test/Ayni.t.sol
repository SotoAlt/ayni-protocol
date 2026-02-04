// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/AyniRegistry.sol";
import "../src/MessageAttestation.sol";
import "../src/AgentRegistry.sol";
import "../src/GlyphGovernance.sol";

contract AyniRegistryTest is Test {
    AyniRegistry public registry;
    address public owner = address(this);
    address public user = address(0x1);

    function setUp() public {
        registry = new AyniRegistry();
    }

    function test_InitialGlyphs() public view {
        // Check foundation glyphs are registered
        AyniRegistry.Glyph memory q01 = registry.getGlyph("Q01");
        assertEq(q01.id, "Q01");
        assertEq(q01.meaning, "Query Database");
        assertEq(q01.pose, "arms_up");
        assertEq(q01.symbol, "database");
        assertTrue(q01.active);

        AyniRegistry.Glyph memory r01 = registry.getGlyph("R01");
        assertEq(r01.id, "R01");
        assertEq(r01.meaning, "Response Success");

        AyniRegistry.Glyph memory e01 = registry.getGlyph("E01");
        assertEq(e01.id, "E01");
        assertEq(e01.meaning, "Error");

        AyniRegistry.Glyph memory a01 = registry.getGlyph("A01");
        assertEq(a01.id, "A01");
        assertEq(a01.meaning, "Execute Action");
    }

    function test_GlyphCount() public view {
        assertEq(registry.getGlyphCount(), 4);
    }

    function test_RegisterNewGlyph() public {
        AyniRegistry.Glyph memory newGlyph = AyniRegistry.Glyph({
            id: "Q02",
            meaning: "Query API",
            pose: "arms_up",
            symbol: "api",
            visualHash: keccak256("Q02_visual"),
            active: true
        });

        registry.registerGlyph(newGlyph);

        AyniRegistry.Glyph memory retrieved = registry.getGlyph("Q02");
        assertEq(retrieved.id, "Q02");
        assertEq(retrieved.meaning, "Query API");
        assertEq(registry.getGlyphCount(), 5);
    }

    function test_RevertOnDuplicateGlyph() public {
        AyniRegistry.Glyph memory duplicate = AyniRegistry.Glyph({
            id: "Q01",
            meaning: "Duplicate",
            pose: "arms_up",
            symbol: "database",
            visualHash: keccak256("dupe"),
            active: true
        });

        vm.expectRevert("Glyph already exists");
        registry.registerGlyph(duplicate);
    }

    function test_OnlyOwnerCanRegister() public {
        AyniRegistry.Glyph memory newGlyph = AyniRegistry.Glyph({
            id: "Q02",
            meaning: "Query API",
            pose: "arms_up",
            symbol: "api",
            visualHash: keccak256("Q02_visual"),
            active: true
        });

        vm.prank(user);
        vm.expectRevert();
        registry.registerGlyph(newGlyph);
    }

    function test_DeactivateGlyph() public {
        assertTrue(registry.isGlyphActive("Q01"));

        registry.deactivateGlyph("Q01");

        assertFalse(registry.isGlyphActive("Q01"));
        assertTrue(registry.glyphExists("Q01"));
    }

    function test_ActivateGlyph() public {
        registry.deactivateGlyph("Q01");
        assertFalse(registry.isGlyphActive("Q01"));

        registry.activateGlyph("Q01");
        assertTrue(registry.isGlyphActive("Q01"));
    }

    function test_GetAllGlyphs() public view {
        AyniRegistry.Glyph[] memory all = registry.getAllGlyphs();
        assertEq(all.length, 4);
    }

    function test_GetActiveGlyphs() public {
        registry.deactivateGlyph("E01");

        AyniRegistry.Glyph[] memory active = registry.getActiveGlyphs();
        assertEq(active.length, 3);
    }

    function test_UpdateGlyph() public {
        AyniRegistry.Glyph memory updated = AyniRegistry.Glyph({
            id: "Q01",
            meaning: "Query Database V2",
            pose: "arms_up",
            symbol: "database_v2",
            visualHash: keccak256("Q01_v2_visual"),
            active: true
        });

        registry.updateGlyph(updated);

        AyniRegistry.Glyph memory retrieved = registry.getGlyph("Q01");
        assertEq(retrieved.meaning, "Query Database V2");
        assertEq(retrieved.symbol, "database_v2");
    }
}

contract MessageAttestationTest is Test {
    MessageAttestation public attestation;
    address public alice = address(0x1);
    address public bob = address(0x2);

    function setUp() public {
        attestation = new MessageAttestation();
    }

    function test_AttestMessage() public {
        bytes32 messageHash = keccak256("test message");

        vm.prank(alice);
        attestation.attest(messageHash, "Q01", bob);

        MessageAttestation.Attestation memory att = attestation.verify(messageHash);
        assertEq(att.messageHash, messageHash);
        assertEq(att.sender, alice);
        assertEq(att.glyphId, "Q01");
        assertEq(att.recipient, bob);
        assertGt(att.timestamp, 0);
    }

    function test_AttestSimple() public {
        bytes32 messageHash = keccak256("simple message");

        vm.prank(alice);
        attestation.attestSimple(messageHash, "R01");

        MessageAttestation.Attestation memory att = attestation.verify(messageHash);
        assertEq(att.sender, alice);
        assertEq(att.glyphId, "R01");
        assertEq(att.recipient, address(0));
    }

    function test_IsAttested() public {
        bytes32 messageHash = keccak256("test");

        assertFalse(attestation.isAttested(messageHash));

        vm.prank(alice);
        attestation.attestSimple(messageHash, "Q01");

        assertTrue(attestation.isAttested(messageHash));
    }

    function test_RevertOnDuplicateAttestation() public {
        bytes32 messageHash = keccak256("test");

        vm.prank(alice);
        attestation.attestSimple(messageHash, "Q01");

        vm.prank(alice);
        vm.expectRevert("Message already attested");
        attestation.attestSimple(messageHash, "Q01");
    }

    function test_GetAttestations() public {
        bytes32 hash1 = keccak256("msg1");
        bytes32 hash2 = keccak256("msg2");

        vm.startPrank(alice);
        attestation.attestSimple(hash1, "Q01");
        attestation.attestSimple(hash2, "R01");
        vm.stopPrank();

        MessageAttestation.Attestation[] memory aliceAtts = attestation.getAttestations(alice);
        assertEq(aliceAtts.length, 2);
    }

    function test_GetReceivedAttestations() public {
        bytes32 hash1 = keccak256("msg1");
        bytes32 hash2 = keccak256("msg2");

        vm.prank(alice);
        attestation.attest(hash1, "Q01", bob);

        vm.prank(alice);
        attestation.attest(hash2, "Q02", bob);

        MessageAttestation.Attestation[] memory bobReceived = attestation.getReceivedAttestations(bob);
        assertEq(bobReceived.length, 2);
    }

    function test_VerifyFrom() public {
        bytes32 messageHash = keccak256("test");

        vm.prank(alice);
        attestation.attestSimple(messageHash, "Q01");

        assertTrue(attestation.verifyFrom(messageHash, alice));
        assertFalse(attestation.verifyFrom(messageHash, bob));
    }

    function test_AttestationCount() public {
        assertEq(attestation.attestationCount(), 0);

        vm.prank(alice);
        attestation.attestSimple(keccak256("msg1"), "Q01");

        vm.prank(bob);
        attestation.attestSimple(keccak256("msg2"), "R01");

        assertEq(attestation.attestationCount(), 2);
    }

    function test_GetAttestationHashes() public {
        vm.startPrank(alice);
        for (uint256 i = 0; i < 5; i++) {
            attestation.attestSimple(keccak256(abi.encodePacked("msg", i)), "Q01");
        }
        vm.stopPrank();

        bytes32[] memory hashes = attestation.getAttestationHashes(alice, 0, 3);
        assertEq(hashes.length, 3);

        bytes32[] memory hashes2 = attestation.getAttestationHashes(alice, 3, 10);
        assertEq(hashes2.length, 2);
    }
}

contract AgentRegistryTest is Test {
    AgentRegistry public registry;
    address public alice = address(0x1);
    address public bob = address(0x2);

    function setUp() public {
        registry = new AgentRegistry();
    }

    function test_RegisterAgent() public {
        string[] memory protocols = new string[](2);
        protocols[0] = "ayni";
        protocols[1] = "mcp";

        AgentRegistry.Agent memory agent = AgentRegistry.Agent({
            name: "AliceAgent",
            serviceUrl: "https://alice.example.com",
            protocols: protocols,
            agentCard: "ipfs://Qm123",
            registeredAt: 0,  // Will be set by contract
            active: true
        });

        vm.prank(alice);
        uint256 tokenId = registry.registerAgent(agent);

        assertEq(tokenId, 0);
        assertEq(registry.ownerOf(tokenId), alice);

        AgentRegistry.Agent memory retrieved = registry.getAgent(tokenId);
        assertEq(retrieved.name, "AliceAgent");
        assertEq(retrieved.serviceUrl, "https://alice.example.com");
        assertEq(retrieved.protocols.length, 2);
        assertTrue(retrieved.active);
    }

    function test_RevertOnDuplicateRegistration() public {
        string[] memory protocols = new string[](1);
        protocols[0] = "ayni";

        AgentRegistry.Agent memory agent = AgentRegistry.Agent({
            name: "AliceAgent",
            serviceUrl: "https://alice.example.com",
            protocols: protocols,
            agentCard: "",
            registeredAt: 0,
            active: true
        });

        vm.prank(alice);
        registry.registerAgent(agent);

        vm.prank(alice);
        vm.expectRevert("Address already has an agent");
        registry.registerAgent(agent);
    }

    function test_GetAgentByOwner() public {
        string[] memory protocols = new string[](1);
        protocols[0] = "ayni";

        AgentRegistry.Agent memory agent = AgentRegistry.Agent({
            name: "AliceAgent",
            serviceUrl: "https://alice.example.com",
            protocols: protocols,
            agentCard: "",
            registeredAt: 0,
            active: true
        });

        vm.prank(alice);
        registry.registerAgent(agent);

        AgentRegistry.Agent memory retrieved = registry.getAgentByOwner(alice);
        assertEq(retrieved.name, "AliceAgent");
    }

    function test_UpdateAgent() public {
        string[] memory protocols = new string[](1);
        protocols[0] = "ayni";

        AgentRegistry.Agent memory agent = AgentRegistry.Agent({
            name: "AliceAgent",
            serviceUrl: "https://alice.example.com",
            protocols: protocols,
            agentCard: "",
            registeredAt: 0,
            active: true
        });

        vm.prank(alice);
        uint256 tokenId = registry.registerAgent(agent);

        string[] memory newProtocols = new string[](2);
        newProtocols[0] = "ayni";
        newProtocols[1] = "a2a";

        AgentRegistry.Agent memory updated = AgentRegistry.Agent({
            name: "AliceAgent V2",
            serviceUrl: "https://alice-v2.example.com",
            protocols: newProtocols,
            agentCard: "ipfs://Qm456",
            registeredAt: 0,
            active: true
        });

        vm.prank(alice);
        registry.updateAgent(tokenId, updated);

        AgentRegistry.Agent memory retrieved = registry.getAgent(tokenId);
        assertEq(retrieved.name, "AliceAgent V2");
        assertEq(retrieved.protocols.length, 2);
    }

    function test_OnlyOwnerCanUpdate() public {
        string[] memory protocols = new string[](1);
        protocols[0] = "ayni";

        AgentRegistry.Agent memory agent = AgentRegistry.Agent({
            name: "AliceAgent",
            serviceUrl: "https://alice.example.com",
            protocols: protocols,
            agentCard: "",
            registeredAt: 0,
            active: true
        });

        vm.prank(alice);
        uint256 tokenId = registry.registerAgent(agent);

        vm.prank(bob);
        vm.expectRevert("Not the agent owner");
        registry.updateAgent(tokenId, agent);
    }

    function test_DeactivateAgent() public {
        string[] memory protocols = new string[](1);
        protocols[0] = "ayni";

        AgentRegistry.Agent memory agent = AgentRegistry.Agent({
            name: "AliceAgent",
            serviceUrl: "https://alice.example.com",
            protocols: protocols,
            agentCard: "",
            registeredAt: 0,
            active: true
        });

        vm.prank(alice);
        uint256 tokenId = registry.registerAgent(agent);

        assertTrue(registry.isActive(tokenId));

        vm.prank(alice);
        registry.deactivateAgent(tokenId);

        assertFalse(registry.isActive(tokenId));
    }

    function test_FindByProtocol() public {
        string[] memory ayniProtocols = new string[](1);
        ayniProtocols[0] = "ayni";

        string[] memory mcpProtocols = new string[](1);
        mcpProtocols[0] = "mcp";

        string[] memory bothProtocols = new string[](2);
        bothProtocols[0] = "ayni";
        bothProtocols[1] = "mcp";

        vm.prank(alice);
        registry.registerAgent(AgentRegistry.Agent({
            name: "AliceAgent",
            serviceUrl: "",
            protocols: ayniProtocols,
            agentCard: "",
            registeredAt: 0,
            active: true
        }));

        vm.prank(bob);
        registry.registerAgent(AgentRegistry.Agent({
            name: "BobAgent",
            serviceUrl: "",
            protocols: bothProtocols,
            agentCard: "",
            registeredAt: 0,
            active: true
        }));

        uint256[] memory ayniAgents = registry.findByProtocol("ayni");
        assertEq(ayniAgents.length, 2);

        uint256[] memory mcpAgents = registry.findByProtocol("mcp");
        assertEq(mcpAgents.length, 1);
    }

    function test_HasAgent() public {
        assertFalse(registry.hasAgent(alice));

        string[] memory protocols = new string[](1);
        protocols[0] = "ayni";

        vm.prank(alice);
        registry.registerAgent(AgentRegistry.Agent({
            name: "AliceAgent",
            serviceUrl: "",
            protocols: protocols,
            agentCard: "",
            registeredAt: 0,
            active: true
        }));

        assertTrue(registry.hasAgent(alice));
    }

    function test_TransferUpdatesMapping() public {
        string[] memory protocols = new string[](1);
        protocols[0] = "ayni";

        vm.prank(alice);
        uint256 tokenId = registry.registerAgent(AgentRegistry.Agent({
            name: "AliceAgent",
            serviceUrl: "",
            protocols: protocols,
            agentCard: "",
            registeredAt: 0,
            active: true
        }));

        assertTrue(registry.hasAgent(alice));
        assertFalse(registry.hasAgent(bob));

        vm.prank(alice);
        registry.transferFrom(alice, bob, tokenId);

        assertFalse(registry.hasAgent(alice));
        assertTrue(registry.hasAgent(bob));
        assertEq(registry.ownerOf(tokenId), bob);
    }

    function test_GetAgentCount() public {
        assertEq(registry.getAgentCount(), 0);

        string[] memory protocols = new string[](1);
        protocols[0] = "ayni";

        vm.prank(alice);
        registry.registerAgent(AgentRegistry.Agent({
            name: "AliceAgent",
            serviceUrl: "",
            protocols: protocols,
            agentCard: "",
            registeredAt: 0,
            active: true
        }));

        assertEq(registry.getAgentCount(), 1);
    }

    function test_LinkWallet() public {
        string[] memory protocols = new string[](1);
        protocols[0] = "ayni";

        vm.prank(alice);
        uint256 tokenId = registry.registerAgent(AgentRegistry.Agent({
            name: "AliceAgent",
            serviceUrl: "",
            protocols: protocols,
            agentCard: "",
            registeredAt: 0,
            active: true
        }));

        address linkedWallet = address(0x123);

        vm.prank(alice);
        registry.linkWallet(tokenId, linkedWallet);

        assertTrue(registry.isWalletLinked(linkedWallet));
        assertEq(registry.getTokenIdByWallet(linkedWallet), tokenId);

        AgentRegistry.Agent memory agent = registry.getAgentByWallet(linkedWallet);
        assertEq(agent.name, "AliceAgent");
    }

    function test_UnlinkWallet() public {
        string[] memory protocols = new string[](1);
        protocols[0] = "ayni";

        vm.prank(alice);
        uint256 tokenId = registry.registerAgent(AgentRegistry.Agent({
            name: "AliceAgent",
            serviceUrl: "",
            protocols: protocols,
            agentCard: "",
            registeredAt: 0,
            active: true
        }));

        address linkedWallet = address(0x123);

        vm.prank(alice);
        registry.linkWallet(tokenId, linkedWallet);

        assertTrue(registry.isWalletLinked(linkedWallet));

        vm.prank(alice);
        registry.unlinkWallet(tokenId, linkedWallet);

        assertFalse(registry.isWalletLinked(linkedWallet));
    }

    function test_GetLinkedWallets() public {
        string[] memory protocols = new string[](1);
        protocols[0] = "ayni";

        vm.prank(alice);
        uint256 tokenId = registry.registerAgent(AgentRegistry.Agent({
            name: "AliceAgent",
            serviceUrl: "",
            protocols: protocols,
            agentCard: "",
            registeredAt: 0,
            active: true
        }));

        address wallet1 = address(0x123);
        address wallet2 = address(0x456);

        vm.startPrank(alice);
        registry.linkWallet(tokenId, wallet1);
        registry.linkWallet(tokenId, wallet2);
        vm.stopPrank();

        address[] memory linked = registry.getLinkedWallets(tokenId);
        assertEq(linked.length, 2);
    }

    function test_CannotLinkPrimaryWallet() public {
        string[] memory protocols = new string[](1);
        protocols[0] = "ayni";

        vm.prank(alice);
        registry.registerAgent(AgentRegistry.Agent({
            name: "AliceAgent",
            serviceUrl: "",
            protocols: protocols,
            agentCard: "",
            registeredAt: 0,
            active: true
        }));

        vm.prank(bob);
        uint256 bobTokenId = registry.registerAgent(AgentRegistry.Agent({
            name: "BobAgent",
            serviceUrl: "",
            protocols: protocols,
            agentCard: "",
            registeredAt: 0,
            active: true
        }));

        // Try to link alice's primary wallet to bob's agent
        vm.prank(bob);
        vm.expectRevert("Wallet is primary for another agent");
        registry.linkWallet(bobTokenId, alice);
    }
}

contract GlyphGovernanceTest is Test {
    AyniRegistry public registry;
    GlyphGovernance public governance;
    address public alice = address(0x1);
    address public bob = address(0x2);
    address public carol = address(0x3);
    address public dave = address(0x4);

    function setUp() public {
        registry = new AyniRegistry();
        governance = new GlyphGovernance(address(registry));

        // Fund test accounts
        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);
        vm.deal(carol, 10 ether);
        vm.deal(dave, 10 ether);
    }

    function test_ProposeGlyph() public {
        vm.prank(alice);
        uint256 proposalId = governance.propose{value: 0.01 ether}(
            "Q02",
            "Query API",
            "arms_up",
            "api"
        );

        assertEq(proposalId, 0);

        GlyphGovernance.Proposal memory proposal = governance.getProposal(0);
        assertEq(proposal.glyphId, "Q02");
        assertEq(proposal.meaning, "Query API");
        assertEq(proposal.proposer, alice);
        assertFalse(proposal.executed);
    }

    function test_ProposeRequiresCorrectStake() public {
        vm.prank(alice);
        vm.expectRevert(GlyphGovernance.InvalidStake.selector);
        governance.propose{value: 0.005 ether}("Q02", "Query API", "arms_up", "api");
    }

    function test_CannotProposeExistingGlyph() public {
        vm.prank(alice);
        vm.expectRevert(GlyphGovernance.GlyphAlreadyExists.selector);
        governance.propose{value: 0.01 ether}("Q01", "Query Database", "arms_up", "database");
    }

    function test_Vote() public {
        vm.prank(alice);
        governance.propose{value: 0.01 ether}("Q02", "Query API", "arms_up", "api");

        vm.prank(bob);
        governance.vote(0, true);

        (uint256 votesFor, uint256 votesAgainst, uint256 total) = governance.getVoteCounts(0);
        assertEq(votesFor, 1);
        assertEq(votesAgainst, 0);
        assertEq(total, 1);
    }

    function test_CannotVoteTwice() public {
        vm.prank(alice);
        governance.propose{value: 0.01 ether}("Q02", "Query API", "arms_up", "api");

        vm.prank(bob);
        governance.vote(0, true);

        vm.prank(bob);
        vm.expectRevert(GlyphGovernance.AlreadyVoted.selector);
        governance.vote(0, true);
    }

    function test_CannotVoteAfterDeadline() public {
        vm.prank(alice);
        governance.propose{value: 0.01 ether}("Q02", "Query API", "arms_up", "api");

        // Fast forward past voting period
        vm.warp(block.timestamp + 2 days);

        vm.prank(bob);
        vm.expectRevert(GlyphGovernance.VotingEnded.selector);
        governance.vote(0, true);
    }

    function test_ExecuteApprovedProposal() public {
        vm.prank(alice);
        governance.propose{value: 0.01 ether}("Q02", "Query API", "arms_up", "api");

        // Get 3 votes for (quorum)
        vm.prank(bob);
        governance.vote(0, true);

        vm.prank(carol);
        governance.vote(0, true);

        vm.prank(dave);
        governance.vote(0, true);

        // Fast forward past voting period
        vm.warp(block.timestamp + 2 days);

        uint256 aliceBalanceBefore = alice.balance;

        governance.execute(0);

        // Stake should be refunded
        assertEq(alice.balance, aliceBalanceBefore + 0.01 ether);

        GlyphGovernance.Proposal memory proposal = governance.getProposal(0);
        assertTrue(proposal.executed);
    }

    function test_ExecuteRejectedProposal() public {
        vm.prank(alice);
        governance.propose{value: 0.01 ether}("Q02", "Query API", "arms_up", "api");

        // Get 3 votes against
        vm.prank(bob);
        governance.vote(0, false);

        vm.prank(carol);
        governance.vote(0, false);

        vm.prank(dave);
        governance.vote(0, false);

        // Fast forward past voting period
        vm.warp(block.timestamp + 2 days);

        uint256 treasuryBefore = governance.treasury();

        governance.execute(0);

        // Stake should go to treasury
        assertEq(governance.treasury(), treasuryBefore + 0.01 ether);
    }

    function test_CannotExecuteBeforeDeadline() public {
        vm.prank(alice);
        governance.propose{value: 0.01 ether}("Q02", "Query API", "arms_up", "api");

        vm.expectRevert(GlyphGovernance.VotingNotEnded.selector);
        governance.execute(0);
    }

    function test_CannotExecuteTwice() public {
        vm.prank(alice);
        governance.propose{value: 0.01 ether}("Q02", "Query API", "arms_up", "api");

        vm.prank(bob);
        governance.vote(0, true);

        vm.prank(carol);
        governance.vote(0, true);

        vm.prank(dave);
        governance.vote(0, true);

        vm.warp(block.timestamp + 2 days);

        governance.execute(0);

        vm.expectRevert(GlyphGovernance.AlreadyExecuted.selector);
        governance.execute(0);
    }

    function test_IsVotingActive() public {
        vm.prank(alice);
        governance.propose{value: 0.01 ether}("Q02", "Query API", "arms_up", "api");

        assertTrue(governance.isVotingActive(0));

        vm.warp(block.timestamp + 2 days);

        assertFalse(governance.isVotingActive(0));
    }

    function test_WouldPass() public {
        vm.prank(alice);
        governance.propose{value: 0.01 ether}("Q02", "Query API", "arms_up", "api");

        // Not enough votes
        assertFalse(governance.wouldPass(0));

        // Add 3 votes for
        vm.prank(bob);
        governance.vote(0, true);

        vm.prank(carol);
        governance.vote(0, true);

        vm.prank(dave);
        governance.vote(0, true);

        assertTrue(governance.wouldPass(0));
    }

    function test_GetActiveProposals() public {
        vm.startPrank(alice);
        governance.propose{value: 0.01 ether}("Q02", "Query API", "arms_up", "api");
        governance.propose{value: 0.01 ether}("Q03", "Query Storage", "arms_up", "storage");
        vm.stopPrank();

        uint256[] memory active = governance.getActiveProposals();
        assertEq(active.length, 2);
    }
}
