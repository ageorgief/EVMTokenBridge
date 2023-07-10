const Setting = require('../models/setting');
const TokenLockedEvent = require('../models/tokenLockedEvent');
const TokenClaimedEvent = require('../models/tokenClaimedEvent');
const TokenBurnedEvent = require('../models/tokenBurnedEvent');
const TokenReleasedEvent = require('../models/tokenReleasedEvent');
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
    
    async getWaitingToBeClaimedTokens(chainId) {
        if (!chainId) {
            return new ApiResult(true, "Missing chain ID");
        }
        
        const blockchains = await Setting.findOne({ key: "blockchains" });
        if (typeof blockchains?.value?.some !== "function" || !blockchains.value.some(b => b.chainId === parseInt(chainId))) {
            return new ApiResult(true, "Invalid chain ID");
        }

        const tokenLockedEvents = await TokenLockedEvent.find({targetChainId: chainId }).select(["amount", "originTokenAddress"]);
        const tokenClaimedEvents = await TokenClaimedEvent.find({sourceChainId: chainId }).select(["amount", "originTokenAddress"]);

        const resultObj = {};
        tokenLockedEvents.forEach(ev => {
            if(resultObj[ev.originTokenAddress]) {
                resultObj[ev.originTokenAddress] += ev.amount;
            } else {
                resultObj[ev.originTokenAddress] = ev.amount;
            }
        })

        tokenClaimedEvents.forEach(ev => {
            if(resultObj[ev.originTokenAddress]) {
                resultObj[ev.originTokenAddress] -= ev.amount;
                if(resultObj[ev.originTokenAddress] <= 0) {
                    delete resultObj[ev.originTokenAddress];
                }
            } 
        })

        return new ApiResult(false, Object.getOwnPropertyNames(resultObj));
    }

    async getWaitingToBeReleasedTokens(chainId) {
        if (!chainId) {
            return new ApiResult(true, "Missing chain ID");
        }
        
        const blockchains = await Setting.findOne({ key: "blockchains" });
        if (typeof blockchains?.value?.some !== "function" || !blockchains.value.some(b => b.chainId === parseInt(chainId))) {
            return new ApiResult(true, "Invalid chain ID");
        }

        const tokenBurnedEvents = await TokenBurnedEvent.find({targetChainId: chainId }).select(["amount", "originTokenAddress"]);
        const tokenReleasedEvents = await TokenReleasedEvent.find({sourceChainId: chainId }).select(["amount", "originTokenAddress"]);

        const resultObj = {};
        tokenBurnedEvents.forEach(ev => {
            if(resultObj[ev.originTokenAddress]) {
                resultObj[ev.originTokenAddress] += ev.amount;
            } else {
                resultObj[ev.originTokenAddress] = ev.amount;
            }
        })

        tokenReleasedEvents.forEach(ev => {
            if(resultObj[ev.originTokenAddress]) {
                resultObj[ev.originTokenAddress] -= ev.amount;
                if(resultObj[ev.originTokenAddress] <= 0) {
                    delete resultObj[ev.originTokenAddress];
                }
            } 
        })

        return new ApiResult(false, Object.getOwnPropertyNames(resultObj));
    }
}

module.exports = ApiController;