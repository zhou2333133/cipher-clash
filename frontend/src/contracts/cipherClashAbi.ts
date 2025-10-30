export const cipherClashAbi = [
  {
    "inputs": [
      { "internalType": "address", "name": "challenger", "type": "address" }
    ],
    "name": "join",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "struct externalEuint8", "name": "encryptedMove", "type": "bytes32" },
      { "internalType": "bytes", "name": "inputProof", "type": "bytes" }
    ],
    "name": "submitMove",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "moveASubmitted",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "moveBSubmitted",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "state",
    "outputs": [{ "internalType": "enum CipherClash.RoomState", "name": "", "type": "uint8" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "winner",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "lastResultPlaintext",
    "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [{ "indexed": true, "internalType": "address", "name": "player", "type": "address" }],
    "name": "MoveSubmitted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "uint8", "name": "resultCode", "type": "uint8" },
      { "indexed": false, "internalType": "address", "name": "winner", "type": "address" }
    ],
    "name": "MatchResolved",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [{ "indexed": false, "internalType": "string", "name": "reason", "type": "string" }],
    "name": "MatchFailed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [],
    "name": "RematchReady",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "forceResolve",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getEncryptedResult",
    "outputs": [{ "internalType": "euint8", "name": "", "type": "bytes32" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;
