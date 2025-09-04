require("dotenv").config();
const { ethers } = require("hardhat");

async function logGas(tx, label) {
  if (!tx) {
    console.error(`${label} failed: Transaction object is undefined.`);
    return;
  }

  try {
    const receipt = await tx.wait();
    console.log(`${label} - Gas Used: ${receipt.gasUsed.toString()}`);
  } catch (error) {
    console.error(`${label} failed to wait for receipt: ${error.message}`);
  }
}

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
  await logGas(factory.deployTransaction, "EventFactory Deployment");

  const factoryAddr = factory.target ?? factory.address;
  console.log(` • Factory Address: ${factoryAddr}\n`);

  console.log("🆕 CREATING EVENTS");
  const now = Math.floor(Date.now() / 1000);
  const oneWeek = now + 7 * 24 * 3600;

  const baseURI = process.env.IPFS_BASE_URI;
  if (!baseURI) throw new Error("Please set IPFS_BASE_URI in your .env file");

  const event1URI = `${baseURI}event-one`;
  const event2URI = `${baseURI}event-two`;

  let tx = await factory.connect(user1).createEvent(
    "Event One",
    oneWeek,
    ethers.parseEther("0.05"),
    5,
    event1URI
  );
  await logGas(tx, "Event One Creation");

  tx = await factory.connect(user2).createEvent(
    "Event Two",
    oneWeek,
    ethers.parseEther("0.02"),
    5,
    event2URI
  );
  await logGas(tx, "Event Two Creation");

  const [ev1Addr, ev2Addr] = await factory.getAllEvents();
  console.log(`\n • Deployed Event Addresses:`);
  console.log(`     - Event One: ${ev1Addr}`);
  console.log(`     - Event Two: ${ev2Addr}\n`);

  console.log(` • Event One Metadata URI: ${event1URI}`);
  console.log(` • Event Two Metadata URI: ${event2URI}\n`);

  console.log("💰 BUYING TICKETS");
  const Event = await ethers.getContractFactory("Event");
  const ev1 = Event.attach(ev1Addr);
  const ev2 = Event.attach(ev2Addr);

  await logGas(await ev1.connect(user1).buyTicket({ value: ethers.parseEther("0.05") }), "User1 buying Ticket from Event One");
  await logGas(await ev1.connect(user2).buyTicket({ value: ethers.parseEther("0.05") }), "User2 buying Ticket from Event One");
  await logGas(await ev2.connect(user3).buyTicket({ value: ethers.parseEther("0.02") }), "User3 buying Ticket from Event Two");
  await logGas(await ev2.connect(user1).buyTicket({ value: ethers.parseEther("0.02") }), "User1 buying Ticket from Event Two\n");

  console.log("✉️  TRANSFERRING TICKETS");
  let tickets = await ev1.connect(user2).getMyTickets();
  await logGas(await ev1.connect(user2).transferTicket(user3.address, tickets[0]), "User2 → User3: Event One Ticket");

  tickets = await ev2.connect(user1).getMyTickets();
  await logGas(await ev2.connect(user1).transferTicket(user2.address, tickets[0]), "User1 → User2: Event Two Ticket\n");

  console.log("📝 LISTING TICKETS");
  // Example: User1 lists Ticket #1 from Event One
  tickets = await ev1.connect(user1).getMyTickets();
  const ticketId1 = tickets[0];
  
  // First, approve the contract to transfer the ticket
  await logGas(await ev1.connect(user1).approve(ev1.address, ticketId1), "User1 approving Event One Ticket");
  
  // Now, list the ticket
  await logGas(
    await ev1.connect(user1).listTicket(ticketId1, ethers.parseEther("0.1"), Math.floor(Date.now() / 1000) + 86400),
    "User1 listing Ticket from Event One"
  );
  
  // Example: User2 lists Ticket #1 from Event Two
  tickets = await ev2.connect(user2).getMyTickets();
  const ticketId2 = tickets[0];
  
  // First, approve the contract to transfer the ticket
  await logGas(await ev2.connect(user2).approve(ev2.address, ticketId2), "User2 approving Event Two Ticket");
  
  // Now, list the ticket
  await logGas(
    await ev2.connect(user2).listTicket(ticketId2, ethers.parseEther("0.05"), Math.floor(Date.now() / 1000) + 86400),
    "User2 listing Ticket from Event Two"
  );
  

  console.log("📝 UNLISTING TICKETS");
  // Example: User1 unlists Ticket #1 from Event One
  tickets = await ev1.connect(user1).getMyTickets();
  await logGas(await ev1.connect(user1).cancelListing(tickets[0]), "User1 unlisting Ticket from Event One");

  // Example: User2 unlists Ticket #1 from Event Two
  tickets = await ev2.connect(user2).getMyTickets();
  await logGas(await ev2.connect(user2).cancelListing(tickets[0]), "User2 unlisting Ticket from Event Two");

  console.log("🛍️  BUYING LISTED TICKETS");
  // User1 buys the listed ticket from Event One
  tickets = await ev1.connect(user1).getMyTickets();
  await logGas(await ev1.connect(user1).buyListedTicket(tickets[0], { value: ethers.parseEther("0.1") }), "User1 buying listed Ticket from Event One");

  // User3 buys the listed ticket from Event Two
  tickets = await ev2.connect(user3).getMyTickets();
  await logGas(await ev2.connect(user3).buyListedTicket(tickets[0], { value: ethers.parseEther("0.05") }), "User3 buying listed Ticket from Event Two\n");

  console.log("📊 EVENT-WISE OVERVIEW");
  for (const [i, evContract] of [[1, ev1], [2, ev2]]) {
    const addr = i === 1 ? ev1Addr : ev2Addr;
    const name = await evContract.eventName();
    const metadataURI = await evContract.eventMetadataURI();
    const orgAddr = await evContract.organizer();
    const sold = await evContract.connect(signers[orgAddr.toLowerCase()]).getSoldTickets();

    console.log(`\n>> Event ${i}: "${name}"`);
    console.log(`   • Address: ${addr}`);
    console.log(`   • Metadata URI: ${metadataURI}`);
    console.log(`   • Sold Tickets:`);
    for (const id of sold) {
      const owner = await evContract.ownerOf(id);
      console.log(`     ▸ #${id} → ${owner}`);
    }
  }

  console.log("\n👥 USER-WISE OVERVIEW");
  for (const user of [user1, user2, user3]) {
    console.log(`\n>> User: ${user.address}`);
    for (const [i, evContract] of [[1, ev1], [2, ev2]]) {
      const name = await evContract.eventName();
      const holding = await evContract.connect(user).getMyTickets();
      if (holding.length === 0) continue;
      console.log(`   • ${name} — Tickets:`);
      holding.forEach(id => console.log(`     ▸ #${id}`));
    }
  }

  console.log("\n🎉 All operations complete!\n");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Script error:", err);
    process.exit(1);
  });
