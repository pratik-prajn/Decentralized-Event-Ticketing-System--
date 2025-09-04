import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import EventJSON from "../abis/Event.json";
import "./MyOrganizedEvents.css";

function MyOrganizedEvents({ 
  signer, 
  factory, 
  currentAddress, 
  events, 
  onStatusUpdate, 
  onExpandEvent 
}) {
  const [organizedEvents, setOrganizedEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [ticketOwners, setTicketOwners] = useState([]);
  const [loadingOwners, setLoadingOwners] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(null);

  useEffect(() => {
    if (!factory || !signer || !events.length || !currentAddress) return;
    
    const loadOrganizedEvents = async () => {
      try {
        setLoading(true);
        
        // Filter events where the current user is the organizer
        const organized = await Promise.all(
          events.map(async (event) => {
            const eventContract = new ethers.Contract(event.address, EventJSON.abi, signer);
            const organizer = await eventContract.organizer();
            
            // Return the event if the current user is the organizer
            if (organizer.toLowerCase() === currentAddress.toLowerCase()) {
              return event;
            }
            return null;
          })
        );
        
        // Filter out nulls
        setOrganizedEvents(organized.filter(e => e !== null));
        setLoading(false);
      } catch (err) {
        console.error("Error loading organized events:", err);
        if (onStatusUpdate) {
          onStatusUpdate("Failed to load organized events: " + err.message, "error");
        }
        setLoading(false);
      }
    };

    loadOrganizedEvents();
  }, [factory, signer, events, currentAddress, onStatusUpdate]);

  // Function to calculate event proceeds
  const calculateEventProceeds = (event) => {
    return (event.sold * event.price).toFixed(4);
  };

  // Function to view ticket owners
  const viewTicketOwners = async (event) => {
    try {
      setLoadingOwners(true);
      setSelectedEvent(event);
      
      const eventContract = new ethers.Contract(event.address, EventJSON.abi, signer);
      
      // Get sold tickets (only accessible by organizer)
      const soldTickets = await eventContract.getSoldTickets();
      
      // For each ticket, get the current owner
      const ownershipData = await Promise.all(
        soldTickets.map(async (ticketId) => {
          const owner = await eventContract.ownerOf(ticketId);
          return {
            ticketId: Number(ticketId),
            owner
          };
        })
      );
      
      setTicketOwners(ownershipData);
      setLoadingOwners(false);
    } catch (err) {
      console.error("Error loading ticket owners:", err);
      if (onStatusUpdate) {
        onStatusUpdate("Failed to load ticket owners: " + err.message, "error");
      }
      setLoadingOwners(false);
    }
  };

  // Function to close the ticket owners modal
  const closeTicketOwnersModal = () => {
    setSelectedEvent(null);
    setTicketOwners([]);
    setCopiedAddress(null); // Reset copied address state
  };

  // Function to shorten Ethereum address for display
  const shortenAddress = (address) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Function to format ticket ID with leading zeros
  const formatTicketId = (id) => {
    return id.toString().padStart(3, '0');
  };

  // Function to copy address to clipboard
  const copyAddressToClipboard = (address) => {
    navigator.clipboard.writeText(address)
      .then(() => {
        setCopiedAddress(address);
        // Reset the copied state after 2 seconds
        setTimeout(() => {
          setCopiedAddress(null);
        }, 2000);
      })
      .catch(err => {
        console.error("Could not copy address: ", err);
        if (onStatusUpdate) {
          onStatusUpdate("Failed to copy address to clipboard", "error");
        }
      });
  };

  if (loading) {
    return <div className="loading">Loading your organized events...</div>;
  }

  return (
    <div className="organized-events-section">
      <h2 className="section-title">My Organized Events</h2>
      
      {organizedEvents.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <p className="empty-state-text">You haven't organized any events yet.</p>
        </div>
      ) : (
        <div className="organized-events">
          <table className="event-table">
            <thead>
              <tr>
                <th>Event Name</th>
                <th>Date</th>
                <th>Ticket Price</th>
                <th>Tickets Sold</th>
                <th>Total Proceeds</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {organizedEvents.map((event) => (
                <tr key={event.address} className="event-row">
                  <td>{event.name}</td>
                  <td>{event.date}</td>
                  <td>{event.price} ETH</td>
                  <td>{event.sold}/{event.maxSupply}</td>
                  <td>{calculateEventProceeds(event)} ETH</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="view-details-btn"
                        onClick={() => onExpandEvent(event.address)}
                      >
                        View Details
                      </button>
                      <button 
                        className="view-owners-btn"
                        onClick={() => viewTicketOwners(event)}
                        disabled={event.sold === 0}
                      >
                        View Owners
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Ticket Owners Modal */}
      {selectedEvent && (
        <div className="ticket-owners-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Ticket Owners - {selectedEvent.name}</h3>
              <button className="close-button" onClick={closeTicketOwnersModal}>×</button>
            </div>
            
            <div className="modal-body">
              {loadingOwners ? (
                <div className="loading">Loading ticket owners...</div>
              ) : (
                <>
                  <div className="ticket-owners-summary">
                    <p>Total tickets sold: <strong>{selectedEvent.sold}</strong> of {selectedEvent.maxSupply}</p>
                  </div>
                  
                  {ticketOwners.length > 0 ? (
                    <div className="ticket-owners-list">
                      {ticketOwners.map((item) => (
                        <div key={item.ticketId} className="ticket-owner-item">
                          <div className="ticket-id">Ticket #{formatTicketId(item.ticketId)}</div>
                          <div className="ticket-owner">
                            <div className="owner-address-container">
                              <span className="owner-address" title={item.owner}>
                                {shortenAddress(item.owner)}
                              </span>
                              <button 
                                className={`copy-address-btn ${copiedAddress === item.owner ? 'copied' : ''}`}
                                onClick={() => copyAddressToClipboard(item.owner)}
                                title="Copy address to clipboard"
                              >
                                {copiedAddress === item.owner ? "Copied!" : "Copy"}
                              </button>
                            </div>
                            <a 
                              href={`https://etherscan.io/address/${item.owner}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="etherscan-link"
                            >
                              View on Etherscan
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-tickets-message">No tickets have been sold yet.</p>
                  )}
                </>
              )}
            </div>
            
            <div className="modal-footer">
              <button className="close-modal-btn" onClick={closeTicketOwnersModal}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyOrganizedEvents;