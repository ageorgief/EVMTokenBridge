import { Bridge } from "./../../typechain-types/contracts/bridge/Bridge";
import { WrappedTokenFactory } from "./../../typechain-types/contracts/tokenFactory/WrappedTokenFactory";
import { MyToken } from "./../../typechain-types/contracts/token/MyToken";
import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-toolbox/network-helpers"
import { Typed, BigNumberish, AddressLike } from "ethers";
import { IERC20__factory, ERC20__factory } from "../../typechain-types";

describe("Bridge", function () {
    this.timeout(0);

    let bridgeFactory;
    let wrappedTokenFactoryFactory;
    let myTokenFactory;
    let sourceBridge: Bridge;
    let targetBridge: Bridge;
    let sourceWrappedTokenFactory, targetWrappedTokenFactory: WrappedTokenFactory;
    let myToken: MyToken;
    let feePercentage: BigNumberish;
    let fee: BigNumberish;
    let amountToBeLocked: Typed | BigNumberish;
    let amountToBeClaimed: Typed | BigNumberish;
    let amountToBeBurned: Typed | BigNumberish;
    let amountToBeReleased: Typed | BigNumberish;
    let sourceBridgeAddress: Typed | AddressLike;
    let targetBridgeAddress: Typed | AddressLike;
    let myTokenAddress: Typed | AddressLike;
    const sourceChainId = 1;
    const targetChainId = 2;

    const ONE_DAY_IN_SECS = 24 * 60 * 60;


    before(async () => {
        bridgeFactory = await ethers.getContractFactory("Bridge");
        wrappedTokenFactoryFactory = await ethers.getContractFactory("WrappedTokenFactory");
        myTokenFactory = await ethers.getContractFactory("MyToken");

        myToken = await myTokenFactory.deploy();
        await myToken.waitForDeployment();

        //Deployment of bridge and wrappedTokenFactory at source chain
        sourceWrappedTokenFactory = await wrappedTokenFactoryFactory.deploy();
        await sourceWrappedTokenFactory.waitForDeployment();

        sourceBridge = await bridgeFactory.deploy(sourceWrappedTokenFactory);
        await sourceBridge.waitForDeployment();

        //Deployment of bridge and wrappedTokenFactory at target chain
        targetWrappedTokenFactory = await wrappedTokenFactoryFactory.deploy();
        await targetWrappedTokenFactory.waitForDeployment();

        targetBridge = await bridgeFactory.deploy(targetWrappedTokenFactory);
        await targetBridge.waitForDeployment();

        feePercentage = 5;
        await sourceBridge.setFeePercentage(feePercentage);
        await targetBridge.setFeePercentage(feePercentage);


        sourceBridgeAddress = await sourceBridge.getAddress();
        targetBridgeAddress = await targetBridge.getAddress();
        myTokenAddress = await myToken.getAddress();

        await (await targetWrappedTokenFactory.transferOwnership(targetBridgeAddress)).wait();
    });

    it("Should have locked MyToken on sourceChain and emit event for locked token", async function () {
        const [owner, user] = await ethers.getSigners();
        amountToBeLocked = 100;

        await myToken.mint(user.address, amountToBeLocked);
        await myToken.connect(user).increaseAllowance(sourceBridgeAddress, amountToBeLocked);

        expect(await myToken.balanceOf(user.address)).to.equal(amountToBeLocked);

        fee = (ethers.toNumber(feePercentage) * 0.01) * amountToBeLocked;
        amountToBeClaimed = amountToBeLocked - fee;


        await expect(await sourceBridge.connect(user).lockToken(myTokenAddress, amountToBeLocked, targetChainId, user.address))
            .to.emit(sourceBridge, "TokenLocked")
            .withArgs(user.address, myTokenAddress, amountToBeClaimed, targetChainId, user.address);

        expect(await myToken.balanceOf(user.address)).to.equal(0);
        expect(await myToken.balanceOf(sourceBridgeAddress)).to.equal(amountToBeLocked);
    });

    it("Should have claimed wrappedToken on target chain for lockedMyToken on sourceChain and emit event for claimed token", async function () {
        const [owner, user] = await ethers.getSigners();

        const tokenName = await ERC20__factory.connect(myTokenAddress.toString(), owner).name();
        const tokenSymbol = await ERC20__factory.connect(myTokenAddress.toString(), owner).symbol();

        await (await targetBridge.addTokenName(sourceChainId, myTokenAddress, tokenName)).wait();
        await (await targetBridge.addTokenSymbol(sourceChainId, myTokenAddress, tokenSymbol)).wait();
        await (await targetBridge.addClaimableToken(user.address, sourceChainId, myTokenAddress, amountToBeClaimed)).wait();

        await expect(await targetBridge.connect(user).claimToken(sourceChainId, myTokenAddress))
            .to
            .emit(targetBridge, "TokenClaimed");

        const wrappedTokenAddress = await targetBridge.wrappedTokenByOriginTokenByChain(sourceChainId, myTokenAddress);

        expect(await IERC20__factory.connect(wrappedTokenAddress, owner).balanceOf(user.address)).to.equal(amountToBeClaimed);
    });

    it("Should have burned wrappedToken on target chain and emit event for burned token", async function () {
        const [owner, user] = await ethers.getSigners();

        const unlockTime = (await time.latest()) + ONE_DAY_IN_SECS;
        await time.increaseTo(unlockTime);

        const wrappedTokenAddress = await targetBridge.wrappedTokenByOriginTokenByChain(sourceChainId, myTokenAddress);

        amountToBeBurned = amountToBeClaimed;

        await expect(await targetBridge.connect(user).burnToken(wrappedTokenAddress, amountToBeBurned, sourceChainId, user.address))
            .to
            .emit(targetBridge, "TokenBurned").withArgs(user.address, myTokenAddress, amountToBeBurned, sourceChainId, user.address);



        expect(await IERC20__factory.connect(wrappedTokenAddress, owner).balanceOf(user.address)).to.equal(0);
    });

    it("Should have released myToken on source chain and emit event for released token", async function () {
        const [owner, user] = await ethers.getSigners();

        await (await sourceBridge.addReleasableToken(user.address, myTokenAddress, amountToBeBurned)).wait();
        const unlockTime = (await time.latest()) + ONE_DAY_IN_SECS;
        await time.increaseTo(unlockTime);

        amountToBeReleased = amountToBeBurned;
        expect(await myToken.balanceOf(user.address)).to.equal(0);

        await expect(await sourceBridge.connect(user).releaseToken(myTokenAddress))
            .to
            .emit(sourceBridge, "TokenReleased").withArgs(user.address, myTokenAddress, amountToBeReleased);

        expect(await myToken.balanceOf(user.address)).to.equal(amountToBeReleased);

    });

    it("Should contain wrappedToken in wrappedTokenByOriginTokenByChain mapping in target chain that has already been bridged", async function () {
        const [owner, user] = await ethers.getSigners();
        const nullAddress = ethers.ZeroAddress;

        expect(await targetBridge.wrappedTokenByOriginTokenByChain(sourceChainId, myTokenAddress)).to.not.equal(nullAddress);
    });

    it("Should have claimed wrappedToken on target chain for lockedMyToken on sourceChain and emit event for claimed token when claimToken is called for token that has been bridged before", async function () {
        const [owner, user, user2] = await ethers.getSigners();
        const nullAddress = ethers.ZeroAddress;
        const amount = 50;
        
        const wrappedTokenAddress = await targetBridge.wrappedTokenByOriginTokenByChain(sourceChainId, myTokenAddress);
        const tokenName = await ERC20__factory.connect(myTokenAddress.toString(), owner).name();
        const tokenSymbol = await ERC20__factory.connect(myTokenAddress.toString(), owner).symbol();

        await (await targetBridge.addTokenName(sourceChainId, myTokenAddress, tokenName)).wait();
        await (await targetBridge.addTokenSymbol(sourceChainId, myTokenAddress, tokenSymbol)).wait();

        await (await targetBridge.addClaimableToken(user2.address, sourceChainId, myTokenAddress, amount)).wait();

        await expect(await targetBridge.connect(user2).claimToken(sourceChainId, myTokenAddress))
            .to
            .emit(targetBridge, "TokenClaimed");

        expect(await IERC20__factory.connect(wrappedTokenAddress, user2).balanceOf(user2.address)).to.equal(amount);
    });

    it("Should have received fee collected for myToken on owner account when owner calls withdrawTokenFee for myToken", async function () {
        const [owner] = await ethers.getSigners();

        const amountToWithdraw = await myToken.balanceOf(sourceBridge);

        expect(await myToken.balanceOf(owner.address)).to.equal(0);

        await (await sourceBridge.connect(owner).withdrawTokenFee(myTokenAddress, amountToWithdraw, owner.address)).wait();

        expect(await myToken.balanceOf(owner.address)).to.equal(amountToWithdraw);

    });

    it("Should revert with not owner when user,different from the owner calls setFeePercantage", async function () {
        const [owner, user] = await ethers.getSigners();
        const feePercentage = 10;
        await expect(sourceBridge.connect(user).setFeePercentage(feePercentage)).to.revertedWith('Ownable: caller is not the owner');
    });

    it("Should revert when user that has not locked token on source bridge calls claimToken", async function () {
        const [owner, user, user2] = await ethers.getSigners();

        await expect(targetBridge.connect(user2).claimToken(sourceChainId, myTokenAddress)).to.revertedWith('Bridge: no claimable token');
    });

    it("Should revert when user that has not burned token on target bridge calls releaseToken", async function () {
        const [owner, user, user2] = await ethers.getSigners();

        await expect(sourceBridge.connect(user2).releaseToken(myTokenAddress)).to.revertedWith('Bridge: no releasable token');
    });

    //Modifiers tests
    //Tests for lockToken modifiers
    it("Should revert with address cannot be null when user calls lockToken with null address for token in parameters", async function () {
        const [owner, user] = await ethers.getSigners();
        const amount = 50;
        const nullAddress = ethers.ZeroAddress;

        await expect(sourceBridge.connect(user).lockToken(nullAddress, amount, targetChainId, user.address)).to.revertedWith('Bridge: Token address cannot be the null address');
    });

    it("Should revert when user calls lockToken with not positive amount in parameters", async function () {
        const [owner, user] = await ethers.getSigners();
        const amount = 0;

        await expect(sourceBridge.connect(user).lockToken(myTokenAddress, amount, targetChainId, user.address)).to.revertedWith('Bridge: Amount must be greater than 0');
    });

    it("Should revert when user calls lockToken with not positive chainId for targetChainId in parameters", async function () {
        const [owner, user] = await ethers.getSigners();
        const amount = 50;
        const chainId = 0;

        await expect(sourceBridge.connect(user).lockToken(myTokenAddress, amount, chainId, user.address)).to.revertedWith('Bridge: chainId has to be greater than 0');
    });

    it("Should revert when user calls lockToken with null addres for targetAddress in parameters", async function () {
        const [owner, user] = await ethers.getSigners();
        const amount = 50;
        const nullAddress = ethers.ZeroAddress;

        await expect(sourceBridge.connect(user).lockToken(myTokenAddress, amount, targetChainId, nullAddress)).to.revertedWith('Bridge: Target address cannot be the null address');
    });

    //Tests for claimToken modifiers
    it("Should revert with address cannot be null when user calls claimToken with null address for token in parameters", async function () {
        const [owner, user] = await ethers.getSigners();
        const nullAddress = ethers.ZeroAddress;

        await expect(targetBridge.connect(user).claimToken(sourceChainId, nullAddress)).to.revertedWith('Bridge: Token address cannot be the null address');
    });


    it("Should revert when user calls lockToken with not positive chainId for sourceChainId in parameters", async function () {
        const [owner, user] = await ethers.getSigners();
        const chainId = 0;
        await expect(targetBridge.connect(user).claimToken(chainId, myTokenAddress)).to.revertedWith('Bridge: chainId has to be greater than 0');
    });

    //Tests for burnToken modifiers
    it("Should revert with address cannot be null when user calls burnToken with null address for wrappedToken in parameters", async function () {
        const [owner, user] = await ethers.getSigners();
        const amount = 50;
        const nullAddress = ethers.ZeroAddress;

        await expect(targetBridge.connect(user).burnToken(nullAddress, amount, sourceChainId, user.address)).to.revertedWith('Bridge: Token address cannot be the null address');
    });

    it("Should revert when user calls burnToken with not positive amount in parameters", async function () {
        const [owner, user] = await ethers.getSigners();
        const amount = 0;

        await expect(targetBridge.connect(user).burnToken(myTokenAddress, amount, sourceChainId, user.address)).to.revertedWith('Bridge: Amount must be greater than 0');
    });

    it("Should revert when user calls burnToken with not positive chainId for targetChainId in parameters", async function () {
        const [owner, user] = await ethers.getSigners();
        const amount = 50;
        const chainId = 0;

        await expect(targetBridge.connect(user).burnToken(myTokenAddress, amount, chainId, user.address)).to.revertedWith('Bridge: chainId has to be greater than 0');
    });

    it("Should revert when user calls burnToken with null addres for targetAddress in parameters", async function () {
        const [owner, user] = await ethers.getSigners();
        const amount = 50;
        const nullAddress = ethers.ZeroAddress;

        await expect(targetBridge.connect(user).burnToken(myTokenAddress, amount, sourceChainId, nullAddress)).to.revertedWith('Bridge: Target address cannot be the null address');
    });

    //Tests for releaseToken modifiers
    it("Should revert with address cannot be null when user calls burnToken with null address for originToken in parameters", async function () {
        const [owner, user] = await ethers.getSigners();
        const nullAddress = ethers.ZeroAddress;

        await expect(sourceBridge.connect(user).releaseToken(nullAddress)).to.revertedWith('Bridge: Token address cannot be the null address');
    });

    it("Should revert with not owner when user,different from the owner calls addClaimableToken", async function () {
        const [owner, user] = await ethers.getSigners();
        const amount = 42;

        await expect(sourceBridge.connect(user).addClaimableToken(user.address, sourceChainId, myTokenAddress, amount)).to.revertedWith('Ownable: caller is not the owner');
    });

    it("Should revert with not owner when user,different from the owner calls addReleasableToken", async function () {
        const [owner, user] = await ethers.getSigners();
        const amount = 42;

        await expect(sourceBridge.connect(user).addReleasableToken(user.address, myTokenAddress, amount)).to.revertedWith('Ownable: caller is not the owner');
    });

    it("Should revert with not owner when user,different from the owner calls addTokenSymbol", async function () {
        const [owner, user] = await ethers.getSigners();
        const tokenName = "name";
        
        await expect(sourceBridge.connect(user).addTokenName(user.address, myTokenAddress,tokenName)).to.revertedWith('Ownable: caller is not the owner');
    });

    it("Should revert with not owner when user,different from the owner calls addTokenSymbol", async function () {
        const [owner, user] = await ethers.getSigners();
        const tokenSymbol = "symbol";

        await expect(sourceBridge.connect(user).addTokenSymbol(user.address, myTokenAddress, tokenSymbol)).to.revertedWith('Ownable: caller is not the owner');
    });

    it("Should revert with not owner when user,different from the owner calls withdrawTokenFee", async function () {
        const [owner, user] = await ethers.getSigners();
        const amount = 42;

        await expect(sourceBridge.connect(user).withdrawTokenFee(myTokenAddress, amount, user.address)).to.revertedWith('Ownable: caller is not the owner');
    });
});