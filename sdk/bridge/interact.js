const { ethers } = require("ethers");
const MyToken = require("../abi/token/MyToken.json"); // You can copy also the compiled contract

const INFURA_API_KEY = '9f30ad62c0434218964bb38f1d2def95';
const OWNER_PRIVATE_KEY = '33fafaaa480220d833d95a04564e9a68d3c39df10091697c9e82a7361145bead';

const run = async function () {
    const provider = new ethers.InfuraProvider(
        "sepolia",
        INFURA_API_KEY
    );

    const ownerWallet = new ethers.Wallet(
        OWNER_PRIVATE_KEY,
        provider
    );

    const myTokenContract = new ethers.Contract(
        "0xc962760Cc4a723d82249b9074fbD2b35DAbCf2A5",
        MyToken.abi,
        ownerWallet
    );

    const transactionMint = await myTokenContract.mint("0xd25e31963cC0BD31E94F67A5e1aBC259de27A424",111);
    const transactionMintReceipt = await transactionMint.wait();
    if (transactionMintReceipt.status != 1) {
        console.log("Transaction was not successful");
        return;
    } else {
        console.log("Mint successfull");
    }

    const transactionIncreaseAllowance = await myTokenContract.increaseAllowance("0x5733BC30e18ADa36B23E000D044c94D5c2d3c989",111);
    const transactionIncreaseAllowanceReceipt = await transactionIncreaseAllowance.wait();
    if (transactionIncreaseAllowanceReceipt.status != 1) {
        console.log("Transaction was not successful");
        return;
    } else {
        console.log("Increase allowance successfull");
    }

    const tokenBalance = await myTokenContract.balanceOf("0xd25e31963cC0BD31E94F67A5e1aBC259de27A424");
    console.log("Token balance:", tokenBalance);
};
run();