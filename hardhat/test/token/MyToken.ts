import { MyToken } from "./../../typechain-types/contracts/token/MyToken";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("MyToken", function () {
    let myTokenFactory;
    let myToken: MyToken;
    
    before(async () => {
        myTokenFactory = await ethers.getContractFactory("MyToken");
        myToken = await myTokenFactory.deploy();
        await myToken.waitForDeployment();
    });
    
    it("When mint is called with amount for a user, expect balance of user for the token to be equal to amount", async function () {
        const [owner, user] = await ethers.getSigners();
        const amount = 10;

        expect(await myToken.balanceOf(user.address)).to.equal(0);
        (await myToken.connect(owner).mint(user.address, amount)).wait();
        expect(await myToken.balanceOf(user.address)).to.equal(amount);
    });

    it("Should revert with not owner when user,different from the owner calls mint", async function () {
        const [owner, user] = await ethers.getSigners();
        const amount = 10;

        await expect(myToken.connect(user).mint(user.address, amount)).to.revertedWith('Ownable: caller is not the owner');
    });
});