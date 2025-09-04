import React, { useState } from "react";
import './ExpandedEventView.css';
import TicketModal from './TicketModal';

export default function ExpandedEventView({ 
  event, 
  onBack, 
  onBuyTicket, 
  onTransfer,
  onList,
  onCancel,
  currentAddress 
}) {
  const isExpired = event.rawDate < Math.floor(Date.now() / 1000);
  const isSoldOut = event.sold >= event.maxSupply;
  
  // Find tickets owned by current user
  const myTickets = event.myTickets || [];
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  
  // Handle opening the ticket modal
  const handleTicketClick = (ticketId) => {
    setSelectedTicket(ticketId);
    setModalOpen(true);
  };
  
  // Handle ticket operations
  const handleTransfer = (recipient) => {
    onTransfer(event.address, selectedTicket, recipient);
    setModalOpen(false);
  };
  
  const handleList = (price, expiryTimestamp) => {
    onList(event.address, selectedTicket, price, expiryTimestamp);
    setModalOpen(false);
  };
  
  const handleCancel = () => {
    onCancel(event.address, selectedTicket);
    setModalOpen(false);
  };
  
  return (
    <div className="expanded-event">
      <div className="expanded-header">
        <button className="back-button" onClick={onBack}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>
      </div>
      
      <div className="event-hero">
        {event.bannerImage ? (
          <div 
            className="event-banner" 
            style={{ backgroundImage: `url(${event.bannerImage})` }}
          ></div>
        ) : (
          <div className="event-banner"></div>
        )}
        <h1 className="event-title">{event.name}</h1>
      </div>
      
      <div className="event-content">
        <div className="event-info-panel">
          <div className="info-section">
            <h2>Event Details</h2>
            
            {/* Event Description */}
            {event.description && (
              <div className="event-description">
                <p>{event.description}</p>
              </div>
            )}
            
            <div className="info-grid">
              <div className="info-item">
                <h3>Date & Time</h3>
                <p>{event.date}</p>
              </div>
              <div className="info-item">
                <h3>Price</h3>
                <p className="price-value">{event.price} ETH</p>
              </div>
              <div className="info-item">
                <h3>Availability</h3>
                <p>{event.sold} / {event.maxSupply} tickets sold</p>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${(event.sold / event.maxSupply) * 100}%` }}
                  ></div>
                </div>
              </div>
              {event.category && (
                <div className="info-item">
                  <h3>Category</h3>
                  <p>{event.category}</p>
                </div>
              )}
            </div>
            
            {!isExpired && !isSoldOut && (
              <div className="buy-section">
                <button className="buy-btn-large" onClick={onBuyTicket}>
                  Buy Ticket for {event.price} ETH
                </button>
              </div>
            )}
            
            {isExpired && (
              <div className="event-status expired">
                This event has ended
              </div>
            )}
            
            {!isExpired && isSoldOut && (
              <div className="event-status sold-out">
                This event is sold out
              </div>
            )}
          </div>
          
          {myTickets.length > 0 && (
            <div className="my-tickets-section">
              <h2>My Tickets</h2>
              <div className="tickets-grid">
                {myTickets.map(ticketId => {
                  const listing = event.myListings.find(l => l.ticketId === ticketId);
                  const isListed = listing && listing.seller !== "0x0000000000000000000000000000000000000000";
                  
                  return (
                    <div 
                      key={ticketId} 
                      className={`ticket-card ${isListed ? 'listed' : ''}`}
                      onClick={() => handleTicketClick(ticketId)}
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
          )}
          
          {event.marketplaceListings.length > 0 && (
            <div className="marketplace-section">
              <h2>Available on Marketplace</h2>
              <div className="tickets-grid">
                {event.marketplaceListings.map(listing => (
                  <div 
                    key={listing.ticketId} 
                    className="ticket-card marketplace"
                    onClick={() => handleTicketClick(listing.ticketId)}
                  >
                    <div className="ticket-header">
                      <span className="ticket-id">Ticket #{listing.ticketId}</span>
                      <span className="marketplace-badge">Marketplace</span>
                    </div>
                    <div className="ticket-details">
                      <p className="ticket-event">{event.name}</p>
                      <p className="ticket-date">{event.date}</p>
                      <p className="listing-price">{listing.price} ETH</p>
                    </div>
                    <div className="ticket-footer">
                      <span className="view-details">View Details</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Ticket Modal */}
      <TicketModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        event={event}
        ticketId={selectedTicket}
        onTransfer={handleTransfer}
        onList={handleList}
        onCancel={handleCancel}
        currentAddress={currentAddress}
      />
    </div>
  );
}