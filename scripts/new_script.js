require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  console.log("\n🛡️  SIGNERS");
  const [deployer, user1, user2, user3] = await ethers.getSigners();
  console.log(` • Deployer: ${deployer.address}`);
  console.log(` • User1:    ${user1.address}`);
  console.log(` • User2:    ${user2.address}`);
  console.log(` • User3:    ${user3.address}\n`);

  const signers = {
    [deployer.address.toLowerCase()]: deployer,
    [user1.address.toLowerCase()]: user1,
    [user2.address.toLowerCase()]: user2,
    [user3.address.toLowerCase()]: user3,
  };

  console.log("🏭 DEPLOYING EventFactory");
  const Factory = await ethers.getContractFactory("EventFactory");
  const factory = await Factory.deploy();
  await (factory.waitForDeployment?.() || factory.deployed());
  const factoryAddr = factory.target ?? factory.address;
  console.log(` • Factory Address: ${factoryAddr}\n`);

//   console.log("🆕 CREATING EVENTS");
//   const now = Math.floor(Date.now() / 1000);
//   const oneWeek = now + 7 * 24 * 3600;

//   const baseURI = process.env.IPFS_BASE_URI;
//   if (!baseURI) throw new Error("Please set IPFS_BASE_URI in your .env file");

//   // Now using metadataURI directly instead of separate description
//   const event1URI = `${baseURI}event-one`;
//   const event2URI = `${baseURI}event-two`;

//   let tx = await factory.connect(user1).createEvent(
//     "Event One",
//     oneWeek,
//     ethers.parseEther("0.05"),
//     5,
//     event1URI
//   );
//   await tx.wait();
//   console.log(` • [Event One] created by User1 (${user1.address})`);

//   tx = await factory.connect(user2).createEvent(
//     "Event Two",
//     oneWeek,
//     ethers.parseEther("0.02"), 
//     5,
//     event2URI
//   );
//   await tx.wait();
//   console.log(` • [Event Two] created by User2 (${user2.address})`);

//   const [ev1Addr, ev2Addr] = await factory.getAllEvents();
//   console.log(`\n • Deployed Event Addresses:`);
//   console.log(`     - Event One: ${ev1Addr}`);
//   console.log(`     - Event Two: ${ev2Addr}\n`);

//   console.log(` • Event One Metadata URI: ${event1URI}`);
//   console.log(` • Event Two Metadata URI: ${event2URI}\n`);

//   console.log("💰 BUYING TICKETS");
//   const Event = await ethers.getContractFactory("Event");
//   const ev1 = Event.attach(ev1Addr);
//   const ev2 = Event.attach(ev2Addr);

//   await (await ev1.connect(user1).buyTicket({ value: ethers.parseEther("0.05") })).wait();
//   console.log(` • User1 bought 1 ticket from Event One`);
//   await (await ev1.connect(user2).buyTicket({ value: ethers.parseEther("0.05") })).wait();
//   console.log(` • User2 bought 1 ticket from Event One`);
//   await (await ev2.connect(user3).buyTicket({ value: ethers.parseEther("0.02") })).wait();
//   console.log(` • User3 bought 1 ticket from Event Two`);
//   await (await ev2.connect(user1).buyTicket({ value: ethers.parseEther("0.02") })).wait();
//   console.log(` • User1 bought 1 ticket from Event Two\n`);

//   console.log("✉️  TRANSFERRING TICKETS");
//   let tickets = await ev1.connect(user2).getMyTickets();
//   await (await ev1.connect(user2).transferTicket(user3.address, tickets[0])).wait();
//   console.log(` • User2 → User3: Event One Ticket #${tickets[0]}`);

//   tickets = await ev2.connect(user1).getMyTickets();
//   await (await ev2.connect(user1).transferTicket(user2.address, tickets[0])).wait();
//   console.log(` • User1 → User2: Event Two Ticket #${tickets[0]}\n`);

//   console.log("📊 EVENT-WISE OVERVIEW");
//   for (const [i, evContract] of [[1, ev1], [2, ev2]]) {
//     const addr = i === 1 ? ev1Addr : ev2Addr;
//     const name = await evContract.eventName();
//     const metadataURI = await evContract.eventMetadataURI();
//     const orgAddr = await evContract.organizer();
//     const sold = await evContract.connect(signers[orgAddr.toLowerCase()]).getSoldTickets();

//     console.log(`\n>> Event ${i}: "${name}"`);
//     console.log(`   • Address: ${addr}`);
//     console.log(`   • Metadata URI: ${metadataURI}`);
//     console.log(`   • Sold Tickets:`);
//     for (const id of sold) {
//       const owner = await evContract.ownerOf(id);
//       console.log(`     ▸ #${id} → ${owner}`);
//     }
//   }

//   console.log("\n👥 USER-WISE OVERVIEW");
//   for (const user of [user1, user2, user3]) {
//     console.log(`\n>> User: ${user.address}`);
//     for (const [i, evContract] of [[1, ev1], [2, ev2]]) {
//       const name = await evContract.eventName();
//       const holding = await evContract.connect(user).getMyTickets();
//       if (holding.length === 0) continue;
//       console.log(`   • ${name} — Tickets:`);
//       holding.forEach(id => console.log(`     ▸ #${id}`));
//     }
//   }

//   console.log("\n🎉 All operations complete!\n");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Script error:", err);
    process.exit(1);
  });