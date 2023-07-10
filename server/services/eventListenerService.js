const { ethers } = require("ethers");
const Setting = require("../models/setting");
const TokenLockedEventProcessor = require("./tokenLockedEventProcessor");
const TokenClaimedEventProcessor = require("./tokenClaimedEventProcessor");
const TokenBurnedEventProcessor = require("./tokenBurnedEventProcessor");
const TokenReleasedEventProcessor = require("./tokenReleasedEventProcessor");

const TOKEN_LOCKED = "TokenLocked";
const TOKEN_CLAIMED = "TokenClaimed";
const TOKEN_BURNED = "TokenBurned";
const TOKEN_RELEASED = "TokenReleased";

class EventListenerService {
    constructor() {
        this.blockchainsMapping = {};
        this.tokenLockedEventProcessor = new TokenLockedEventProcessor();
        this.tokenClaimedEventProcessor = new TokenClaimedEventProcessor();
        this.tokenBurnedEventProcessor = new TokenBurnedEventProcessor();
        this.tokenReleasedEventProcessor = new TokenReleasedEventProcessor();
    }

    async start() {
        const settings = await Setting.find();
        const settingsMap = {};
        settings.forEach(setting => settingsMap[setting.key] = setting.value);

        this.initialize(settingsMap);

        for (const chainId in this.blockchainsMapping) {
            const chain = this.blockchainsMapping[chainId];

            this.startListeningForTokenLockedEvents(chain, chainId);
            this.startListeningForTokenClaimedEvents(chain, chainId);
            this.startListeningForTokenBurnedEvents(chain, chainId);
            this.startListeningForTokenReleasedEvents(chain, chainId);

            await this.queryTokenLockedEvents(chain, chainId);
            await this.queryTokenClaimedEvents(chain, chainId);
            await this.queryTokenBurnedEvents(chain, chainId);
            await this.queryTokenReleasedEvents(chain, chainId);

            console.log('Started working on blockchain ' + chainId);
        }
    }

    startListeningForTokenLockedEvents(chain, chainId) {
        chain.bridgeContract.on(TOKEN_LOCKED, async (lockerAddress, originTokenAddress, amount, targetChainId, targetAddress, rawEvent) => {
            const targetBlockchain = this.blockchainsMapping[targetChainId.toString()];
            if (!targetBlockchain) {
                console.log('Unknown blockchain: ', targetChainId);
                return;
            }

            const contract = targetBlockchain.bridgeContract;
            await this.tokenLockedEventProcessor.process(
                lockerAddress,
                originTokenAddress,
                amount,
                targetChainId,
                targetAddress,
                chainId,
                contract,
                chain.erc20Abi,
                chain.provider,
                rawEvent.log.transactionHash);

            if (rawEvent.log.blockNumber > chain.lastProcessedBlock + 1) {
                chain.lastProcessedBlock = rawEvent.log.blockNumber - 1;
                await Setting.updateOne({ key: 'lastProcessedBlock_' + chainId }, { $set: { value: chain.lastProcessedBlock } }, { upsert: true });
            }
        });
    }

    startListeningForTokenClaimedEvents(chain, chainId) {
        chain.bridgeContract.on(TOKEN_CLAIMED, async (claimerAddress, originTokenAddress, wrappedTokenAddress, amount, rawEvent) => {
            await this.tokenClaimedEventProcessor.process(
                claimerAddress,
                originTokenAddress,
                wrappedTokenAddress,
                amount,
                chainId,
                rawEvent.log.transactionHash);

            if (rawEvent.log.blockNumber > chain.lastProcessedBlock + 1) {
                chain.lastProcessedBlock = rawEvent.log.blockNumber - 1;
                await Setting.updateOne({ key: 'lastProcessedBlock_' + chainId }, { $set: { value: chain.lastProcessedBlock } }, { upsert: true });
            }
        });
    }

    startListeningForTokenBurnedEvents(chain, chainId) {
        chain.bridgeContract.on(TOKEN_BURNED, async (burnerAddress, originTokenAddress, amount, targetChainId, releaserAddress, rawEvent) => {
            const targetBlockchain = this.blockchainsMapping[targetChainId.toString()];
            if (!targetBlockchain) {
                console.log('Unknown blockchain: ', targetChainId);
                return;
            }

            const contract = targetBlockchain.bridgeContract;
            await this.tokenBurnedEventProcessor.process(
                burnerAddress,
                originTokenAddress,
                amount,
                chainId,
                targetChainId,
                releaserAddress,
                contract,
                rawEvent.log.transactionHash);

            if (rawEvent.log.blockNumber > chain.lastProcessedBlock + 1) {
                chain.lastProcessedBlock = rawEvent.log.blockNumber - 1;
                await Setting.updateOne({ key: 'lastProcessedBlock_' + chainId }, { $set: { value: chain.lastProcessedBlock } }, { upsert: true });
            }
        });
    }

    startListeningForTokenReleasedEvents(chain, chainId) {
        chain.bridgeContract.on(TOKEN_RELEASED, async (releaserAddress, originTokenAddress, amount, rawEvent) => {
            await this.tokenReleasedEventProcessor.process(
                releaserAddress,
                originTokenAddress,
                amount,
                chainId,
                rawEvent.log.transactionHash);

            if (rawEvent.log.blockNumber > chain.lastProcessedBlock + 1) {
                chain.lastProcessedBlock = rawEvent.log.blockNumber - 1;
                await Setting.updateOne({ key: 'lastProcessedBlock_' + chainId }, { $set: { value: chain.lastProcessedBlock } }, { upsert: true });
            }
        });
    }

    async queryTokenLockedEvents(chain, chainId) {
        const events = await chain.bridgeContract.queryFilter(TOKEN_LOCKED, chain.lastProcessedBlock + 1);

        let maxProcessedBlock = chain.lastProcessedBlock;

        for (const event of events) {
            const targetBlockchain = this.blockchainsMapping[event.args[3].toString()];

            if (!targetBlockchain) {
                console.log('Unknown blockchain: ', event.args[3]);
                continue;
            }

            const contract = targetBlockchain.bridgeContract;
            await this.tokenLockedEventProcessor.process(
                event.args[0],
                event.args[1],
                event.args[2],
                event.args[3],
                event.args[4],
                chainId,
                contract,
                chain.erc20Abi,
                chain.provider,
                event.transactionHash);

            if (maxProcessedBlock < event.blockNumber) {
                maxProcessedBlock = event.blockNumber;
            }
        }

        if (maxProcessedBlock > chain.lastProcessedBlock) {
            chain.lastProcessedBlock = maxProcessedBlock;
            await Setting.updateOne({ key: 'lastProcessedBlock_' + chainId }, { $set: { value: chain.lastProcessedBlock } }, { upsert: true });
        }
    }

    async queryTokenClaimedEvents(chain, chainId) {
        console.log('In query and last procesblock',chain.lastProcessedBlock);
        const events = await chain.bridgeContract.queryFilter(TOKEN_CLAIMED, chain.lastProcessedBlock + 1);
        console.log('evv', events.length);
        let maxProcessedBlock = chain.lastProcessedBlock;

        for (const event of events) {
            await this.tokenClaimedEventProcessor.process(
                event.args[0],
                event.args[1],
                event.args[2],
                event.args[3],
                chainId,
                event.transactionHash);

            if (maxProcessedBlock < event.blockNumber) {
                maxProcessedBlock = event.blockNumber;
            }
        }

        if (maxProcessedBlock > chain.lastProcessedBlock) {
            chain.lastProcessedBlock = maxProcessedBlock;
            await Setting.updateOne({ key: 'lastProcessedBlock_' + chainId }, { $set: { value: chain.lastProcessedBlock } }, { upsert: true });
        }
    }

    async queryTokenBurnedEvents(chain, chainId) {
        const events = await chain.bridgeContract.queryFilter(TOKEN_BURNED, chain.lastProcessedBlock + 1);

        let maxProcessedBlock = chain.lastProcessedBlock;

        for (const event of events) {
            const targetBlockchain = this.blockchainsMapping[event.args[3].toString()];

            if (!targetBlockchain) {
                console.log('Unknown blockchain: ', event.args[3]);
                continue;
            }

            const contract = targetBlockchain.bridgeContract;
            await this.tokenBurnedEventProcessor.process(
                event.args[0],
                event.args[1],
                event.args[2],
                chainId,
                event.args[3],
                event.args[4],
                contract,
                event.transactionHash);

            if (maxProcessedBlock < event.blockNumber) {
                maxProcessedBlock = event.blockNumber;
            }
        }

        if (maxProcessedBlock > chain.lastProcessedBlock) {
            chain.lastProcessedBlock = maxProcessedBlock;
            await Setting.updateOne({ key: 'lastProcessedBlock_' + chainId }, { $set: { value: chain.lastProcessedBlock } }, { upsert: true });
        }
    }

    async queryTokenReleasedEvents(chain, chainId) {
        const events = await chain.bridgeContract.queryFilter(TOKEN_RELEASED, chain.lastProcessedBlock + 1);

        let maxProcessedBlock = chain.lastProcessedBlock;

        for (const event of events) {
            await this.tokenReleasedEventProcessor.process(
                event.args[0],
                event.args[1],
                event.args[2],
                chainId,
                event.transactionHash);

            if (maxProcessedBlock < event.blockNumber) {
                maxProcessedBlock = event.blockNumber;
            }
        }

        if (maxProcessedBlock > chain.lastProcessedBlock) {
            chain.lastProcessedBlock = maxProcessedBlock;
            await Setting.updateOne({ key: 'lastProcessedBlock_' + chainId }, { $set: { value: chain.lastProcessedBlock } }, { upsert: true });
        }
    }

    initialize(settingsMap) {
        const contractOwnerPrivateKey = settingsMap['contractOwnerPrivateKey'];
        const contractAbi = settingsMap['contractAbi'];
        const erc20Abi = settingsMap['erc20Abi'];
        const infuraApiKey = settingsMap['infuraApiKey'];
        const blockchains = settingsMap['blockchains'];

        blockchains.forEach(blockchain => {
            const provider = new ethers.InfuraProvider(blockchain.chainId, infuraApiKey);
            const ownerWallet = new ethers.Wallet(contractOwnerPrivateKey, provider);
            const bridgeContract = new ethers.Contract(blockchain.bridgeContractAddress, contractAbi, ownerWallet);
            const lastProcessedBlock = settingsMap['lastProcessedBlock_' + blockchain.chainId] || 0;

            console.log('csacascasc:',blockchain.bridgeContractAddress);

            this.blockchainsMapping[blockchain.chainId.toString()] = { provider: provider, bridgeContract: bridgeContract, lastProcessedBlock: lastProcessedBlock, erc20Abi: erc20Abi };
        });
    }
}

module.exports = EventListenerService;