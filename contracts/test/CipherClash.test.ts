import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

const STAKE = ethers.parseEther("0.00001");

async function deployRegistryFixture() {
  const [owner, challenger, stranger] = await ethers.getSigners();
  const Registry = await ethers.getContractFactory("CipherClashRegistry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();

  const createTx = await registry.createRoom(STAKE, 60, 300, true, { value: STAKE });
  const receipt = await createTx.wait();
  const roomCreatedLog = receipt?.logs.find((log) => log.fragment?.name === "RoomCreated");
  if (!roomCreatedLog) {
    throw new Error("RoomCreated event not found");
  }

  const roomId = Number(roomCreatedLog.args.roomId);
  const roomInfo = await registry.getRoomInfo(roomId);
  const clash = await ethers.getContractAt("CipherClash", roomInfo.contractAddress);

  return { owner, challenger, stranger, registry, clash, roomId };
}

async function setStorageBool(address: string, slot: number, value: boolean) {
  const paddedValue = value ? "0x01" : "0x00";
  await ethers.provider.send("hardhat_setStorageAt", [
    address,
    ethers.toBeHex(slot, 32),
    ethers.zeroPadValue(paddedValue, 32)
  ]);
}

async function setStorageUint256(address: string, slot: number, value: bigint) {
  await ethers.provider.send("hardhat_setStorageAt", [
    address,
    ethers.toBeHex(slot, 32),
    ethers.zeroPadValue(ethers.toBeHex(value), 32)
  ]);
}

async function setStorageAddress(address: string, slot: number, value: string) {
  await ethers.provider.send("hardhat_setStorageAt", [
    address,
    ethers.toBeHex(slot, 32),
    ethers.zeroPadValue(value, 32)
  ]);
}

describe("CipherClashRegistry", function () {
  it("creates rooms and emits RoomCreated", async function () {
    const { registry, roomId, clash } = await loadFixture(deployRegistryFixture);
    expect(roomId).to.equal(1);
    expect(await clash.playerA()).to.properAddress;

    const info = await registry.getRoomInfo(roomId);
    expect(info.playerA).to.properAddress;
    expect(info.playerB).to.equal(ethers.ZeroAddress);
    expect(info.stake).to.equal(STAKE);
  });

  it("allows challenger to join with matching stake", async function () {
    const { registry, clash, challenger, roomId } = await loadFixture(deployRegistryFixture);

    await expect(
      registry.connect(challenger).joinRoom(roomId, { value: STAKE })
    ).to.emit(registry, "RoomJoined").withArgs(roomId, challenger.address);

    const state = await clash.state();
    expect(state).to.equal(1); // AwaitingMoves
    expect(await clash.playerB()).to.equal(challenger.address);
  });

  it("reverts join when stake mismatches", async function () {
    const { registry, challenger, roomId } = await loadFixture(deployRegistryFixture);

    await expect(
      registry.connect(challenger).joinRoom(roomId, { value: STAKE / 2n })
    ).to.be.revertedWithCustomError(registry, "InvalidStake");
  });

  it("finalizes match and updates leaderboard when registry sees resolved state", async function () {
    const { registry, clash, owner, challenger, roomId } = await loadFixture(deployRegistryFixture);

    await registry.connect(challenger).joinRoom(roomId, { value: STAKE });

    // 1. 手动设置 moveA 已提交、state 为 AwaitingMoves
    // 说明：以下 slot 通过 `getStorageAt` 在本地推断，仅在 31337 测试链使用。
    const moveASubmittedSlot = 6;
    const moveBSubmittedSlot = 7;
    const stateSlot = 2;
    const lastMoveTimestampSlot = 3;
    const winnerSlot = 8;
    const lastResultPlaintextSlot = 9;

    await setStorageBool(await clash.getAddress(), moveASubmittedSlot, true);
    await setStorageBool(await clash.getAddress(), moveBSubmittedSlot, false);

    // 2. 更新时间戳让 forceResolve 可执行
    await setStorageUint256(await clash.getAddress(), lastMoveTimestampSlot, 0n);
    await time.increase(120);

    // 3. 玩家 A 调用 forceResolve -> winner 应为 playerA
    await clash.connect(owner).forceResolve();

    // 4. Registry finalize 之前，把状态改成 Resolved，并填入赢家信息
    await setStorageUint256(await clash.getAddress(), stateSlot, 3n); // RoomState.Resolved
    await setStorageAddress(await clash.getAddress(), winnerSlot, owner.address);
    await setStorageUint256(await clash.getAddress(), lastResultPlaintextSlot, 1n); // PlayerAWin

    const registryAddress = await registry.getAddress();
    const balanceBefore = await ethers.provider.getBalance(registryAddress);
    expect(balanceBefore).to.equal(STAKE * 2n);

    const finalizeTx = await registry.finalizeMatch(roomId);
    await expect(finalizeTx)
      .to.emit(registry, "MatchFinalized")
      .withArgs(roomId, owner.address, 1);

    const balanceAfter = await ethers.provider.getBalance(registryAddress);
    expect(balanceAfter).to.equal(0n);

    const leaderboard = await registry.getLeaderboard(10);
    expect(leaderboard[0].player).to.equal(owner.address);
    expect(Number(leaderboard[0].wins)).to.equal(1);
    expect(Number(leaderboard[0].points)).to.equal(3);
  });
});
