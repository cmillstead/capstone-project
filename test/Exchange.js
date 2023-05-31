const { ethers } = require('hardhat'); 
const { expect } = require('chai'); 

const tokens = (n) => {
	return ethers.utils.parseUnits(n.toString(), 'ether');
};

describe('Exchange', () => {
	let deployer,
        accounts,
        exchange,
        feeAccount,
        token1,
        token2,
        user1,
        user2;
    
    const feePercent = 10;

	beforeEach(async () => {
        const Exchange = await ethers.getContractFactory('Exchange');
        const Token = await ethers.getContractFactory('Token');
        
        token1 = await Token.deploy('Dapp University', 'DAPP', '1000000');
        
        accounts = await ethers.getSigners();
		deployer = accounts[0];
		feeAccount = accounts[1];
        user1 = accounts[2];

		exchange = await Exchange.deploy(feeAccount.address, feePercent);
	});  

	describe('Deployment', () => {
		it('tracks the fee account', async () => {
			expect(await exchange.feeAccount()).to.equal(feeAccount.address);
		});

		it('tracks the fee percent', async () => {
			expect(await exchange.feePercent()).to.equal(feePercent);
		});
	});

    describe('Depositing tokens', () => {
        let result,
            transaction,
            amount;

        beforeEach(async () => {
            amount = tokens(10);
            await exchange.depositToken(ethers.constants.AddressZero, amount);


            transaction = await exchange.connect(user1).depositToken(token1.address, amount);

        });

        describe('Success', () => {
            it('tracks the token deposit', async () => {
                expect(await token1.balanceOf(exchange.address)).to.equal(amount);
            });
        });
        
        describe('Failure', () => {

        });

        it('tracks the token deposit', async () => {
            expect(await exchange.tokens(ethers.constants.AddressZero, deployer.address)).to.equal(amount);
        });
    });

});
