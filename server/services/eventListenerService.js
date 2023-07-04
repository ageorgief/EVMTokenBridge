const { ethers } = require("ethers");

const TOKEN_LOCKED = "TokenLocked";

class EventListenerService {
    constructor(db) {
        this.db = db;
        this.blockchainsMapping = {};
    }


    async start() {
        //const providerUrl = "asd";
        // const sepoliaContractAddress = "0x5733BC30e18ADa36B23E000D044c94D5c2d3c989";
        // const goreliContractAddress = "0x06AE7C07228D3795C67EF40CE9e08C0d78e79192";
        
        await this.initialize();
        //console.log("mapp:", this.blockchainsMapping);

        Object.getOwnPropertyNames(this.blockchainsMapping).forEach(chainId => {
            const chain = this.blockchainsMapping[chainId];
            console.log("Chain:", chain);
            chain.bridgeContract.on(TOKEN_LOCKED, (param1, param2,param3,param4,ev,empty,empty2) => {
                console.log(param1);
                console.log(param2);
                console.log(param3);
                console.log(param4);
                console.log(ev);
                console.log(empty);
                console.log(empty2);
                    
                //console.log("Event locked arguments:", JSON.stringify(arguments));
            });
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
        
        //Notes: first websocketListener.start, second queryFilter.start(startBlock from db +1), handle duplicates in database
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

    async initialize() {
        //To do: get from database
        const contractOwnerPrivateKey = "33fafaaa480220d833d95a04564e9a68d3c39df10091697c9e82a7361145bead";
        const contractAbi = [
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "_wrappedTokenFactory",
                  "type": "address"
                }
              ],
              "stateMutability": "nonpayable",
              "type": "constructor"
            },
            {
              "anonymous": false,
              "inputs": [
                {
                  "indexed": true,
                  "internalType": "address",
                  "name": "previousOwner",
                  "type": "address"
                },
                {
                  "indexed": true,
                  "internalType": "address",
                  "name": "newOwner",
                  "type": "address"
                }
              ],
              "name": "OwnershipTransferred",
              "type": "event"
            },
            {
              "anonymous": false,
              "inputs": [
                {
                  "indexed": false,
                  "internalType": "address",
                  "name": "burnerAddress",
                  "type": "address"
                },
                {
                  "indexed": false,
                  "internalType": "address",
                  "name": "originTokenAddress",
                  "type": "address"
                },
                {
                  "indexed": false,
                  "internalType": "uint256",
                  "name": "amount",
                  "type": "uint256"
                },
                {
                  "indexed": false,
                  "internalType": "uint256",
                  "name": "targetChainId",
                  "type": "uint256"
                },
                {
                  "indexed": false,
                  "internalType": "address",
                  "name": "releaserAddress",
                  "type": "address"
                }
              ],
              "name": "TokenBurned",
              "type": "event"
            },
            {
              "anonymous": false,
              "inputs": [
                {
                  "indexed": false,
                  "internalType": "address",
                  "name": "claimerAddress",
                  "type": "address"
                },
                {
                  "indexed": false,
                  "internalType": "address",
                  "name": "wrappedTokenAddress",
                  "type": "address"
                },
                {
                  "indexed": false,
                  "internalType": "uint256",
                  "name": "amount",
                  "type": "uint256"
                }
              ],
              "name": "TokenClaimed",
              "type": "event"
            },
            {
              "anonymous": false,
              "inputs": [
                {
                  "indexed": false,
                  "internalType": "address",
                  "name": "lockerAddress",
                  "type": "address"
                },
                {
                  "indexed": false,
                  "internalType": "address",
                  "name": "originTokenAddress",
                  "type": "address"
                },
                {
                  "indexed": false,
                  "internalType": "uint256",
                  "name": "amount",
                  "type": "uint256"
                },
                {
                  "indexed": false,
                  "internalType": "uint256",
                  "name": "targetChainId",
                  "type": "uint256"
                },
                {
                  "indexed": false,
                  "internalType": "address",
                  "name": "claimerAddress",
                  "type": "address"
                }
              ],
              "name": "TokenLocked",
              "type": "event"
            },
            {
              "anonymous": false,
              "inputs": [
                {
                  "indexed": false,
                  "internalType": "address",
                  "name": "releaserAddress",
                  "type": "address"
                },
                {
                  "indexed": false,
                  "internalType": "address",
                  "name": "originTokenAddress",
                  "type": "address"
                },
                {
                  "indexed": false,
                  "internalType": "uint256",
                  "name": "amount",
                  "type": "uint256"
                }
              ],
              "name": "TokenReleased",
              "type": "event"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "claimer",
                  "type": "address"
                },
                {
                  "internalType": "uint256",
                  "name": "sourceChainId",
                  "type": "uint256"
                },
                {
                  "internalType": "address",
                  "name": "token",
                  "type": "address"
                },
                {
                  "internalType": "uint256",
                  "name": "amount",
                  "type": "uint256"
                }
              ],
              "name": "addClaimableToken",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "releaser",
                  "type": "address"
                },
                {
                  "internalType": "address",
                  "name": "token",
                  "type": "address"
                },
                {
                  "internalType": "uint256",
                  "name": "amount",
                  "type": "uint256"
                }
              ],
              "name": "addReleasableToken",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "wrappedToken",
                  "type": "address"
                },
                {
                  "internalType": "uint256",
                  "name": "amount",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "targetChainId",
                  "type": "uint256"
                },
                {
                  "internalType": "address",
                  "name": "targetAddress",
                  "type": "address"
                }
              ],
              "name": "burnToken",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "token",
                  "type": "address"
                },
                {
                  "internalType": "uint256",
                  "name": "sourceChainId",
                  "type": "uint256"
                }
              ],
              "name": "claimToken",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "",
                  "type": "address"
                },
                {
                  "internalType": "uint256",
                  "name": "",
                  "type": "uint256"
                },
                {
                  "internalType": "address",
                  "name": "",
                  "type": "address"
                }
              ],
              "name": "claimableTokens",
              "outputs": [
                {
                  "internalType": "uint256",
                  "name": "",
                  "type": "uint256"
                }
              ],
              "stateMutability": "view",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "",
                  "type": "address"
                }
              ],
              "name": "feeBalances",
              "outputs": [
                {
                  "internalType": "uint256",
                  "name": "",
                  "type": "uint256"
                }
              ],
              "stateMutability": "view",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "token",
                  "type": "address"
                },
                {
                  "internalType": "uint256",
                  "name": "amount",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "targetChainId",
                  "type": "uint256"
                },
                {
                  "internalType": "address",
                  "name": "targetAddress",
                  "type": "address"
                }
              ],
              "name": "lockToken",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "uint256",
                  "name": "",
                  "type": "uint256"
                },
                {
                  "internalType": "address",
                  "name": "",
                  "type": "address"
                }
              ],
              "name": "originTokenByWrappedTokenByChain",
              "outputs": [
                {
                  "internalType": "address",
                  "name": "",
                  "type": "address"
                }
              ],
              "stateMutability": "view",
              "type": "function"
            },
            {
              "inputs": [],
              "name": "owner",
              "outputs": [
                {
                  "internalType": "address",
                  "name": "",
                  "type": "address"
                }
              ],
              "stateMutability": "view",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "",
                  "type": "address"
                },
                {
                  "internalType": "address",
                  "name": "",
                  "type": "address"
                }
              ],
              "name": "releasableTokens",
              "outputs": [
                {
                  "internalType": "uint256",
                  "name": "",
                  "type": "uint256"
                }
              ],
              "stateMutability": "view",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "originalToken",
                  "type": "address"
                }
              ],
              "name": "releaseToken",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
            },
            {
              "inputs": [],
              "name": "renounceOwnership",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "uint8",
                  "name": "_feePercentage",
                  "type": "uint8"
                }
              ],
              "name": "setFeePercentage",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "newOwner",
                  "type": "address"
                }
              ],
              "name": "transferOwnership",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "token",
                  "type": "address"
                },
                {
                  "internalType": "uint256",
                  "name": "amount",
                  "type": "uint256"
                },
                {
                  "internalType": "address",
                  "name": "recipient",
                  "type": "address"
                }
              ],
              "name": "withdrawTokenFee",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "uint256",
                  "name": "",
                  "type": "uint256"
                },
                {
                  "internalType": "address",
                  "name": "",
                  "type": "address"
                }
              ],
              "name": "wrappedTokenByOriginTokenByChain",
              "outputs": [
                {
                  "internalType": "address",
                  "name": "",
                  "type": "address"
                }
              ],
              "stateMutability": "view",
              "type": "function"
            },
            {
              "inputs": [],
              "name": "wrappedTokenFactory",
              "outputs": [
                {
                  "internalType": "contract IWrappedTokenFactory",
                  "name": "",
                  "type": "address"
                }
              ],
              "stateMutability": "view",
              "type": "function"
            }
        ];
        //const sepoliaContractAddress = "0x5733BC30e18ADa36B23E000D044c94D5c2d3c989";
        //const goreliContractAddress = "0x06AE7C07228D3795C67EF40CE9e08C0d78e79192";

        const infuraApiKey = "9f30ad62c0434218964bb38f1d2def95";
        const blockchains = [{chainId: 'sepolia', bridgeContractAddress: '0x5733BC30e18ADa36B23E000D044c94D5c2d3c989'}, 
        {chainId: 'goerli', bridgeContractAddress: '0x06AE7C07228D3795C67EF40CE9e08C0d78e79192'}]
        

        blockchains.forEach(blockchain => {
            const provider = new ethers.InfuraProvider(
                blockchain.chainId,
                infuraApiKey
            );

            const ownerWallet = new ethers.Wallet(contractOwnerPrivateKey, provider);
    
            const bridgeContract = new ethers.Contract(blockchain.bridgeContractAddress, contractAbi, ownerWallet);

            this.blockchainsMapping[blockchain.chainId] = {provider: provider, bridgeContract: bridgeContract};
            
        })
    }
}



module.exports = EventListenerService;