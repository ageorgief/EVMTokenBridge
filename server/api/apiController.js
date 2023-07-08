const TokenClaimedEvent = require('../models/tokenClaimedEvent');
const ApiResult = require('./apiResult');

class ApiController {
    async getBridgedTokensByWalletAddress(walletAddress, chainId) {
        if (!walletAddress) {
            return new ApiResult(true, "Missing wallet address");
        }

        if (!chainId) {
            return new ApiResult(true, "Missing chain ID");
        }

        const tokenClaimedEvents = await TokenClaimedEvent.find({ claimerAddress: walletAddress, sourceChainId: chainId });

        const resultObj = {};
        tokenClaimedEvents.forEach(ev => resultObj[ev.wrappedTokenAddress] = true);

        return new ApiResult(false, Object.getOwnPropertyNames(resultObj));
    }
}

module.exports = ApiController;