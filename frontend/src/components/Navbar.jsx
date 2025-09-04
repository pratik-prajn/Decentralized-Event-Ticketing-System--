import React from "react";
import "./Navbar.css";

export default function Navbar({ activeTab, onChange, totalMyTickets = 0, totalMarketListings = 0 }) {
  const items = [
    { key: "events", label: "Events", icon: EventsIcon },
    { key: "myTickets", label: "My Tickets", icon: TicketsIcon, badge: totalMyTickets },
    { key: "marketplace", label: "Marketplace", icon: MarketplaceIcon, badge: totalMarketListings },
    { key: "createEvent", label: "Create Event", icon: CreateIcon },
    { key: "myOrganizedEvents", label: "My Organized", icon: OrganizedIcon },
  ];

  return (
    <nav className="pro-navbar">
      <ul className="pro-nav-list">
        {items.map(({ key, label, icon: Icon, badge }) => (
          <li
            key={key}
            className={`pro-nav-item ${activeTab === key ? "active" : ""}`}
            onClick={() => onChange && onChange(key)}
          >
            <span className="pro-nav-icon"><Icon /></span>
            <span className="pro-nav-label">{label}</span>
            {badge > 0 && <span className="pro-nav-badge">{badge}</span>}
          </li>
        ))}
      </ul>
    </nav>
  );
}

function EventsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="4"></rect>
      <path d="M16 2v4M8 2v4M3 10h18"></path>
    </svg>
  );
}

function TicketsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9a3 3 0 0 0 0 6v4a2 2 0 0 0 2 2h14l2-2V9l-2-2H5a2 2 0 0 0-2 2Z"></path>
      <path d="M13 5v14"></path>
    </svg>
  );
}

function MarketplaceIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-2-2H5A2 2 0 0 0 3 8v8"></path>
      <path d="M7 22h10a2 2 0 0 0 2-2v-4H5v4a2 2 0 0 0 2 2Z"></path>
      <path d="M7 10h10"></path>
    </svg>
  );
}

function CreateIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14"></path>
    </svg>
  );
}

function OrganizedIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 21v-8h8v8"></path>
      <path d="M12 3l9 7-9 7-9-7 9-7Z"></path>
    </svg>
  );
}
