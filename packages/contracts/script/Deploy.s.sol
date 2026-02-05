// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/AyniRegistry.sol";
import "../src/MessageAttestation.sol";
import "../src/AgentRegistry.sol";
import "../src/GlyphGovernance.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy AyniRegistry (with foundation glyphs)
        AyniRegistry registry = new AyniRegistry();
        console.log("AyniRegistry deployed at:", address(registry));

        // Deploy MessageAttestation
        MessageAttestation attestation = new MessageAttestation();
        console.log("MessageAttestation deployed at:", address(attestation));

        // Deploy AgentRegistry
        AgentRegistry agents = new AgentRegistry();
        console.log("AgentRegistry deployed at:", address(agents));

        // Deploy GlyphGovernance (linked to AyniRegistry)
        GlyphGovernance governance = new GlyphGovernance(address(registry));
        console.log("GlyphGovernance deployed at:", address(governance));

        // Log summary
        console.log("\n=== Deployment Summary ===");
        console.log("Network: Monad Testnet (Chain ID: 10143)");
        console.log("AyniRegistry:", address(registry));
        console.log("MessageAttestation:", address(attestation));
        console.log("AgentRegistry:", address(agents));
        console.log("GlyphGovernance:", address(governance));
        console.log("===========================\n");

        // Verify foundation glyphs are registered
        AyniRegistry.Glyph memory q01 = registry.getGlyph("Q01");
        require(
            keccak256(bytes(q01.id)) == keccak256(bytes("Q01")),
            "Q01 glyph not registered"
        );
        console.log("Foundation glyphs verified: Q01, R01, E01, A01");

        vm.stopBroadcast();
    }
}
