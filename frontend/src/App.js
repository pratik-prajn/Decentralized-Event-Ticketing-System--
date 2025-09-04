import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import ConnectWalletButton from "./components/ConnectWalletButton";
import Navbar from "./components/Navbar";
import Calendar from "./components/Calendar";
import CreateEventForm from "./components/CreateEventForm";
import EventCard from "./components/EventCard";
import ExpandedEventView from "./components/ExpandedEventView";
import ExpandedTicketView from "./components/ExpandedTicketView";
import MarketplaceSection from "./components/MarketplaceSection";
import MyTicketsSection from "./components/MyTicketsSection";
import MyOrganizedEvents from "./components/MyOrganizedEvents";
import BlockchainSetupInfo from "./components/BlockchainSetupInfo";
import FactoryJSON from "./abis/EventFactory.json";
import EventJSON from "./abis/Event.json";
import {
  buyTicket,
  transferTicket,
  listTicket,
  cancelListing,
  buyListedTicket,
  createEvent
} from "./utils/TicketUtils";
import "./App.css";

function App() {
  const [userAddress, setUserAddress] = useState(null);
  const [signer, setSigner] = useState(null);
  const [factory, setFactory] = useState(null);
  const [eventDetails, setEventDetails] = useState([]);
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState("info"); // info, success, error
  const [activeTab, setActiveTab] = useState("events"); // events, myTickets, marketplace, createEvent
  const [expandedEvent, setExpandedEvent] = useState(null);
  const [expandedTicket, setExpandedTicket] = useState(null);
  const [previousTab, setPreviousTab] = useState(null);
  const [eventMetadataCache, setEventMetadataCache] = useState({});
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSetupModal, setShowSetupModal] = useState(false);

  const handleDisconnect = () => {
    setActiveTab("events");
    setExpandedEvent(null);
    setExpandedTicket(null);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    // Reset category to "All" when searching to show all matching results
    if (e.target.value.trim() !== "") {
      setActiveCategory("All");
    }
  };



  // Fetch IPFS metadata
  const fetchIPFSMetadata = async (uri) => {
    // If we already have this metadata cached, return it
    if (!uri || uri.trim() === "") {
      return {
        description: "",
        bannerImage: null,
        cardImage: null,
        category: "Other"
      };
    }
    if (eventMetadataCache[uri]) {
      return eventMetadataCache[uri];
    }

    try {
      // Convert IPFS URI to HTTP gateway URL
      const url = uri.startsWith('ipfs://') ? uri.replace('ipfs://', 'https://ipfs.io/ipfs/') : uri;
      const response = await fetch(url);
      const metadata = await response.json();

      // Cache the result
      setEventMetadataCache(prev => ({ ...prev, [uri]: metadata }));

      return metadata;
    } catch (error) {
      console.error("Error fetching metadata:", error);
      return {
        description: "Failed to fetch description",
        bannerImage: null,
        cardImage: null,
        category: "Other"
      };
    }
  };
  const isEventExpired = (eventDate) => {
    const now = Math.floor(Date.now() / 1000); // Current time in seconds
    return eventDate < now;
  };
  // Process image URLs
  const processImageURL = (imageURL) => {
    if (!imageURL) return null;
    if (imageURL.startsWith("ipfs://")) {
      return imageURL.replace("ipfs://", "https://ipfs.io/ipfs/");
    }
    return imageURL;
  };

  const getUniqueCategories = () => {
    const categories = eventDetails
      .filter(event => !isEventExpired(event.rawDate))
      .map(event => event.category);
    const uniqueCategories = [...new Set(categories)];
    return ["All", ...uniqueCategories.sort()];
  };

  const filteredEvents = eventDetails
    .filter(event => !isEventExpired(event.rawDate)) // Only upcoming events
    .filter(event => activeCategory === "All" || event.category === activeCategory)
    .filter(event =>
      searchQuery.trim() === "" ||
      event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // Get all expired events
  const expiredEvents = eventDetails.filter(event => isEventExpired(event.rawDate));


  const handleCategoryChange = (category) => {
    setActiveCategory(category);
  };





  // Load all event data
  const loadEventDetails = useCallback(async () => {
    if (!factory || !signer) return;
    try {
      setStatus("Loading events...");
      setStatusType("info");
      const addrs = await factory.getAllEvents();
      const details = await Promise.all(
        addrs.map(async (addr) => {
          const ev = new ethers.Contract(addr, EventJSON.abi, signer);
          const [
            name,
            date,
            price,
            maxSupply,
            sold,
            myTicketsRaw,
            metadataURI,
          ] = await Promise.all([
            ev.eventName(),
            ev.eventDate(),
            ev.ticketPrice(),
            ev.maxSupply(),
            ev.sold(),
            ev.getMyTickets(),
            ev.eventMetadataURI(),
          ]);

          // Fetch metadata from IPFS (tolerates empty URI)
          const metadata = await fetchIPFSMetadata(metadataURI || "");

          // Process image URLs
          const bannerImageURL = processImageURL(metadata.bannerImage);
          const cardImageURL = processImageURL(metadata.cardImage);

          const myTickets = myTicketsRaw.map((t) => Number(t));
          const myListings = await Promise.all(
            myTickets.map(async (tid) => {
              const listing = await ev.getListing(tid);
              return {
                ticketId: tid,
                seller: listing.seller,
                price: ethers.formatEther(listing.price),
                expiresAt: new Date(Number(listing.expiresAt) * 1000).toLocaleString(),
                rawExpiresAt: Number(listing.expiresAt)
              };
            })
          );
          const marketplaceListings = [];
          for (let tid = 1; tid <= Number(sold); tid++) {
            const listing = await ev.getListing(tid);
            if (listing.seller && listing.seller !== ethers.ZeroAddress) {
              marketplaceListings.push({
                ticketId: tid,
                seller: listing.seller,
                price: ethers.formatEther(listing.price),
                expiresAt: new Date(Number(listing.expiresAt) * 1000).toLocaleString(),
                rawExpiresAt: Number(listing.expiresAt)
              });
            }
          }
          return {
            address: addr,
            name,
            date: new Date(Number(date) * 1000).toLocaleString(),
            rawDate: Number(date),
            price: ethers.formatEther(price),
            maxSupply: Number(maxSupply),
            sold: Number(sold),
            myTickets,
            myListings,
            marketplaceListings,
            description: metadata.description || "",
            bannerImage: bannerImageURL,
            cardImage: cardImageURL,
            category: metadata.category || "Other",
            metadataURI
          };
        })
      );
      setEventDetails(details);
      setStatus("");
    } catch (err) {
      console.error("Error loading event details:", err);
      setStatus("Failed to load events: " + err.message);
      setStatusType("error");
      
      // Show setup modal for common blockchain connection errors
      if (err.message.includes("could not decode result data") || 
          err.message.includes("network does not support ENS") ||
          err.message.includes("missing provider") ||
          err.message.includes("missing revert data") ||
          err.message.includes("network error")) {
        setShowSetupModal(true);
      }
    }
  }, [factory, signer, eventMetadataCache]);

  useEffect(() => {
    if (factory && signer) {
      loadEventDetails();
    }
  }, [factory, signer, loadEventDetails]);

  // Handle expanding an event
  const handleExpandEvent = (eventAddress) => {
    setPreviousTab(activeTab);
    setExpandedEvent(eventDetails.find(e => e.address === eventAddress));
    // Use history API to enable back button functionality
    window.history.pushState({ type: 'event', id: eventAddress }, '', `#event/${eventAddress}`);
  };

  // Handle expanding a ticket
  const handleExpandTicket = (eventAddress, ticketId) => {
    setPreviousTab(activeTab);
    const event = eventDetails.find(e => e.address === eventAddress);
    setExpandedTicket({ event, ticketId });
    // Use history API to enable back button functionality
    window.history.pushState({ type: 'ticket', eventId: eventAddress, ticketId }, '', `#ticket/${eventAddress}/${ticketId}`);
  };

  // Handle back button
  const handleBack = () => {
    if (expandedTicket) {
      setExpandedTicket(null);
      setExpandedEvent(expandedTicket.event);
      window.history.pushState({ type: 'event', id: expandedTicket.event.address }, '', `#event/${expandedTicket.event.address}`);
    } else if (expandedEvent) {
      setExpandedEvent(null);
      setActiveTab(previousTab || "events");
      window.history.pushState({}, '', '#');
    }
  };

  // Handle tab changes - modified to also close expanded views
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Close expanded views when switching tabs
    setExpandedEvent(null);
    setExpandedTicket(null);
    // Update browser history
    window.history.pushState({}, '', '#');
  };

  // In App.js - Add this useEffect
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        // MetaMask locked or user disconnected all accounts
        setUserAddress(null);
        setSigner(null);
        setFactory(null);
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, []);

  // Listen for popstate (browser back button)
  useEffect(() => {
    const handlePopState = (event) => {
      if (!event.state) {
        setExpandedEvent(null);
        setExpandedTicket(null);
        return;
      }

      if (event.state.type === 'event') {
        setExpandedTicket(null);
        setExpandedEvent(eventDetails.find(e => e.address === event.state.id));
      } else if (event.state.type === 'ticket') {
        const event = eventDetails.find(e => e.address === event.state.eventId);
        setExpandedTicket({ event, ticketId: event.state.ticketId });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [eventDetails]);

  // Callbacks to pass to the utility functions
  const statusCallbacks = {
    onStatus: (message, type) => {
      setStatus(message);
      setStatusType(type);
    },
    onSuccess: loadEventDetails
  };

  // Create wrappers for the utility functions to pass required parameters
  const handleCreateEvent = (eventData) => {
    createEvent(factory, eventData, statusCallbacks);
  };

  const handleBuyTicket = (addr, price) => {
    buyTicket(signer, addr, price, statusCallbacks);
  };

  const handleTransferTicket = (addr, tid, to) => {
    transferTicket(signer, addr, tid, to, statusCallbacks);
  };

  const handleListTicket = (addr, tid, price, expires) => {
    listTicket(signer, addr, tid, price, expires, statusCallbacks);
  };

  const handleCancelListing = (addr, tid) => {
    cancelListing(signer, addr, tid, statusCallbacks);
  };

  const handleBuyListedTicket = (addr, tid, price) => {
    buyListedTicket(signer, addr, tid, price, statusCallbacks);
  };

  // Count all my tickets across all events
  const totalMyTickets = eventDetails.reduce((sum, event) => sum + event.myTickets.length, 0);

  // Count all marketplace listings
  const totalMarketListings = eventDetails.reduce(
    (sum, event) => sum + event.marketplaceListings.length, 0
  );

  // Render the main content based on expanded state
  const renderMainContent = () => {
    if (expandedTicket) {
      return (
        <ExpandedTicketView
          event={expandedTicket.event}
          ticketId={expandedTicket.ticketId}
          onBack={handleBack}
          onTransfer={(to) => handleTransferTicket(expandedTicket.event.address, expandedTicket.ticketId, to)}
          onList={(price, expires) => handleListTicket(expandedTicket.event.address, expandedTicket.ticketId, price, expires)}
          onCancel={() => handleCancelListing(expandedTicket.event.address, expandedTicket.ticketId)}
          currentAddress={userAddress}
          signer={signer}
        />
      );
    }

    if (expandedEvent) {
      return (
        <ExpandedEventView
          event={expandedEvent}
          onBack={handleBack}
          onBuyTicket={() => handleBuyTicket(expandedEvent.address, expandedEvent.price)}
          onExpandTicket={(ticketId) => handleExpandTicket(expandedEvent.address, ticketId)}
          onTransfer={handleTransferTicket}
          onList={handleListTicket}
          onCancel={handleCancelListing}
          currentAddress={userAddress}
          signer={signer}
        />
      );
    }

    // Regular tab content
    switch (activeTab) {
      case "events":
        return (
          <div className="events-section">
            <Calendar
              events={(eventDetails || [])
                .filter((e) => !isEventExpired(e.rawDate))
                .map((e) => ({
                  id: e.address,
                  title: e.name || "Event",
                  date: (() => {
                    const n = Number(e.rawDate);
                    return n > 2000000000 ? n : n * 1000;
                  })(),
                  category: e.category || "Other",
                  address: e.address,
                }))}
              onSelectEvent={(addr) => addr && handleExpandEvent(addr)}
            />
            <h2 className="section-title">Upcoming Events</h2>

            {/* Category Filter Buttons */}
            <div className="category-filter">
              {getUniqueCategories().map(category => (
                <button
                  key={category}
                  className={`category-btn ${activeCategory === category ? 'active' : ''}`}
                  onClick={() => handleCategoryChange(category)}
                >
                  {category}
                </button>
              ))}
            </div>
            <div className="search-bar-container">
              <input
                type="text"
                className="search-input"
                placeholder="Search events by name or category..."
                value={searchQuery}
                onChange={handleSearch}
              />
              {searchQuery && (
                <button
                  className="search-clear-button"
                  onClick={() => setSearchQuery("")}
                >
                  ×
                </button>
              )}
            </div>

            <div className="events-grid">
              {filteredEvents.length > 0 ? (
                filteredEvents.map((event) => (
                  <EventCard
                    key={event.address}
                    event={event}
                    currentAddress={userAddress}
                    onBuyTicket={() => handleBuyTicket(event.address, event.price)}
                    onExpand={() => handleExpandEvent(event.address)}
                    signer={signer}
                  />
                ))
              ) : (
                <div className="empty-events-message">
                  No upcoming events found for this category.
                </div>
              )}
            </div>
          </div>
        );
      case "expiredEvents":
        return (
          <div className="events-section">
            <h2 className="section-title">Past Events</h2>

            <div className="events-grid">
              {expiredEvents.length > 0 ? (
                expiredEvents.map((event) => (
                  <EventCard
                    key={event.address}
                    event={event}
                    currentAddress={userAddress}
                    expired={true}
                    onExpand={() => handleExpandEvent(event.address)}
                    signer={signer}
                  />
                ))
              ) : (
                <div className="empty-events-message">
                  No past events found.
                </div>
              )}
            </div>
          </div>
        );
      case "myTickets":
        return (
          <MyTicketsSection
            events={eventDetails}
            currentAddress={userAddress}
            onTransfer={handleTransferTicket}
            onList={handleListTicket}
            onCancel={handleCancelListing}
            onExpandTicket={handleExpandTicket}
            signer={signer}
          />
        );
      case "marketplace":
        return (
          <MarketplaceSection
            events={eventDetails}
            currentAddress={userAddress}
            onBuy={handleBuyListedTicket}
            onExpandEvent={handleExpandEvent}
            onExpandTicket={handleExpandTicket}
            signer={signer}
          />
        );
      case "createEvent":
        return <CreateEventForm onCreate={handleCreateEvent} />;
      case "myOrganizedEvents":
        return (
          <MyOrganizedEvents
            signer={signer}
            factory={factory}
            currentAddress={userAddress}
            events={eventDetails}
            onStatusUpdate={(message, type) => {
              setStatus(message);
              setStatusType(type);
            }}
            onExpandEvent={handleExpandEvent}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="app">
      <div className="container">
        <header className="app-header">
          <h1 className="app-title">
            <span className="logo-icon">🎪</span>
            <span>EventHub</span>
            <span className="tagline">Pro</span>
          </h1>
          <div className="header-controls">
            {userAddress && (
              <button
                className="refresh-button"
                onClick={loadEventDetails}
                title="Refresh data"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 4v6h-6"></path>
                  <path d="M1 20v-6h6"></path>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"></path>
                  <path d="M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                </svg>
              </button>
            )}
            <button
              className="help-button"
              onClick={() => setShowSetupModal(true)}
              title="Setup Help"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <point x="12" y="17"></point>
              </svg>
            </button>
            <ConnectWalletButton
              onConnect={() => loadEventDetails()} // Load events after connection
              onDisconnect={handleDisconnect}
              setStatus={setStatus}
              setStatusType={setStatusType}
              setSigner={setSigner}
              setUserAddress={setUserAddress}
              setFactory={setFactory}
              userAddress={userAddress}
              factoryAddress={process.env.REACT_APP_FACTORY_ADDRESS}
              factoryABI={FactoryJSON.abi}
            />
          </div>
        </header>

        {userAddress && (
          <Navbar
            activeTab={activeTab}
            onChange={handleTabChange}
            totalMyTickets={totalMyTickets}
            totalMarketListings={totalMarketListings}
          />
        )}

        {status && (
          <div className={`status-message status-${statusType}`}>
            <span>{status}</span>
          </div>
        )}

        {userAddress ? (
          renderMainContent()
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">�</div>
            <h2 className="empty-state-title">Welcome to EventHub Pro</h2>
            <p className="empty-state-text">
              Connect your wallet to discover, buy, and manage premium event tickets on the blockchain.
            </p>
          </div>
        )}
      </div>
      
      {/* Blockchain Setup Modal */}
      {showSetupModal && (
        <BlockchainSetupInfo
          onClose={() => setShowSetupModal(false)}
        />
      )}
    </div>
  );
}

export default App;