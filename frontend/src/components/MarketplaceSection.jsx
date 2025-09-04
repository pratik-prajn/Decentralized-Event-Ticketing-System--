import React from "react";
import './MarketplaceSection.css';

export default function MarketplaceSection({
  events,
  currentAddress,
  onBuy,
  onExpandEvent,
  onExpandTicket
}) {
  // Filter events that haven't expired yet
  const currentTimestamp = Math.floor(Date.now() / 1000);
  
  // Filter events with valid marketplace listings (not expired)
  const eventsWithValidListings = events.filter(ev => {
    // First check if event has not expired
    if (ev.rawDate < currentTimestamp) {
      return false;
    }
    
    // Then check if it has listings
    return ev.marketplaceListings && ev.marketplaceListings.length > 0;
  });

  // Format address for display
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Additional filter to ensure individual listings haven't expired
  const getValidListingsForEvent = (event) => {
    return event.marketplaceListings.filter(listing => {
      // Check if listing expiration is still valid
      return listing.rawExpiresAt > currentTimestamp;
    });
  };

  if (eventsWithValidListings.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🛒</div>
        <h2 className="empty-state-title">Marketplace Empty</h2>
        <p className="empty-state-text">
          No tickets currently listed for sale. Check back later or list your own tickets.
        </p>
      </div>
    );
  }

  return (
    <div className="marketplace-section">
      <h2 className="section-title">Marketplace</h2>
      
      {eventsWithValidListings.map(event => {
        const validListings = getValidListingsForEvent(event);
        
        // Skip rendering this event if it has no valid listings
        if (validListings.length === 0) return null;
        
        return (
          <div key={event.address} className="marketplace-event">
            <h3 className="event-name">
              <span onClick={() => onExpandEvent(event.address)} className="event-link">
                {event.name}
              </span>
            </h3>
            
            <div className="marketplace-grid">
              {validListings.map(listing => (
                <div 
                  key={listing.ticketId} 
                  className="listing-card"
                  onClick={() => onExpandTicket(event.address, listing.ticketId)}
                >
                  <div className="listing-header">
                    <span className="ticket-id">Ticket #{listing.ticketId}</span>
                    <span className="listing-price-tag">{listing.price} ETH</span>
                  </div>
                  
                  <div className="listing-meta">
                    <div className="meta-item">
                      <span className="meta-label">Seller</span>
                      <span className="meta-value">{formatAddress(listing.seller)}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Expires</span>
                      <span className="meta-value">{listing.expiresAt}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Event</span>
                      <span className="meta-value">{event.name}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Date</span>
                      <span className="meta-value">{event.date}</span>
                    </div>
                  </div>
                  
                  <div className="listing-actions">
                    {listing.seller.toLowerCase() === currentAddress.toLowerCase() ? (
                      <button 
                        className="cancel-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onBuy(event.address, listing.ticketId, listing.price);
                        }}
                      >
                        Cancel Listing
                      </button>
                    ) : (
                      <button 
                        className="buy-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onBuy(event.address, listing.ticketId, listing.price);
                        }}
                      >
                        Buy Now
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}