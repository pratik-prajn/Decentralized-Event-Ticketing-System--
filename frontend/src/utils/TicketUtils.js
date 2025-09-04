import { ethers } from "ethers";
import EventJSON from "../abis/Event.json";

export const buyTicket = async (signer, addr, price, callbacks = {}) => {
  const { onStatus, onSuccess } = callbacks;
  try {
    if (onStatus) onStatus("Buying ticket...", "info");
    const ev = new ethers.Contract(addr, EventJSON.abi, signer);
    const tx = await ev.buyTicket({ value: ethers.parseEther(price) });
    if (onStatus) onStatus("Transaction submitted. Waiting for confirmation...", "info");
    await tx.wait();
    if (onStatus) onStatus("Ticket purchased successfully!", "success");
    if (onSuccess) onSuccess();
  } catch (err) {
    console.error("Error buying ticket:", err);
    if (onStatus) onStatus("Failed to buy ticket: " + err.message, "error");
  }
};

export const transferTicket = async (signer, addr, tid, to, callbacks = {}) => {
  const { onStatus, onSuccess } = callbacks;
  try {
    // Check if the event has expired
    const ev = new ethers.Contract(addr, EventJSON.abi, signer);
    const eventDate = await ev.eventDate();
    const currentTimestamp = Math.floor(Date.now() / 1000);
    
    // If the event date has passed, don't allow transfer
    if (Number(eventDate) < currentTimestamp) {
      if (onStatus) onStatus("Cannot transfer ticket: Event has already expired", "error");
      return;
    }
    
    if (onStatus) onStatus("Transferring ticket...", "info");
    const tx = await ev.transferTicket(to, tid);
    if (onStatus) onStatus("Transaction submitted. Waiting for confirmation...", "info");
    await tx.wait();
    if (onStatus) onStatus("Ticket transferred successfully!", "success");
    if (onSuccess) onSuccess();
  } catch (err) {
    console.error("Error transferring ticket:", err);
    if (onStatus) onStatus("Failed to transfer ticket: " + err.message, "error");
  }
};

export const listTicket = async (signer, addr, tid, price, expires, callbacks = {}) => {
  const { onStatus, onSuccess } = callbacks;
  try {
    // Check if the event has expired
    const ev = new ethers.Contract(addr, EventJSON.abi, signer);
    const eventDate = await ev.eventDate();
    const currentTimestamp = Math.floor(Date.now() / 1000);
    
    // If the event date has passed, don't allow listing
    if (Number(eventDate) < currentTimestamp) {
      if (onStatus) onStatus("Cannot list ticket: Event has already expired", "error");
      return;
    }
    
    // Additional validation - make sure expiration doesn't exceed event date
    if (Number(expires) > Number(eventDate)) {
      // Set the expires time to event date if user tried to set it beyond event date
      expires = Number(eventDate);
      if (onStatus) onStatus("Listing expiration adjusted to event date", "info");
    }
    
    if (onStatus) onStatus("Approving ticket for listing...", "info");
    const approvalTx = await ev.approve(addr, tid);
    if (onStatus) onStatus("Approval submitted. Waiting for confirmation...", "info");
    await approvalTx.wait();
    if (onStatus) onStatus("Listing ticket...", "info");
    const tx = await ev.listTicket(tid, ethers.parseEther(price), Number(expires));
    if (onStatus) onStatus("Transaction submitted. Waiting for confirmation...", "info");
    await tx.wait();
    if (onStatus) onStatus("Ticket listed successfully!", "success");
    if (onSuccess) onSuccess();
  } catch (err) {
    console.error("Error listing ticket:", err);
    if (onStatus) onStatus("Failed to list ticket: " + err.message, "error");
  }
};

export const cancelListing = async (signer, addr, tid, callbacks = {}) => {
  const { onStatus, onSuccess } = callbacks;
  try {
    if (onStatus) onStatus("Canceling listing...", "info");
    const ev = new ethers.Contract(addr, EventJSON.abi, signer);
    const tx = await ev.cancelListing(tid);
    if (onStatus) onStatus("Transaction submitted. Waiting for confirmation...", "info");
    await tx.wait();
    if (onStatus) onStatus("Listing canceled successfully!", "success");
    if (onSuccess) onSuccess();
  } catch (err) {
    console.error("Error canceling listing:", err);
    if (onStatus) onStatus("Failed to cancel listing: " + err.message, "error");
  }
};

export const buyListedTicket = async (signer, addr, tid, price, callbacks = {}) => {
  const { onStatus, onSuccess } = callbacks;
  try {
    if (onStatus) onStatus("Buying listed ticket...", "info");
    const ev = new ethers.Contract(addr, EventJSON.abi, signer);
    const tx = await ev.buyListedTicket(tid, { value: ethers.parseEther(price) });
    if (onStatus) onStatus("Transaction submitted. Waiting for confirmation...", "info");
    await tx.wait();
    if (onStatus) onStatus("Ticket purchased from marketplace successfully!", "success");
    if (onSuccess) onSuccess();
  } catch (err) {
    console.error("Error buying listed ticket:", err);
    if (onStatus) onStatus("Failed to buy listed ticket: " + err.message, "error");
  }
};

export const createEvent = async (factory, eventData, callbacks = {}) => {
  const { onStatus, onSuccess } = callbacks;
  try {
    const { name, description, date, price, max, category } = eventData;
    // No file or metadata uploads. Pass an empty metadata URI string.
    if (onStatus) onStatus("Creating event...", "info");
    const tx = await factory.createEvent(
      name,
      Math.floor(date),
      ethers.parseEther(price),
      parseInt(max, 10),
      ""
    );
    if (onStatus) onStatus("Transaction submitted. Waiting for confirmation...", "info");
    await tx.wait();
    if (onStatus) onStatus("Event created successfully!", "success");
    if (onSuccess) onSuccess();
  } catch (err) {
    console.error("Error creating event:", err);
    if (onStatus) onStatus("Failed to create event: " + err.message, "error");
  }
};