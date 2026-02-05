// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AyniRegistry
 * @notice Stores glyph definitions for the Ayni Protocol
 * @dev DAO-governable in future versions via ownership transfer
 */
contract AyniRegistry is Ownable {
    struct Glyph {
        string id;           // "Q01", "R01", etc.
        string meaning;      // "Query Database"
        string pose;         // "arms_up"
        string symbol;       // "database"
        bytes32 visualHash;  // Hash of 32x32 binary grid
        bool active;
    }

    // Mapping from glyph ID to Glyph struct
    mapping(string => Glyph) private glyphs;

    // Array of all glyph IDs for enumeration
    string[] private glyphIds;

    // Events
    event GlyphRegistered(string indexed id, string meaning, string pose, string symbol);
    event GlyphUpdated(string indexed id, string meaning, string pose, string symbol);
    event GlyphDeactivated(string indexed id);
    event GlyphActivated(string indexed id);

    constructor() Ownable(msg.sender) {
        // Register foundation glyphs
        _registerGlyph(Glyph({
            id: "Q01",
            meaning: "Query Database",
            pose: "arms_up",
            symbol: "database",
            visualHash: keccak256("Q01_visual"),
            active: true
        }));

        _registerGlyph(Glyph({
            id: "R01",
            meaning: "Response Success",
            pose: "arms_down",
            symbol: "checkmark",
            visualHash: keccak256("R01_visual"),
            active: true
        }));

        _registerGlyph(Glyph({
            id: "E01",
            meaning: "Error",
            pose: "distressed",
            symbol: "x",
            visualHash: keccak256("E01_visual"),
            active: true
        }));

        _registerGlyph(Glyph({
            id: "A01",
            meaning: "Execute Action",
            pose: "action",
            symbol: "diamond",
            visualHash: keccak256("A01_visual"),
            active: true
        }));
    }

    /**
     * @notice Register a new glyph (owner only)
     * @param glyph The glyph struct to register
     */
    function registerGlyph(Glyph calldata glyph) external onlyOwner {
        require(bytes(glyph.id).length > 0, "Glyph ID cannot be empty");
        require(bytes(glyphs[glyph.id].id).length == 0, "Glyph already exists");

        _registerGlyph(glyph);
    }

    /**
     * @notice Update an existing glyph (owner only)
     * @param glyph The updated glyph struct
     */
    function updateGlyph(Glyph calldata glyph) external onlyOwner {
        require(bytes(glyphs[glyph.id].id).length > 0, "Glyph does not exist");

        glyphs[glyph.id] = glyph;

        emit GlyphUpdated(glyph.id, glyph.meaning, glyph.pose, glyph.symbol);
    }

    /**
     * @notice Deactivate a glyph (owner only)
     * @param id The glyph ID to deactivate
     */
    function deactivateGlyph(string calldata id) external onlyOwner {
        require(bytes(glyphs[id].id).length > 0, "Glyph does not exist");
        require(glyphs[id].active, "Glyph already inactive");

        glyphs[id].active = false;

        emit GlyphDeactivated(id);
    }

    /**
     * @notice Activate a glyph (owner only)
     * @param id The glyph ID to activate
     */
    function activateGlyph(string calldata id) external onlyOwner {
        require(bytes(glyphs[id].id).length > 0, "Glyph does not exist");
        require(!glyphs[id].active, "Glyph already active");

        glyphs[id].active = true;

        emit GlyphActivated(id);
    }

    /**
     * @notice Get a glyph by ID
     * @param id The glyph ID
     * @return The glyph struct
     */
    function getGlyph(string calldata id) external view returns (Glyph memory) {
        require(bytes(glyphs[id].id).length > 0, "Glyph does not exist");
        return glyphs[id];
    }

    /**
     * @notice Check if a glyph exists
     * @param id The glyph ID
     * @return True if glyph exists
     */
    function glyphExists(string calldata id) external view returns (bool) {
        return bytes(glyphs[id].id).length > 0;
    }

    /**
     * @notice Check if a glyph is active
     * @param id The glyph ID
     * @return True if glyph exists and is active
     */
    function isGlyphActive(string calldata id) external view returns (bool) {
        return bytes(glyphs[id].id).length > 0 && glyphs[id].active;
    }

    /**
     * @notice Get all registered glyphs
     * @return Array of all glyph structs
     */
    function getAllGlyphs() external view returns (Glyph[] memory) {
        Glyph[] memory result = new Glyph[](glyphIds.length);
        for (uint256 i = 0; i < glyphIds.length; i++) {
            result[i] = glyphs[glyphIds[i]];
        }
        return result;
    }

    /**
     * @notice Get all active glyphs
     * @return Array of active glyph structs
     */
    function getActiveGlyphs() external view returns (Glyph[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < glyphIds.length; i++) {
            if (glyphs[glyphIds[i]].active) {
                activeCount++;
            }
        }

        Glyph[] memory result = new Glyph[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < glyphIds.length; i++) {
            if (glyphs[glyphIds[i]].active) {
                result[index] = glyphs[glyphIds[i]];
                index++;
            }
        }
        return result;
    }

    /**
     * @notice Get total number of registered glyphs
     * @return Count of all glyphs
     */
    function getGlyphCount() external view returns (uint256) {
        return glyphIds.length;
    }

    /**
     * @dev Internal function to register a glyph
     */
    function _registerGlyph(Glyph memory glyph) internal {
        glyphs[glyph.id] = glyph;
        glyphIds.push(glyph.id);

        emit GlyphRegistered(glyph.id, glyph.meaning, glyph.pose, glyph.symbol);
    }
}
