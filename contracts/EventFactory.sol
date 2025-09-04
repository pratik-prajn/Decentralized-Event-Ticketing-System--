// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Event.sol";

contract EventFactory {
    address[] public allEvents;

    event EventCreated(address indexed eventAddress, address indexed organizer);

    function createEvent(
        string calldata name,
        uint256 date,
        uint256 price,
        uint256 supply,
        string calldata metadataURI
    ) external {
        Event e = new Event(name, date, price, supply, msg.sender, metadataURI);
        allEvents.push(address(e));
        emit EventCreated(address(e), msg.sender);
    }

    function getAllEvents() external view returns (address[] memory) {
        return allEvents;
    }

    function getMyEvents() external view returns (address[] memory) {
        uint256 count;
        for (uint i = 0; i < allEvents.length; i++) {
            if (Event(allEvents[i]).organizer() == msg.sender) {
                count++;
            }
        }
        address[] memory result = new address[](count);
        uint256 idx;
        for (uint i = 0; i < allEvents.length; i++) {
            if (Event(allEvents[i]).organizer() == msg.sender) {
                result[idx++] = allEvents[i];
            }
        }
        return result;
    }
}