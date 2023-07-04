import { ethers } from "hardhat";

export async function main() {   
    //MyToken deployment
    const MyToken_Factory = await ethers.getContractFactory("MyToken");
    const myToken = await MyToken_Factory.deploy();
    await myToken.waitForDeployment();
    console.log(`The MyToken contract is deployed to ${myToken.target}`);
    
    const myTokenOwner = await myToken.owner();
    console.log(`The MyToken contract owner is ${myTokenOwner}`);

    //WrappedTokenFactory deployment
    const WrappedTokenFactory_Factory = await ethers.getContractFactory("WrappedTokenFactory");
    const wrappedTokenFactory = await WrappedTokenFactory_Factory.deploy();
    await wrappedTokenFactory.waitForDeployment();
    console.log(`The WrappedTokenFactory contract is deployed to ${wrappedTokenFactory.target}`);

    const wrappedTokenFactoryOwner = await wrappedTokenFactory.owner();
    console.log(`The WrappedTokenFactory contract owner is ${wrappedTokenFactoryOwner}`);

    //Bridge deployment
    const Bridgey_Factory = await ethers.getContractFactory("Bridge");
    const bridge = await Bridgey_Factory.deploy(wrappedTokenFactory.target);
    await bridge.waitForDeployment();
    console.log(`The Bridge contract is deployed to ${bridge.target}`);
   
    const bridgeOwner = await bridge.owner();
    console.log(`The Bridge contract owner is ${bridgeOwner}`);
}