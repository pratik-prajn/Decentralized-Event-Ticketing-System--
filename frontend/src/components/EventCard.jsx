import React, { useState, useEffect } from "react";
import './EventCard.css';

export default function EventCard({ event, currentAddress, onBuyTicket, onExpand }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Extract image URL based on the event structure
  const cardImageUrl = event.metadata?.cardImage || event.cardImage || "";
  
  useEffect(() => {
    // Reset states when image URL changes
    setImageLoaded(false);
    setImageError(false);
    
    // Preload the image to check if it can be loaded
    if (cardImageUrl) {
      const img = new Image();
      img.onload = () => setImageLoaded(true);
      img.onerror = () => setImageError(true);
      img.src = cardImageUrl;
    }
  }, [cardImageUrl]);

  const formatTimeLeft = (timestamp) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = timestamp - now;
    if (diff <= 0) return "Expired";
    
    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Get event data from the appropriate location in object structure
  const name = event.onchain?.name || event.name;
  const date = event.onchain?.date || event.date;
  const price = event.onchain?.price || event.price;
  const sold = event.onchain?.sold || event.sold;
  const maxSupply = event.onchain?.maxSupply || event.maxSupply;
  const category = event.metadata?.category || event.category;
  const rawDate = event.rawDate || (event.onchain?.date ? new Date(event.onchain.date).getTime() / 1000 : 0);
  
  const progressPercentage = (sold / maxSupply) * 100;
  const isExpired = rawDate < Math.floor(Date.now() / 1000);

  // Updated image style to fill the entire container area
  const imageStyle = cardImageUrl && imageLoaded && !imageError 
    ? { 
        backgroundImage: `url(${cardImageUrl})`,
        backgroundSize: 'cover', // This will cover the entire container
        backgroundPosition: 'center', // Center the image
        backgroundRepeat: 'no-repeat',
      } 
    : {}; // Empty object will use the default gradient from CSS

  return (
    <div className="event-card" onClick={onExpand}>
      <div className="event-image" style={imageStyle}>
        <div className="event-time-left">
          {isExpired ? "Expired" : formatTimeLeft(rawDate)}
        </div>
      </div>
      
      <div className="event-header">
        <h3 className="event-title">{name}</h3>
      </div>
      
      <div className="event-details">
        <div className="detail-item">
          <span className="detail-label">Date</span>
          <span className="detail-value">{date}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Price</span>
          <span className="detail-value">{price} ETH</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Availability</span>
          <span className="detail-value">{sold} / {maxSupply}</span>
        </div>
        {category && (
          <div className="detail-item">
            <span className="detail-label">Category</span>
            <span className="detail-value">{category}</span>
          </div>
        )}
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>
      
      <div className="event-footer">
        <button 
          className="buy-btn"
          onClick={(e) => {
            e.stopPropagation();
            onBuyTicket();
          }}
          disabled={isExpired || sold >= maxSupply}
        >
          {isExpired ? "Event Ended" : sold >= maxSupply ? "Sold Out" : "Buy Ticket"}
        </button>
      </div>
    </div>
  );
}