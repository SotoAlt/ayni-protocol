// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AgentRegistry
 * @notice ERC-8004 compatible agent identity registry
 * @dev Extends ERC-721 for portable agent identity across networks
 */
contract AgentRegistry is ERC721, ERC721Enumerable, Ownable {
    struct Agent {
        string name;
        string serviceUrl;     // API endpoint
        string[] protocols;    // ["ayni", "mcp", "a2a"]
        string agentCard;      // IPFS hash of agent card JSON
        uint256 registeredAt;
        bool active;
    }

    // Token ID counter
    uint256 private _nextTokenId;

    // Mapping from token ID to Agent struct
    mapping(uint256 => Agent) private agents;

    // Mapping from address to their agent token ID (one agent per address)
    mapping(address => uint256) private addressToTokenId;

    // Mapping to check if address has registered
    mapping(address => bool) private hasRegistered;

    // Mapping for linked wallets (external wallets linked to an agent)
    mapping(address => uint256) private linkedWallets;

    // Mapping to track if a wallet is actually linked (needed because tokenId 0 is valid)
    mapping(address => bool) private walletIsLinked;

    // Mapping to track which wallets are linked to which agent
    mapping(uint256 => address[]) private agentLinkedWallets;

    // Events
    event AgentRegistered(
        uint256 indexed tokenId,
        address indexed owner,
        string name,
        string serviceUrl
    );
    event AgentUpdated(uint256 indexed tokenId, string name, string serviceUrl);
    event AgentDeactivated(uint256 indexed tokenId);
    event AgentActivated(uint256 indexed tokenId);
    event WalletLinked(uint256 indexed tokenId, address indexed wallet);
    event WalletUnlinked(uint256 indexed tokenId, address indexed wallet);

    constructor() ERC721("Ayni Agent", "AYNI-AGENT") Ownable(msg.sender) {}

    /**
     * @notice Register a new agent (mints ERC-721 token to caller)
     * @param agent The agent struct to register
     * @return tokenId The token ID of the new agent
     */
    function registerAgent(Agent calldata agent) external returns (uint256 tokenId) {
        require(bytes(agent.name).length > 0, "Agent name cannot be empty");
        require(!hasRegistered[msg.sender], "Address already has an agent");

        tokenId = _nextTokenId++;

        _safeMint(msg.sender, tokenId);

        agents[tokenId] = Agent({
            name: agent.name,
            serviceUrl: agent.serviceUrl,
            protocols: agent.protocols,
            agentCard: agent.agentCard,
            registeredAt: block.timestamp,
            active: true
        });

        addressToTokenId[msg.sender] = tokenId;
        hasRegistered[msg.sender] = true;

        emit AgentRegistered(tokenId, msg.sender, agent.name, agent.serviceUrl);
    }

    /**
     * @notice Update an existing agent
     * @param tokenId The token ID of the agent to update
     * @param agent The updated agent struct
     */
    function updateAgent(uint256 tokenId, Agent calldata agent) external {
        require(ownerOf(tokenId) == msg.sender, "Not the agent owner");
        require(bytes(agent.name).length > 0, "Agent name cannot be empty");

        agents[tokenId].name = agent.name;
        agents[tokenId].serviceUrl = agent.serviceUrl;
        agents[tokenId].protocols = agent.protocols;
        agents[tokenId].agentCard = agent.agentCard;

        emit AgentUpdated(tokenId, agent.name, agent.serviceUrl);
    }

    /**
     * @notice Deactivate an agent
     * @param tokenId The token ID of the agent
     */
    function deactivateAgent(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not the agent owner");
        require(agents[tokenId].active, "Agent already inactive");

        agents[tokenId].active = false;

        emit AgentDeactivated(tokenId);
    }

    /**
     * @notice Activate an agent
     * @param tokenId The token ID of the agent
     */
    function activateAgent(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not the agent owner");
        require(!agents[tokenId].active, "Agent already active");

        agents[tokenId].active = true;

        emit AgentActivated(tokenId);
    }

    /**
     * @notice Get an agent by token ID
     * @param tokenId The token ID
     * @return The agent struct
     */
    function getAgent(uint256 tokenId) external view returns (Agent memory) {
        require(_ownerOf(tokenId) != address(0), "Agent does not exist");
        return agents[tokenId];
    }

    /**
     * @notice Get an agent by owner address
     * @param owner The owner address
     * @return The agent struct
     */
    function getAgentByOwner(address owner) external view returns (Agent memory) {
        require(hasRegistered[owner], "Address has no agent");
        return agents[addressToTokenId[owner]];
    }

    /**
     * @notice Get token ID for an address
     * @param owner The owner address
     * @return The token ID
     */
    function getTokenIdByOwner(address owner) external view returns (uint256) {
        require(hasRegistered[owner], "Address has no agent");
        return addressToTokenId[owner];
    }

    /**
     * @notice Check if an address has registered an agent
     * @param addr The address to check
     * @return True if address has an agent
     */
    function hasAgent(address addr) external view returns (bool) {
        return hasRegistered[addr];
    }

    /**
     * @notice Link an external wallet to an existing agent
     * @dev Allows agents to have multiple wallets without re-registration
     * @param tokenId The token ID of the agent
     * @param wallet The wallet address to link
     */
    function linkWallet(uint256 tokenId, address wallet) external {
        require(ownerOf(tokenId) == msg.sender, "Not the agent owner");
        require(wallet != address(0), "Invalid wallet address");
        require(!hasRegistered[wallet], "Wallet is primary for another agent");
        require(!walletIsLinked[wallet], "Wallet already linked");
        require(wallet != msg.sender, "Cannot link owner wallet");

        linkedWallets[wallet] = tokenId;
        walletIsLinked[wallet] = true;
        agentLinkedWallets[tokenId].push(wallet);

        emit WalletLinked(tokenId, wallet);
    }

    /**
     * @notice Unlink a wallet from an agent
     * @param tokenId The token ID of the agent
     * @param wallet The wallet address to unlink
     */
    function unlinkWallet(uint256 tokenId, address wallet) external {
        require(ownerOf(tokenId) == msg.sender, "Not the agent owner");
        require(walletIsLinked[wallet] && linkedWallets[wallet] == tokenId, "Wallet not linked to this agent");

        delete linkedWallets[wallet];
        delete walletIsLinked[wallet];

        // Remove from agentLinkedWallets array
        address[] storage wallets = agentLinkedWallets[tokenId];
        for (uint256 i = 0; i < wallets.length; i++) {
            if (wallets[i] == wallet) {
                wallets[i] = wallets[wallets.length - 1];
                wallets.pop();
                break;
            }
        }

        emit WalletUnlinked(tokenId, wallet);
    }

    /**
     * @notice Get agent by any associated wallet (owner or linked)
     * @param wallet The wallet address to look up
     * @return The agent struct
     */
    function getAgentByWallet(address wallet) external view returns (Agent memory) {
        // Check if wallet is primary owner
        if (hasRegistered[wallet]) {
            return agents[addressToTokenId[wallet]];
        }

        // Check if wallet is linked
        require(walletIsLinked[wallet], "No agent for wallet");
        uint256 linkedTokenId = linkedWallets[wallet];
        require(_ownerOf(linkedTokenId) != address(0), "Agent does not exist");

        return agents[linkedTokenId];
    }

    /**
     * @notice Get token ID for any associated wallet (owner or linked)
     * @param wallet The wallet address
     * @return The token ID
     */
    function getTokenIdByWallet(address wallet) external view returns (uint256) {
        if (hasRegistered[wallet]) {
            return addressToTokenId[wallet];
        }

        require(walletIsLinked[wallet], "No agent for wallet");
        return linkedWallets[wallet];
    }

    /**
     * @notice Check if a wallet is linked to any agent
     * @param wallet The wallet address to check
     * @return True if wallet is linked
     */
    function isWalletLinked(address wallet) external view returns (bool) {
        return walletIsLinked[wallet];
    }

    /**
     * @notice Get all linked wallets for an agent
     * @param tokenId The token ID of the agent
     * @return Array of linked wallet addresses
     */
    function getLinkedWallets(uint256 tokenId) external view returns (address[] memory) {
        require(_ownerOf(tokenId) != address(0), "Agent does not exist");
        return agentLinkedWallets[tokenId];
    }

    /**
     * @notice Check if an agent is active
     * @param tokenId The token ID
     * @return True if agent is active
     */
    function isActive(uint256 tokenId) external view returns (bool) {
        require(_ownerOf(tokenId) != address(0), "Agent does not exist");
        return agents[tokenId].active;
    }

    /**
     * @notice Find agents by protocol
     * @param protocol The protocol to search for (e.g., "ayni")
     * @return Array of token IDs that support the protocol
     */
    function findByProtocol(string calldata protocol) external view returns (uint256[] memory) {
        uint256 total = totalSupply();
        uint256[] memory temp = new uint256[](total);
        uint256 count = 0;

        for (uint256 i = 0; i < total; i++) {
            uint256 tokenId = tokenByIndex(i);
            Agent storage agent = agents[tokenId];

            if (agent.active) {
                for (uint256 j = 0; j < agent.protocols.length; j++) {
                    if (keccak256(bytes(agent.protocols[j])) == keccak256(bytes(protocol))) {
                        temp[count] = tokenId;
                        count++;
                        break;
                    }
                }
            }
        }

        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = temp[i];
        }

        return result;
    }

    /**
     * @notice Get total number of registered agents
     * @return Count of agents
     */
    function getAgentCount() external view returns (uint256) {
        return totalSupply();
    }

    /**
     * @notice Get all active agents (paginated)
     * @param offset Starting index
     * @param limit Maximum number of results
     * @return Array of agent structs
     */
    function getActiveAgents(uint256 offset, uint256 limit) external view returns (Agent[] memory) {
        uint256 total = totalSupply();

        if (offset >= total) {
            return new Agent[](0);
        }

        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }

        uint256 activeCount = 0;
        Agent[] memory temp = new Agent[](end - offset);

        for (uint256 i = offset; i < end; i++) {
            uint256 tokenId = tokenByIndex(i);
            if (agents[tokenId].active) {
                temp[activeCount] = agents[tokenId];
                activeCount++;
            }
        }

        Agent[] memory result = new Agent[](activeCount);
        for (uint256 i = 0; i < activeCount; i++) {
            result[i] = temp[i];
        }

        return result;
    }

    // Override required by Solidity for multiple inheritance
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        // Update address mappings on transfer
        address from = _ownerOf(tokenId);

        if (from != address(0)) {
            delete addressToTokenId[from];
            hasRegistered[from] = false;
        }

        if (to != address(0)) {
            addressToTokenId[to] = tokenId;
            hasRegistered[to] = true;
        }

        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
