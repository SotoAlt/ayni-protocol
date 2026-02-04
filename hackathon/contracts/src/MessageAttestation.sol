// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MessageAttestation
 * @notice Stores message hashes for trustless verification of agent communication
 * @dev Enables on-chain proof that a message existed at a specific timestamp
 */
contract MessageAttestation {
    struct Attestation {
        bytes32 messageHash;
        address sender;
        uint256 timestamp;
        string glyphId;
        address recipient;
    }

    // Mapping from message hash to attestation
    mapping(bytes32 => Attestation) private attestations;

    // Mapping from sender address to their attestation hashes
    mapping(address => bytes32[]) private senderAttestations;

    // Mapping from recipient address to their attestation hashes
    mapping(address => bytes32[]) private recipientAttestations;

    // Total attestation count
    uint256 public attestationCount;

    // Events
    event MessageAttested(
        bytes32 indexed messageHash,
        address indexed sender,
        address indexed recipient,
        string glyphId,
        uint256 timestamp
    );

    /**
     * @notice Attest a message hash on-chain
     * @param messageHash The hash of the full message
     * @param glyphId The glyph ID used in the message (e.g., "Q01")
     * @param recipient The intended recipient of the message
     */
    function attest(
        bytes32 messageHash,
        string calldata glyphId,
        address recipient
    ) external {
        require(messageHash != bytes32(0), "Invalid message hash");
        require(bytes(glyphId).length > 0, "Glyph ID cannot be empty");
        require(attestations[messageHash].timestamp == 0, "Message already attested");

        Attestation memory newAttestation = Attestation({
            messageHash: messageHash,
            sender: msg.sender,
            timestamp: block.timestamp,
            glyphId: glyphId,
            recipient: recipient
        });

        attestations[messageHash] = newAttestation;
        senderAttestations[msg.sender].push(messageHash);

        if (recipient != address(0)) {
            recipientAttestations[recipient].push(messageHash);
        }

        attestationCount++;

        emit MessageAttested(
            messageHash,
            msg.sender,
            recipient,
            glyphId,
            block.timestamp
        );
    }

    /**
     * @notice Attest a message with just the hash and glyph (no recipient)
     * @param messageHash The hash of the full message
     * @param glyphId The glyph ID used in the message
     */
    function attestSimple(bytes32 messageHash, string calldata glyphId) external {
        require(messageHash != bytes32(0), "Invalid message hash");
        require(bytes(glyphId).length > 0, "Glyph ID cannot be empty");
        require(attestations[messageHash].timestamp == 0, "Message already attested");

        Attestation memory newAttestation = Attestation({
            messageHash: messageHash,
            sender: msg.sender,
            timestamp: block.timestamp,
            glyphId: glyphId,
            recipient: address(0)
        });

        attestations[messageHash] = newAttestation;
        senderAttestations[msg.sender].push(messageHash);
        attestationCount++;

        emit MessageAttested(
            messageHash,
            msg.sender,
            address(0),
            glyphId,
            block.timestamp
        );
    }

    /**
     * @notice Verify if a message was attested
     * @param messageHash The hash to verify
     * @return The attestation struct (timestamp will be 0 if not attested)
     */
    function verify(bytes32 messageHash) external view returns (Attestation memory) {
        return attestations[messageHash];
    }

    /**
     * @notice Check if a message has been attested
     * @param messageHash The hash to check
     * @return True if the message has been attested
     */
    function isAttested(bytes32 messageHash) external view returns (bool) {
        return attestations[messageHash].timestamp != 0;
    }

    /**
     * @notice Get all attestations by a sender
     * @param sender The sender address
     * @return Array of attestation structs
     */
    function getAttestations(address sender) external view returns (Attestation[] memory) {
        bytes32[] storage hashes = senderAttestations[sender];
        Attestation[] memory result = new Attestation[](hashes.length);

        for (uint256 i = 0; i < hashes.length; i++) {
            result[i] = attestations[hashes[i]];
        }

        return result;
    }

    /**
     * @notice Get attestation count for a sender
     * @param sender The sender address
     * @return Number of attestations
     */
    function getAttestationCount(address sender) external view returns (uint256) {
        return senderAttestations[sender].length;
    }

    /**
     * @notice Get all attestations received by an address
     * @param recipient The recipient address
     * @return Array of attestation structs
     */
    function getReceivedAttestations(address recipient) external view returns (Attestation[] memory) {
        bytes32[] storage hashes = recipientAttestations[recipient];
        Attestation[] memory result = new Attestation[](hashes.length);

        for (uint256 i = 0; i < hashes.length; i++) {
            result[i] = attestations[hashes[i]];
        }

        return result;
    }

    /**
     * @notice Get attestation hashes for a sender (for pagination)
     * @param sender The sender address
     * @param offset Starting index
     * @param limit Maximum number of results
     * @return Array of message hashes
     */
    function getAttestationHashes(
        address sender,
        uint256 offset,
        uint256 limit
    ) external view returns (bytes32[] memory) {
        bytes32[] storage hashes = senderAttestations[sender];

        if (offset >= hashes.length) {
            return new bytes32[](0);
        }

        uint256 end = offset + limit;
        if (end > hashes.length) {
            end = hashes.length;
        }

        bytes32[] memory result = new bytes32[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = hashes[i];
        }

        return result;
    }

    /**
     * @notice Verify a message and check if sender matches
     * @param messageHash The hash to verify
     * @param expectedSender The expected sender address
     * @return True if message was attested by the expected sender
     */
    function verifyFrom(bytes32 messageHash, address expectedSender) external view returns (bool) {
        Attestation storage att = attestations[messageHash];
        return att.timestamp != 0 && att.sender == expectedSender;
    }
}
