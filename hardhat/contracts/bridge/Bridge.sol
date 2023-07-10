//SPDX-License-Identifier: MIT
pragma solidity 0.8.9;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../token/WrappedToken.sol";
import "../interface/IWrappedTokenFactory.sol";

contract Bridge is Ownable {
    address internal constant NULL_ADDRESS = address(0);
    uint8 internal feePercentage;
    IWrappedTokenFactory public wrappedTokenFactory;

    mapping(uint => mapping(address => string)) public tokenNameByOriginTokenByChain;
    mapping(uint => mapping(address => string)) public tokenSymbolByOriginTokenByChain;

    //collected fee tokenAddress -> amount
    mapping(address => uint) public feeBalances; 

    // chainId => SideToken Address => OriginToken Address
    mapping(uint => mapping(address => address))public wrappedTokenByOriginTokenByChain; 

    // chainId => OriginToken Address => SideToken Address
    mapping(uint => mapping(address => address))public originTokenByWrappedTokenByChain; 
    
    //tokens that can be claimed user -> chainId -> address of origin token -> amount
    mapping(address => mapping(uint => mapping(address => uint))) public claimableTokens; 

    //tokens that can been released by user -> address of origin token -> amount
    mapping(address => mapping(address => uint)) public releasableTokens; 

    event TokenLocked(
        address lockerAddress,
        address originTokenAddress,
        uint amount,
        uint targetChainId,
        address claimerAddress
    );
    event TokenClaimed(
        address claimerAddress,
        address wrappedTokenAddress,
        uint amount
    );
    event TokenBurned(
        address burnerAddress,
        address originTokenAddress,
        uint amount,
        uint targetChainId,
        address releaserAddress
    );
    event TokenReleased(
        address releaserAddress,
        address originTokenAddress,
        uint amount
    );

    modifier positiveAmount(uint amount) {
        require(amount > 0, "Bridge: Amount must be greater than 0");
        _;
    }
    modifier positiveChainId(uint chainId) {
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

    function lockToken(
        address token,
        uint amount,
        uint targetChainId,
        address targetAddress
    )
        external
        notNullTokenAddress(token)
        positiveAmount(amount)
        positiveChainId(targetChainId)
        notNullTargetAddress(targetAddress)
    {
        // Calculate the fee amount
        uint feeAmount = (amount * feePercentage) / 100;

        // Calculate the net amount to be bridged (deducting the fee)
        uint netAmount = amount - feeAmount;

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
        uint sourceChainId,
        address token
    ) external notNullTokenAddress(token) positiveChainId(sourceChainId) {
        uint amount = claimableTokens[msg.sender][sourceChainId][token];

        require(amount > 0, "Bridge: no claimable token");

        if (!_tokenKnown(sourceChainId, token)) {
            address wrappedTokenAddress = _createWrappedToken(
                sourceChainId,
                token
            );
            _mapTokens(sourceChainId, token, wrappedTokenAddress);
        }

        address wrappedToken = wrappedTokenByOriginTokenByChain[sourceChainId][
            token
        ];

        WrappedToken(wrappedToken).mint(msg.sender, amount);

        claimableTokens[msg.sender][sourceChainId][token] = 0;

        emit TokenClaimed(msg.sender, wrappedToken, amount);
    }

    function burnToken(
        address wrappedToken,
        uint amount,
        uint targetChainId,
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

    function releaseToken(address originToken) external notNullTokenAddress(originToken) {
        uint amount = releasableTokens[msg.sender][originToken];

        require(amount > 0, "Bridge: no releasable token");

        IERC20(originToken).transfer(msg.sender, amount);

        releasableTokens[msg.sender][originToken] = 0;

        emit TokenReleased(msg.sender, originToken, amount);
    }

    function setFeePercentage(uint8 _feePercentage) external onlyOwner {
        feePercentage = _feePercentage;
    }

    function setWrappedTokenFactory(address _wrappedTokenFactory) external onlyOwner {
        wrappedTokenFactory = IWrappedTokenFactory(_wrappedTokenFactory);
    }

    function addClaimableToken(address claimer, uint sourceChainId, address token, uint amount) public onlyOwner {
        claimableTokens[claimer][sourceChainId][token] += amount;
    }

    function addReleasableToken(address releaser, address token, uint amount) public onlyOwner {
        releasableTokens[releaser][token] += amount;
    }

    function addTokenSymbol(uint chainId, address token, string calldata tokenSymbol) public onlyOwner {
        tokenSymbolByOriginTokenByChain[chainId][token] = tokenSymbol;
    }

    function addTokenName(uint chainId, address token, string calldata tokenName) public onlyOwner {
        tokenSymbolByOriginTokenByChain[chainId][token] = tokenName;
    }

    function withdrawTokenFee(address token, uint amount, address recipient) external onlyOwner {
        IERC20(token).transfer(recipient, amount);
    }

    function getClaimableTokens() external returns {
        retu
    }

    function _createWrappedToken(uint chainId, address originTokenAddress) internal returns (address) {
        string memory tokenName = tokenNameByOriginTokenByChain[chainId][originTokenAddress];
        string memory tokenSymbol = tokenSymbolByOriginTokenByChain[chainId][originTokenAddress];

        address wrappedTokenAddress = wrappedTokenFactory.createWrappedToken(
            tokenName,
            tokenSymbol
        );

        return wrappedTokenAddress;
    }

    function _mapTokens(uint sourceChainId, address originToken, address wrappedToken) internal {
        wrappedTokenByOriginTokenByChain[sourceChainId][originToken] = wrappedToken;
        originTokenByWrappedTokenByChain[sourceChainId][wrappedToken] = originToken;
    }

    function _tokenKnown(uint sourceChainId, address originTokenAddress) internal view returns (bool) {
        return (wrappedTokenByOriginTokenByChain[sourceChainId][
            originTokenAddress
        ] != NULL_ADDRESS);
    }
}
