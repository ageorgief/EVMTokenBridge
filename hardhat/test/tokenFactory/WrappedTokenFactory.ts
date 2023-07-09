import { WrappedTokenFactory } from "./../../typechain-types/contracts/tokenFactory/WrappedTokenFactory";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("WrappedToken", function () {
    let wrappedTokenFactory_Factory;
    let wrappedTokenFactory: WrappedTokenFactory;
    
    before(async () => {
        wrappedTokenFactory_Factory = await ethers.getContractFactory("WrappedTokenFactory");
        wrappedTokenFactory = await wrappedTokenFactory_Factory.deploy();
        await wrappedTokenFactory.waitForDeployment();
    });

    it("Should revert with not owner when user,different from the owner calls createWrappedToken", async function () {
        const [owner, user] = await ethers.getSigners();
        const tokenName = "token";
        const tokenSymbol = "TKN";

        await expect(wrappedTokenFactory.connect(user).createWrappedToken(tokenName, tokenSymbol)).to.revertedWith('Ownable: caller is not the owner');
    });
});