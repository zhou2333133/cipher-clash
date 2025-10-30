import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deployer:", deployer.address);

  const Registry = await ethers.getContractFactory("CipherClashRegistry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();

  console.log("Registry deployed at:", await registry.getAddress());

  const stake = ethers.parseEther("0.01");
  const tx = await registry.createRoom(
    stake,
    90,
    180,
    true,
    {
      value: stake
    }
  );
  const receipt = await tx.wait();

  const created = receipt?.logs.find((log) => log.fragment?.name === "RoomCreated");
  if (created) {
    const { roomId, roomContract } = created.args;
    console.log("Room ID:", roomId.toString());
    console.log("CipherClash contract:", roomContract);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
