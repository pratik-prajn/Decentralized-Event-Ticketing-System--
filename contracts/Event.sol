// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Event is ERC721, ReentrancyGuard {
    string public eventName;
    uint256 public eventDate;
    uint256 public ticketPrice;
    uint256 public maxSupply;
    uint256 public sold;
    address public organizer;
    
    // Store IPFS URI for event metadata (containing both description and image)
    string public eventMetadataURI;

    uint256 private nextTicketId;
    uint256[] private soldTickets;

    mapping(address => uint256[]) private ownerTokens;
    mapping(uint256 => uint256) private ticketIndexInOwner;

    struct Listing {
        address seller;
        uint256 price;
        uint256 expiresAt;
    }

    mapping(uint256 => Listing) public listings;

    event TicketPurchased(address indexed buyer, uint256 indexed ticketId);
    event TicketTransferred(address indexed from, address indexed to, uint256 indexed ticketId);
    event MetadataUpdated(address indexed organizer, string metadataURI);
    event TicketListed(address indexed seller, uint256 indexed ticketId, uint256 price, uint256 expiresAt);
    event TicketSale(address indexed buyer, address indexed seller, uint256 indexed ticketId, uint256 price);
    event ListingCancelled(address indexed seller, uint256 indexed ticketId);

    modifier onlyOrganizer() {
        require(msg.sender == organizer, "Not organizer");
        _;
    }

    constructor(
        string memory _name,
        uint256 _date,
        uint256 _price,
        uint256 _supply,
        address _organizer,
        string memory _metadata
    ) ERC721("EventTicket", "ETIX") {
        eventName = _name;
        eventDate = _date;
        ticketPrice = _price;
        maxSupply = _supply;
        organizer = _organizer;
        eventMetadataURI = _metadata;
    }

    function setMetadataURI(string memory _metadataURI) external onlyOrganizer {
        eventMetadataURI = _metadataURI;
        emit MetadataUpdated(msg.sender, _metadataURI);
    }

    function buyTicket() external payable nonReentrant {
        require(block.timestamp <= eventDate, "Event passed");
        require(sold < maxSupply, "Sold out");
        require(msg.value == ticketPrice, "Incorrect ETH sent");

        uint256 tid = ++nextTicketId;
        sold += 1;
        _safeMint(msg.sender, tid);

        soldTickets.push(tid);
        ticketIndexInOwner[tid] = ownerTokens[msg.sender].length;
        ownerTokens[msg.sender].push(tid);

        payable(organizer).transfer(msg.value);

        emit TicketPurchased(msg.sender, tid);
    }

    function transferTicket(address to, uint256 ticketId) external nonReentrant {
        require(ownerOf(ticketId) == msg.sender, "Not owner");
        _safeTransfer(msg.sender, to, ticketId, "");

        _removeTokenFrom(msg.sender, ticketId);
        ticketIndexInOwner[ticketId] = ownerTokens[to].length;
        ownerTokens[to].push(ticketId);

        emit TicketTransferred(msg.sender, to, ticketId);
    }

    function getMyTickets() external view returns (uint256[] memory) {
        return ownerTokens[msg.sender];
    }

    function getSoldTickets() external view onlyOrganizer returns (uint256[] memory) {
        return soldTickets;
    }

    function listTicket(uint256 tokenId, uint256 price, uint256 expiresAt) external {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        require(price > 0, "Price must be > 0");
        require(expiresAt > block.timestamp, "Must be in future");
        require(getApproved(tokenId) == address(this), "Approval required");

        listings[tokenId] = Listing({
            seller: msg.sender,
            price: price,
            expiresAt: expiresAt
        });

        emit TicketListed(msg.sender, tokenId, price, expiresAt);
    }

    function cancelListing(uint256 tokenId) external {
        require(listings[tokenId].seller == msg.sender, "Not seller");

        delete listings[tokenId];
        approve(address(0), tokenId);  // revoke permission

        emit ListingCancelled(msg.sender, tokenId);
    }

    function buyListedTicket(uint256 tokenId) external payable nonReentrant {
        Listing memory listing = listings[tokenId];

        require(listing.seller != address(0), "Not listed");
        require(msg.value >= listing.price, "Too little ETH");
        require(block.timestamp <= listing.expiresAt, "Listing expired");

        delete listings[tokenId];
        payable(listing.seller).transfer(msg.value);

        _transfer(listing.seller, msg.sender, tokenId);
        _removeTokenFrom(listing.seller, tokenId);
        ticketIndexInOwner[tokenId] = ownerTokens[msg.sender].length;
        ownerTokens[msg.sender].push(tokenId);

        emit TicketSale(msg.sender, listing.seller, tokenId, listing.price);
    }

    function getListing(uint256 tokenId) external view returns (Listing memory) {
        return listings[tokenId];
    }

    function _removeTokenFrom(address from, uint256 ticketId) internal {
        uint256 idx = ticketIndexInOwner[ticketId];
        uint256 lastId = ownerTokens[from][ownerTokens[from].length - 1];

        ownerTokens[from][idx] = lastId;
        ticketIndexInOwner[lastId] = idx;

        ownerTokens[from].pop();
    }
}