// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IWrappedTokenFactory {
    event WrappedTokenCreated(address indexed wrappedToken, string symbol);
    
    function createWrappedToken(string calldata name, string calldata symbol) external returns(address);
}