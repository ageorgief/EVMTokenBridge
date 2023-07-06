const { ethers } = require("ethers");
const TokenLockedEventProcessor = require("./tokenLockedEventProcessor");
const Setting = require("../models/setting");
const TokenLockedEvent = require("../models/tokenLockedEvents");
const TOKEN_LOCKED = "TokenLocked";

class EventListenerService {
    constructor() {
        this.blockchainsMapping = {};
        this.tokenLockedEventProcessor = new TokenLockedEventProcessor();
    }


    async start() {
        //const providerUrl = "asd";
        // const sepoliaContractAddress = "0x5733BC30e18ADa36B23E000D044c94D5c2d3c989";
        // const goreliContractAddress = "0x06AE7C07228D3795C67EF40CE9e08C0d78e79192";

        const settings = await Setting.find();
        const settingsMap = {};
        settings.forEach(setting => settingsMap[setting.key] = setting.value);

        await this.initialize(settingsMap);
        //console.log("mapp:", this.blockchainsMapping);

        //Use DB
        //Implement lastProcessedBlock logic
        //Notes: first websocketListener.start, second queryFilter.start(startBlock from db +1), handle duplicates in database

        //For the api endpoints: we should store data for bridged tokens(Bridge token is token that has been claimed on chain 2 after it has been locked on chain1)
        //For the api endpoints: we should store data for all tokens that have been bridged(....)
        Object.getOwnPropertyNames(this.blockchainsMapping).forEach(async chainId => {
            const chain = this.blockchainsMapping[chainId];
            let lastProcessedBlock = settingsMap['lastProcessedBlock_' + chainId] || 0;
            chain.bridgeContract.on(TOKEN_LOCKED, async (lockerAddress, originTokenAddress, amount, targetChainId, targetAddress, rawEvent) => {
                const contract = this.blockchainsMapping[targetChainId].bridgeContract;
                await this.tokenLockedEventProcessor.process(lockerAddress, originTokenAddress, amount, targetChainId, targetAddress, chainId, contract, rawEvent);

                if(rawEvent.blockNumber > lastProcessedBlock && chain.lastProcessedBlock != lastProcessedBlock) {
                    await Setting.updateOne({key:'lastProcessedBlock_' + chainId}, { $set: {value: lastProcessedBlock}}).exec();
                    lastProcessedBlock += 1;
                }
            });

            const events = await chain.bridgeContract.queryFilter(TOKEN_LOCKED, (lastProcessedBlock + 1) || 0);
            
            let maxProcessedBlock = - 1;
            events.forEach(async event => {
                //console.log("BLOCKCHAINS MAPPING:", this.blockchainsMapping);
                const contract = this.blockchainsMapping[parseInt(event.args[3])].bridgeContract;
                await this.tokenLockedEventProcessor.process(event.args[0], event.args[1], event.args[2], event.args[3], event.args[4], chainId, contract, event);
                
                if(maxProcessedBlock < event.blockNumber) {
                    maxProcessedBlock = event.blockNumber
                };
            });

            if(maxProcessedBlock > lastProcessedBlock) {
                lastProcessedBlock = maxProcessedBlock;
                await Setting.updateOne({key:'lastProcessedBlock_' + chainId}, { $set: {value: lastProcessedBlock}}).exec();
            }

            console.log('Started Listening on chain ' + chainId);
        });


        // // Start listening for the TokenLocked event
        // bridgeContractSepolia.on(TOKEN_LOCKED, (param1, param2,param3,param4,ev,empty) => {
        //     console.log(param1);
        //     console.log(param2);
        //     console.log(param3);
        //     console.log(param4);
        //     console.log(ev);
        //     console.log(empty);

        //     //console.log("Event locked arguments:", JSON.stringify(arguments));
        // });

        // const events = await bridgeContractSepolia.queryFilter(TOKEN_LOCKED, 3811669); 
        // console.log(events);


    }

    // async start() {
    //     const provider = new ethers.providers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID');
    //     const bridgeContractAddress = '0xYOUR_BRIDGE_CONTRACT_ADDRESS';
    //     const bridgeContractABI = ""

    //     const bridgeContract = new ethers.Contract(bridgeContractAddress, bridgeContractABI, provider);

    //     // Create an event filter for the TokenLocked event
    //     const eventFilter = bridgeContract.filters.TokenLocked();

    //     // Start listening for the TokenLocked event
    //     bridgeContract.on(eventFilter, (param1, param2) => {
    //         console.log('TokenLocked event emitted!');
    //         console.log('param1:', param1.toString());
    //         console.log('param2:', param2);
    //     });
    // }

    async initialize(settingsMap) {
        const contractOwnerPrivateKey = settingsMap['contractOwnerPrivateKey'];
        const contractAbi = settingsMap['contractAbi'];
        const infuraApiKey = settingsMap['infuraApiKey'];
        const blockchains = settingsMap['blockchains'];

        blockchains.forEach(blockchain => {
            const provider = new ethers.InfuraProvider(
                blockchain.chainId,
                infuraApiKey
            );
            console.log("BLOCKCHAIN ID:" + typeof blockchain.chainId);

            const ownerWallet = new ethers.Wallet(contractOwnerPrivateKey, provider);

            const bridgeContract = new ethers.Contract(blockchain.bridgeContractAddress, contractAbi, ownerWallet);

            this.blockchainsMapping[blockchain.chainId] = { provider: provider, bridgeContract: bridgeContract };
                
        })
    }
}



module.exports = EventListenerService;