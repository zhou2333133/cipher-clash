export const registryAbi = [
  {
    "inputs": [
      { "internalType": "uint96", "name": "stake", "type": "uint96" },
      { "internalType": "uint32", "name": "moveTimeout", "type": "uint32" },
      { "internalType": "uint32", "name": "rematchWindow", "type": "uint32" },
      { "internalType": "bool", "name": "rankingEnabled", "type": "bool" }
    ],
    "name": "createRoom",
    "outputs": [
      { "internalType": "uint256", "name": "roomId", "type": "uint256" },
      { "internalType": "address", "name": "room", "type": "address" }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "roomId", "type": "uint256" }
    ],
    "name": "joinRoom",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "roomId", "type": "uint256" }
    ],
    "name": "finalizeMatch",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "roomCounter",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "name": "rooms",
    "outputs": [
      { "internalType": "address", "name": "contractAddress", "type": "address" },
      { "internalType": "address", "name": "playerA", "type": "address" },
      { "internalType": "address", "name": "playerB", "type": "address" },
      { "internalType": "uint96", "name": "stake", "type": "uint96" },
      { "internalType": "bool", "name": "rankingEnabled", "type": "bool" },
      { "internalType": "bool", "name": "completed", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "limit", "type": "uint256" }],
    "name": "getLeaderboard",
    "outputs": [
      {
        "components": [
          { "internalType": "address", "name": "player", "type": "address" },
          { "internalType": "uint64", "name": "points", "type": "uint64" },
          { "internalType": "uint32", "name": "wins", "type": "uint32" },
          { "internalType": "uint32", "name": "losses", "type": "uint32" },
          { "internalType": "uint32", "name": "ties", "type": "uint32" }
        ],
        "internalType": "struct CipherClashRegistry.LeaderboardEntry[]",
        "name": "entries",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;
