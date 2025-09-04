const { expect } = require("chai");
const { time, loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

async function deployFactoryFixture() {
  const [organizer, user] = await ethers.getSigners();
  const Factory = await ethers.getContractFactory("EventFactory");
  const factory = await Factory.deploy();
  await factory.deployed?.();
  return { factory, organizer, user };
}

describe("EventFactory", function () {
  it("creates events and lists them", async function () {
    const { factory, organizer } = await loadFixture(deployFactoryFixture);

    const name = "Sample Event";
    const date = (await time.latest()) + 7 * 24 * 60 * 60; // +7 days
    const price = 1000n;
    const supply = 5n;
    const metadata = "ipfs://example-metadata";

    const tx = await factory.createEvent(name, date, price, supply, metadata);
    const rcpt = await tx.wait();

    const events = await factory.getAllEvents();
    expect(events.length).to.equal(1);

    const my = await factory.getMyEvents();
    expect(my.length).to.equal(1);
    expect(my[0]).to.equal(events[0]);

    // Check Event constructor state via a minimal interface
    const EventAbi = [
      "function eventName() view returns (string)",
      "function eventDate() view returns (uint256)",
      "function ticketPrice() view returns (uint256)",
      "function maxSupply() view returns (uint256)",
      "function organizer() view returns (address)",
      "function eventMetadataURI() view returns (string)"
    ];

    const eventAddr = events[0];
    const eventCtr = new ethers.Contract(eventAddr, EventAbi, organizer);

    expect(await eventCtr.eventName()).to.equal(name);
    expect(await eventCtr.organizer()).to.equal(organizer.address);
  });
});
