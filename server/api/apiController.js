const Setting = require('../models/setting');
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
        
        const blockchains = await Setting.findOne({ key: "blockchains" });
        if (typeof blockchains?.value?.some !== "function" || !blockchains.value.some(b => b.chainId === parseInt(chainId))) {
            return new ApiResult(true, "Invalid chain ID");
        }

        const tokenClaimedEvents = await TokenClaimedEvent.find({ claimerAddress: walletAddress, sourceChainId: chainId });

        const resultObj = {};
        tokenClaimedEvents.forEach(ev => resultObj[ev.wrappedTokenAddress] = true);

        return new ApiResult(false, Object.getOwnPropertyNames(resultObj));
    }

    async getBridgedTokens(chainId) {
        if (!chainId) {
            return new ApiResult(true, "Missing chain ID");
        }
        
        const blockchains = await Setting.findOne({ key: "blockchains" });
        if (typeof blockchains?.value?.some !== "function" || !blockchains.value.some(b => b.chainId === parseInt(chainId))) {
            return new ApiResult(true, "Invalid chain ID");
        }

        const tokenClaimedEvents = await TokenClaimedEvent.find({sourceChainId: chainId });

        const resultObj = {};
        tokenClaimedEvents.forEach(ev => resultObj[ev.wrappedTokenAddress] = true);

        return new ApiResult(false, Object.getOwnPropertyNames(resultObj));
    }
}

module.exports = ApiController;