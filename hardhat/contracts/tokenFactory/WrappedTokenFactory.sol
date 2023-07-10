// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../interface/IWrappedTokenFactory.sol";
import "../token/WrappedToken.sol";

contract WrappedTokenFactory is IWrappedTokenFactory, Ownable {
    function createWrappedToken(string calldata _name, string calldata _symbol)
    public onlyOwner override returns(address) {
        string memory name = string(abi.encodePacked("Wrapped", _name));
        string memory symbol = string(abi.encodePacked("W", _symbol));
        
        address wrappedToken = address(new WrappedToken(name, symbol));
        WrappedToken(wrappedToken).transferOwnership(msg.sender);

        emit WrappedTokenCreated(wrappedToken, symbol);
        
        return wrappedToken;
    }
}