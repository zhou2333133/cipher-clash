// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {FHE} from "@fhevm/solidity/lib/FHE.sol";
import {CoprocessorConfig} from "@fhevm/solidity/lib/Impl.sol";

// 官方文档提供的 Sepolia FHEVM 配置常量。
address constant SEPOLIA_ZAMA_ORACLE_ADDRESS = 0xa02Cda4Ca3a71D7C46997716F4283aa851C28812;

library LocalZamaConfig {
    function getSepoliaProtocolId() internal pure returns (uint256) {
        return 10001;
    }

    function getSepoliaConfig() internal pure returns (CoprocessorConfig memory) {
        return CoprocessorConfig({
            ACLAddress: 0x687820221192C5B662b25367F70076A37bc79b6c,
            CoprocessorAddress: 0x848B0066793BcC60346Da1F49049357399B8D595,
            DecryptionOracleAddress: SEPOLIA_ZAMA_ORACLE_ADDRESS,
            KMSVerifierAddress: 0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC
        });
    }
}

contract LocalSepoliaConfig {
    constructor() {
        FHE.setCoprocessor(LocalZamaConfig.getSepoliaConfig());
    }

    function protocolId() public pure returns (uint256) {
        return LocalZamaConfig.getSepoliaProtocolId();
    }
}
