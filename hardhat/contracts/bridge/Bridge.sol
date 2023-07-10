//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../token/WrappedToken.sol";
import "../interface/IWrappedTokenFactory.sol";

contract Bridge is Ownable {
    address internal constant NULL_ADDRESS = address(0);
    uint8 internal feePercentage;
    IWrappedTokenFactory public wrappedTokenFactory;

    mapping(address => uint256) public feeBalances; //collected fee tokenAddress -> amount
    mapping(uint256 => mapping(address => address))
        public wrappedTokenByOriginTokenByChain; // chainId => SideToken Address => OriginToken Address
    mapping(uint256 => mapping(address => address))
        public originTokenByWrappedTokenByChain; // chainId => OriginToken Address => SideToken Address
    mapping(address => mapping(uint256 => mapping(address => uint256)))
        public claimableTokens; //tokens that can be claimed user -> chainId -> address of original token -> amount
    mapping(address => mapping(address => uint256)) public releasableTokens; //tokens that can been released by user -> address of origin token -> amount

    event TokenLocked(
        address lockerAddress,
        address originTokenAddress,
        uint256 amount,
        uint256 targetChainId,
        address claimerAddress
    );
    event TokenClaimed(
        address claimerAddress,
        address wrappedTokenAddress,
        uint256 amount
    );
    event TokenBurned(
        address burnerAddress,
        address originTokenAddress,
        uint256 amount,
        uint256 targetChainId,
        address releaserAddress
    );
    event TokenReleased(
        address releaserAddress,
        address originTokenAddress,
        uint256 amount
    );

    modifier positiveAmount(uint256 amount) {
        require(amount > 0, "Bridge: Amount must be greater than 0");
        _;
    }
    modifier positiveChainId(uint256 chainId) {
        require(chainId > 0, "Bridge: chainId has to be greater than 0");
        _;
    }
    modifier notNullTokenAddress(address token) {
        require(
            token != NULL_ADDRESS,
            "Bridge: Token address cannot be the null address"
        );
        _;
    }
    modifier notNullTargetAddress(address targetAddress) {
        require(
            targetAddress != NULL_ADDRESS,
            "Bridge: Target address cannot be the null address"
        );
        _;
    }

    constructor(address _wrappedTokenFactory) {
        wrappedTokenFactory = IWrappedTokenFactory(_wrappedTokenFactory);
    }

    function setFeePercentage(uint8 _feePercentage) external onlyOwner {
        feePercentage = _feePercentage;
    }

    function lockToken(
        address token,
        uint256 amount,
        uint256 targetChainId,
        address targetAddress
    )
        external
        notNullTokenAddress(token)
        positiveAmount(amount)
        positiveChainId(targetChainId)
        notNullTargetAddress(targetAddress)
    {
        // Calculate the fee amount
        uint256 feeAmount = (amount * feePercentage) / 100;

        // Calculate the net amount to be bridged (deducting the fee)
        uint256 netAmount = amount - feeAmount;

        // Transfer the token amount from the user to the bridge
        IERC20(token).transferFrom(msg.sender, address(this), amount);

        emit TokenLocked(
            msg.sender,
            token,
            netAmount,
            targetChainId,
            targetAddress
        );
    }

    function claimToken(
        address token,
        uint256 sourceChainId
    ) external notNullTokenAddress(token) positiveChainId(sourceChainId) {
        uint256 amount = claimableTokens[msg.sender][sourceChainId][token];

        require(amount > 0, "Bridge: no claimable token");

        if (!_tokenKnown(sourceChainId, token)) {
            address wrappedTokenAddress = _createWrappedToken(token);
            _mapTokens(sourceChainId, token, wrappedTokenAddress);
        }
        

        address wrappedToken = wrappedTokenByOriginTokenByChain[sourceChainId][token];

        WrappedToken(wrappedToken).mint(msg.sender, amount);

        claimableTokens[msg.sender][sourceChainId][token] = 0;

        emit TokenClaimed(msg.sender, wrappedToken, amount);
    }

    function burnToken(
        address wrappedToken,
        uint256 amount,
        uint256 targetChainId,
        address targetAddress
    )
        external
        notNullTokenAddress(wrappedToken)
        positiveAmount(amount)
        positiveChainId(targetChainId)
        notNullTargetAddress(targetAddress)
    {
        WrappedToken(wrappedToken).burn(msg.sender, amount);

        emit TokenBurned(
            msg.sender,
            originTokenByWrappedTokenByChain[targetChainId][wrappedToken],
            amount,
            targetChainId,
            targetAddress
        );
    }

    function releaseToken(
        address originalToken
    ) external notNullTokenAddress(originalToken) {
        uint256 amount = releasableTokens[msg.sender][originalToken];
    
        require(amount > 0, "Bridge: no releasable token");

        IERC20(originalToken).transfer(msg.sender, amount);

        releasableTokens[msg.sender][originalToken] = 0;

        emit TokenReleased(msg.sender, originalToken, amount);
    }

    function addClaimableToken(
        address claimer,
        uint256 sourceChainId,
        address token,
        uint256 amount
    ) public onlyOwner {
        claimableTokens[claimer][sourceChainId][token] += amount;
    }

    function addReleasableToken(
        address releaser,
        address token,
        uint256 amount
    ) public onlyOwner {
        releasableTokens[releaser][token] += amount;
    }

    function withdrawTokenFee(
        address token,
        uint256 amount,
        address recipient
    ) external onlyOwner {
        IERC20(token).transfer(recipient, amount);
    }

    function _createWrappedToken(address originalTokenAddress) internal returns (address) {
        ERC20 originalToken = ERC20(originalTokenAddress);
        string memory tokenName = originalToken.name();
        string memory tokenSymbol = originalToken.symbol();

        address wrappedTokenAddress = wrappedTokenFactory.createWrappedToken(tokenName,tokenSymbol);

        return wrappedTokenAddress;
    }

    function _mapTokens(
        uint256 sourceChainId,
        address originalToken,
        address wrappedToken
    ) internal {
        wrappedTokenByOriginTokenByChain[sourceChainId][originalToken] = wrappedToken;
        originTokenByWrappedTokenByChain[sourceChainId][wrappedToken] = originalToken;
    }

    function _tokenKnown(uint256 sourceChainId, address originalTokenAddress) internal view returns (bool) {
        return (wrappedTokenByOriginTokenByChain[sourceChainId][originalTokenAddress] != NULL_ADDRESS);
    }
}
