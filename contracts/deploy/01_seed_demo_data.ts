import { ethers } from "hardhat";

/**
 * 将部署脚本输出的房间地址用于生成演示数据：
 * - 玩家 B 加入
 * - 双方模拟提交拳型（TODO：接入 FHE 加密）
 */
async function main() {
  const [playerA, playerB] = await ethers.getSigners();
  const registryAddress = process.env.REGISTRY_ADDRESS;
  const roomIdRaw = process.env.ROOM_ID;

  if (!registryAddress || !roomIdRaw) {
    throw new Error("REGISTRY_ADDRESS 与 ROOM_ID 必须在环境变量中设置");
  }

  const registry = await ethers.getContractAt("CipherClashRegistry", registryAddress);
  const roomId = BigInt(roomIdRaw);
  const room = await registry.rooms(roomId);
  const stake = room.stake;

  await registry
    .connect(playerB)
    .joinRoom(roomId, {
      value: stake
    });

  console.log("玩家 B 已加入房间", roomIdRaw);
  console.log("下一步：使用前端或 Hardhat 脚本提交密文出拳");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
