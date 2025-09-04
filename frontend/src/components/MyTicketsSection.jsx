import React, { useState } from "react";
import './MyTicketsSection.css';
import TicketModal from './TicketModal';

export default function MyTicketsSection({ 
  events, 
  currentAddress, 
  onTransfer, 
  onList, 
  onCancel
}) {
  // New state for modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  
  // Filter events where the user has tickets
  const eventsWithMyTickets = events.filter(ev => ev.myTickets && ev.myTickets.length > 0);
  
  // Handle opening the ticket modal
  const handleTicketClick = (event, ticketId) => {
    setSelectedEvent(event);
    setSelectedTicket(ticketId);
    setModalOpen(true);
  };
  
  // Handle ticket operations
  const handleTransfer = (recipient) => {
    onTransfer(selectedEvent.address, selectedTicket, recipient);
    setModalOpen(false);
  };
  
  const handleList = (price, expiryTimestamp) => {
    onList(selectedEvent.address, selectedTicket, price, expiryTimestamp);
    setModalOpen(false);
  };
  
  const handleCancel = () => {
    onCancel(selectedEvent.address, selectedTicket);
    setModalOpen(false);
  };
  
  if (eventsWithMyTickets.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🎟️</div>
        <h2 className="empty-state-title">No Tickets Found</h2>
        <p className="empty-state-text">
          You don't have any tickets yet. Purchase tickets from the Events tab to see them here.
        </p>
      </div>
    );
  }
  
  return (
    <div className="my-tickets-section">
      <h2 className="section-title">My Tickets</h2>
      
      {eventsWithMyTickets.map(event => (
        <div key={event.address} className="event-tickets">
          <h3 className="event-name">{event.name}</h3>
          <div className="tickets-grid">
            {event.myTickets.map(ticketId => {
              const listing = event.myListings.find(l => l.ticketId === ticketId);
              const isListed = listing && listing.seller !== "0x0000000000000000000000000000000000000000";
              
              return (
                <div 
                  key={ticketId} 
                  className={`ticket-card ${isListed ? 'listed' : ''}`}
                  onClick={() => handleTicketClick(event, ticketId)}
                >
                  <div className="ticket-header">
                    <span className="ticket-id">Ticket #{ticketId}</span>
                    {isListed && (
                      <span className="listing-badge">Listed</span>
                    )}
                  </div>
                  <div className="ticket-details">
                    <p className="ticket-event">{event.name}</p>
                    <p className="ticket-date">{event.date}</p>
                    {isListed && (
                      <p className="listing-price">{listing.price} ETH</p>
                    )}
                  </div>
                  <div className="ticket-footer">
                    <span className="view-details">View Details</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      
      {/* Ticket Modal */}
      <TicketModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        event={selectedEvent}
        ticketId={selectedTicket}
        onTransfer={handleTransfer}
        onList={handleList}
        onCancel={handleCancel}
        currentAddress={currentAddress}
      />
    </div>
  );
}