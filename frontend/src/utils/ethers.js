import { JsonRpcProvider, Contract, parseEther } from "ethers";
import { NETWORK_URL, FACTORY_ADDRESS, FACTORY_ABI } from "./constants";
import EventArtifact from "../abis/Event.json";

// Create one shared provider for all operations on the local network
const provider = new JsonRpcProvider(NETWORK_URL);

/** Returns a read-only instance of the EventFactory contract */
export function getFactory() {
  return new Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
}

/** Returns a signer from the first (unlocked) account on the local node */
export async function getSigner() {
  return provider.getSigner(0);
}

/** Returns a signer-ready instance of the EventFactory contract */
export async function getFactoryWithSigner() {
  const signer = await getSigner();
  return new Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);
}

/** Returns a read-only instance of an Event contract */
export function getEvent(address) {
  return new Contract(address, EventArtifact.abi, provider);
}

/** Returns a signer-enabled instance of an Event contract */
export async function getEventWithSigner(address) {
  const signer = await getSigner();
  return new Contract(address, EventArtifact.abi, signer);
}

/** Convert ETH to wei */
export function toWei(eth) {
  return parseEther(eth.toString());
}