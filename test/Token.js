const { ethers } = require('hardhat'); 
const { expect } = require('chai'); 

const tokens = (n) => {
	return ethers.utils.parseUnits(n.toString(), 'ether');
};

describe('Token', () => {
	let token,
		accounts,
		deployer,
		receiver,
		exchange;

	beforeEach(async () => {
		const Token = await ethers.getContractFactory('Token');
		token = await Token.deploy('Dapp University', 'DAPP', '1000000');

		accounts = await ethers.getSigners();
		deployer = accounts[0];
		receiver = accounts[1];
		exchange = accounts[2];

	});

	describe('Deployment', () => {
		const name = "Dapp University";
		const symbol = "DAPP";
		const decimals = 18;
		const totalSupply = tokens('1000000');

		it('has correct name', async () => {
			expect(await token.name()).to.equal(name);
		});

		it('has correct symbol', async () => {
			expect(await token.symbol()).to.equal(symbol);
		});

		it('has correct decimals', async () => {
			expect(await token.decimals()).to.equal(decimals);
		});

		it('has correct totalSupply', async () => {
			expect(await token.totalSupply()).to.equal(totalSupply);
		});

		it('assigns the total supply to deployer', async () => {
			expect(await token.balanceOf(deployer.address)).to.equal(totalSupply);

		});
	});

	describe('Sending Token', () => {
		let amount, 
			transaction, 
			result;

		describe('Success', () => {
			beforeEach(async () => {	
				amount = tokens(100);
				transaction = await token.connect(deployer).transfer(receiver.address, amount);
				result = await transaction.wait();
			
			});
	
			it('Transfers token balances', async () => {
				amount = tokens(100);
		
				expect(await token.balanceOf(deployer.address)).to.equal(tokens(999900));
				expect(await token.balanceOf(receiver.address)).to.equal(amount);
			});
	
			it('Emits a Transfer event', async () => {
				const event = result.events[0];
				expect(event.event).to.equal('Transfer');
				
				const args = event.args;
				expect(args.from).to.equal(deployer.address);
				expect(args.to).to.equal(receiver.address);
				expect(args.value).to.equal(amount);
			});
		});

		describe('Failure', () => {
			it('Rejects insufficient balances', async () => {
				const invalidAmount = tokens(100000000);
				await expect(token.connect(deployer).transfer(receiver.address, invalidAmount)).to.be.revertedWith('Not enough tokens');
			});

			it('Rejects invalid recipients', async () => {
				amount = tokens(100);
				await expect(token.connect(deployer	).transfer(ethers.constants.AddressZero, amount)).to.be.revertedWith('Invalid recipient');
			});	
		});

	});

	describe('Approving Tokens', () => {
		let amount, 
			transaction, 
			result;

		beforeEach(async () => {
			amount = tokens(100);
			transaction = await token.connect(deployer).approve(exchange.address, amount);
			result = await transaction.wait();
		});

		describe('Success', () => {
			it('Allocates an allowance for delegated token spending on behalf of the owner', async () => {
				expect(await token.allowance(deployer.address, exchange.address)).to.equal(amount);
			});

			it('Emits an Approval event', async () => {	
				const event = result.events[0];
				expect(event.event).to.equal('Approval');

				const args = event.args;
				expect(args.owner).to.equal(deployer.address);
				expect(args.spender).to.equal(exchange.address);
				expect(args.value).to.equal(amount);
			});
		});

		describe('Failure', () => {
			it('Rejects invalid spenders', async () => {
				await expect(token.connect(deployer).approve(ethers.constants.AddressZero, amount)).to.be.revertedWith('Invalid spender');
			});
		});
	});

	describe('Delegated Token Transfers', () => {
		let amount,
			transaction,
			result;

		beforeEach(async () => {
			amount = tokens(100);
			transaction = await token.connect(deployer).approve(exchange.address, amount);
			result = await transaction.wait();
		});

		describe('Success', () => {
			beforeEach(async () => {
				transaction = await token.connect(exchange).transferFrom(deployer.address, receiver.address, amount);
				result = await transaction.wait();
			});

			it('Transfers token balances', async () => {
				expect(await token.balanceOf(deployer.address)).to.equal(tokens(999900));
				expect(await token.balanceOf(receiver.address)).to.equal(amount);
			});

			it('Resets the allowance', async () => {
				expect(await token.allowance(deployer.address, exchange.address)).to.equal(0);
			});
		});

		describe('Failure', async () => {
			const invalidAmount = tokens(100000000);
			
			it('Rejects insufficient amounts', async () => {
				await expect(token.connect(exchange).transferFrom(deployer.address, receiver.address, invalidAmount)).to.be.reverted;
			});
		});
	});
});
