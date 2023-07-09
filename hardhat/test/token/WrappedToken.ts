import { WrappedToken } from "./../../typechain-types/contracts/token/WrappedToken";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("WrappedToken", function () {
    let wrappedTokenFactory;
    let wrappedToken: WrappedToken;
    
    before(async () => {
        wrappedTokenFactory = await ethers.getContractFactory("WrappedToken");
        wrappedToken = await wrappedTokenFactory.deploy("tokenName","tokenSymbol");
        await wrappedToken.waitForDeployment();
    });

    it("Should revert with not owner when user,different from the owner calls mint", async function () {
        const [owner, user] = await ethers.getSigners();
        const amount = 10;

        await expect(wrappedToken.connect(user).mint(user.address, amount)).to.revertedWith('Ownable: caller is not the owner');
    });

    it("Should revert with not owner when user,different from the owner calls burn", async function () {
        const [owner, user] = await ethers.getSigners();
        const amount = 10;

        await expect(wrappedToken.connect(user).burn(user.address, amount)).to.revertedWith('Ownable: caller is not the owner');
    });
});