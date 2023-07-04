

class TokenLockedEventProcessor {
    constructor(db) {
        this.db = db;
    }
    async process(lockerAddress, originTokenAddress, amount, targetChainId, targetAddress, sourceChainId, targetBridgeContract, rawEvent) {
        console.log("Raw event: ", rawEvent);

        try {
            const addReleasableTransaction = await targetBridgeContract.addClaimableToken(targetAddress, sourceChainId, originTokenAddress, amount);
            await addReleasableTransaction.wait();
            console.log('Transaction successful:', addReleasableTransaction.hash);
        } catch (error) {
            console.error('Error adding claimable token:', error);
        }
    }
}

module.exports = TokenLockedEventProcessor;