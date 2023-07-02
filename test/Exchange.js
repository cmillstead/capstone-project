const { ethers } = require('hardhat'); 
const { expect } = require('chai'); 

const { tokens } = require('../src/utils');

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
        
        accounts = await ethers.getSigners();
		deployer = accounts[0];
		feeAccount = accounts[1];
        user1 = accounts[2];
        user2 = accounts[3];

        token1 = await Token.deploy('Dapp University', 'DAPP', '1000000');
        token2 = await Token.deploy('Mock Dai', 'mDAI', '1000000');

        let transaction = await token1.connect(deployer).transfer(user1.address, tokens(100));
        await transaction.wait();
		exchange = await Exchange.deploy(feeAccount.address, feePercent);
	});  

	describe('Deployment', () => {
		it('Tracks the fee account', async () => {
			expect(await exchange.feeAccount()).to.equal(feeAccount.address);
		});

		it('Tracks the fee percent', async () => {
			expect(await exchange.feePercent()).to.equal(feePercent);
		});
	});

    describe('Depositing Tokens', () => {
        let result, transaction;
        let amount = tokens(10);

        describe('Success', () => {
            beforeEach(async () => {
                // approve token
                transaction = await token1.connect(user1).approve(exchange.address, amount);
                result = await transaction.wait();
                // Deposit token
                transaction = await exchange.connect(user1).depositToken(token1.address, amount);
                result = await transaction.wait();
            });

            it('Tracks the token deposit', async () => {
                expect(await token1.balanceOf(exchange.address)).to.equal(amount);
                expect(await exchange.tokens(token1.address, user1.address)).to.equal(amount);
                expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(amount);
            });

			it('Emits a Deposit event', async () => {
				const event = result.events[1];
				expect(event.event).to.equal('Deposit');
				
				const args = event.args;
				expect(args.token).to.equal(token1.address);
				expect(args.user).to.equal(user1.address);
				expect(args.amount).to.equal(amount);
				expect(args.balance).to.equal(amount);
            });
        });
        
        describe('Failure', () => {
            it('Fails when no tokens are approved', async () => {
                await expect(exchange.connect(user1).depositToken(token1.address, tokens(10))).to.be.reverted;
            });
        });
    });

    describe('Withdrawing Tokens', () => {
        let transaction, result;
        let amount = tokens(10);

        describe('Success', () => {
            beforeEach(async () => {
                // deposit tokens before withdrawing

                // approve token
                transaction = await token1.connect(user1).approve(exchange.address, amount);
                result = await transaction.wait();
                
                // Deposit token
                transaction = await exchange.connect(user1).depositToken(token1.address, amount);
                result = await transaction.wait();

                // now withdraw tokens
                transaction = await exchange.connect(user1).withdrawToken(token1.address, amount);
                result = await transaction.wait();
            });

            it('Withdraws token funds', async () => {
                expect(await token1.balanceOf(exchange.address)).to.equal(0);
                expect(await exchange.tokens(token1.address, user1.address)).to.equal(0);
                expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(0);
            });

			it('Emits a Withdraw event', async () => {
				const event = result.events[1];
				expect(event.event).to.equal('Withdraw');
				
				const args = event.args;
				expect(args.token).to.equal(token1.address);
				expect(args.user).to.equal(user1.address);
				expect(args.amount).to.equal(amount);
				expect(args.balance).to.equal(0);
            });
        });
        
        describe('Failure', () => {
            it('Fails when no tokens are approved', async () => {
                // attempt to withdraw tokens without depositing first
                await expect(exchange.connect(user1).depositToken(token1.address, amount)).to.be.reverted;
            });
        });
    });

    describe('Checking Balances', () => {
        let transaction, result;
        let amount = tokens(1);

        beforeEach(async () => {
            // approve token
            transaction = await token1.connect(user1).approve(exchange.address, amount);
            result = await transaction.wait();
            // Deposit token
            transaction = await exchange.connect(user1).depositToken(token1.address, amount);
            result = await transaction.wait();
        });

        it('Returns user balance', async () => {
            expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(amount);
        });
    });

    describe('Making orders', async () => {
        let transaction, result;
        let amount = tokens(1);
    
        describe('Success', async () => {
          beforeEach(async () => {
            // Deposit tokens before making order
    
            // Approve Token
            transaction = await token1.connect(user1).approve(exchange.address, amount);
            result = await transaction.wait();
            // Deposit token
            transaction = await exchange.connect(user1).depositToken(token1.address, amount);
            result = await transaction.wait();
    
            // Make order
            transaction = await exchange.connect(user1).makeOrder(token2.address, amount, token1.address, amount);
            result = await transaction.wait();
          });
    
          it('Tracks the newly created order', async () => {
            expect(await exchange.orderCount()).to.equal(1);
          });
    
          it('Emits an Order event', async () => {
            const event = result.events[0];
            expect(event.event).to.equal('Order');
    
            const args = event.args;
            expect(args.id).to.equal(1);
            expect(args.user).to.equal(user1.address);
            expect(args.tokenGet).to.equal(token2.address);
            expect(args.amountGet).to.equal(tokens(1));
            expect(args.tokenGive).to.equal(token1.address);
            expect(args.amountGive).to.equal(tokens(1));
            expect(args.timestamp).to.at.least(1);
          });
    
        });
    
        describe('Failure', async () => {
          it('Rejects with no balance', async () => {
            await expect(exchange.connect(user1).makeOrder(token2.address, tokens(1), token1.address, tokens(1))).to.be.reverted;
          });
        });
    });
    
    describe('Order actions', async () => {
        let transaction, result;
        let amount = tokens(1);

        beforeEach(async () => {
            // Approve Token
            transaction = await token1.connect(user1).approve(exchange.address, amount);
            result = await transaction.wait();

            // Deposit token
            transaction = await exchange.connect(user1).depositToken(token1.address, amount);
            result = await transaction.wait();

            // give tokens to user 2
            transaction = await token2.connect(deployer).transfer(user2.address, tokens(100));
            await transaction.wait();
            
            // user 2 deposits tokens
            transaction = await token2.connect(user2).approve(exchange.address, tokens(2));
            result = await transaction.wait();

            transaction = await exchange.connect(user2).depositToken(token2.address, tokens(2));
            result = await transaction.wait();

            // Make order
            transaction = await exchange.connect(user1).makeOrder(token2.address, amount, token1.address, amount);
            result = await transaction.wait();
        });

        describe('Cancelling Orders', async () => {
            describe('Success', async () => {
                beforeEach(async () => {
                    // Approve Token
                    transaction = await exchange.connect(user1).cancelOrder(1);
                    result = await transaction.wait();
                });

                it('Updates cancelled orders', async () => {
                    expect(await exchange.orderCancelled(1)).to.equal(true);
                });

                it('Emits a Cancel event', async () => {
                    const event = result.events[0];
                    expect(event.event).to.equal('Cancel');
            
                    const args = event.args;
                    expect(args.id).to.equal(1);
                    expect(args.user).to.equal(user1.address);
                    expect(args.tokenGet).to.equal(token2.address);
                    expect(args.amountGet).to.equal(tokens(1));
                    expect(args.tokenGive).to.equal(token1.address);
                    expect(args.amountGive).to.equal(tokens(1));
                    expect(args.timestamp).to.at.least(1);
                  });
            });
            
            describe('Failure', async () => {
                beforeEach(async () => {
                    // Approve Token
                    transaction = await token1.connect(user1).approve(exchange.address, amount);
                    result = await transaction.wait();
                    // Deposit token
                    transaction = await exchange.connect(user1).depositToken(token1.address, amount);
                    result = await transaction.wait();
                    // Make order
                    transaction = await exchange.connect(user1).makeOrder(token2.address, amount, token1.address, amount);
                    result = await transaction.wait();
                });

                it('Rejects invalid order ids', async () => {
                    const invalidOrderId = 9999;
                    await expect(exchange.connect(user1).cancelOrder(invalidOrderId)).to.be.reverted;
                });

                it('Rejects unauthorized cancellations', async () => {
                    await expect(exchange.connect(user2).cancelOrder(1)).to.be.reverted;
                });
            });
        });

        describe('Filling orders', async () => {
            describe('Success', () => {
              beforeEach(async () => {
                // user2 fills order
                transaction = await exchange.connect(user2).fillOrder('1');
                result = await transaction.wait();
              });
      
              it('executes the trade and charge fees', async () => {
                // Token Give
                expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(tokens(0));
                expect(await exchange.balanceOf(token1.address, user2.address)).to.equal(tokens(1));
                expect(await exchange.balanceOf(token1.address, feeAccount.address)).to.equal(tokens(0));
                // Token Get
                expect(await exchange.balanceOf(token2.address, user1.address)).to.equal(tokens(1));
                expect(await exchange.balanceOf(token2.address, user2.address)).to.equal(tokens(0.9));
                expect(await exchange.balanceOf(token2.address, feeAccount.address)).to.equal(tokens(0.1));
              })
      
              it('updates filled orders', async () => {
                expect(await exchange.orderFilled(1)).to.equal(true);
              });
      
              it('emits a Trade event', async () => {
                const event = result.events[0];
                expect(event.event).to.equal('Trade');
      
                const args = event.args;
                expect(args.id).to.equal(1);
                // expect(args.user).to.equal(user2.address);
                expect(args.tokenGet).to.equal(token2.address);
                expect(args.amountGet).to.equal(tokens(1));
                expect(args.tokenGive).to.equal(token1.address);
                expect(args.amountGive).to.equal(tokens(1));
                // expect(args.creator).to.equal(user1.address);
                expect(args.timestamp).to.at.least(1);
              });
            });
      
           describe('Failure', () => {
              it('rejects invalid order ids', async () => {
                const invalidOrderId = 99999;
                await expect(exchange.connect(user2).fillOrder(invalidOrderId)).to.be.reverted;
              });
      
              it('rejects already filled orders', async () => {
                transaction = await exchange.connect(user2).fillOrder(1);
                await transaction.wait();
                await expect(exchange.connect(user2).fillOrder(1)).to.be.reverted;
              });
      
              it('Rejects canceled orders', async () => {
                transaction = await exchange.connect(user1).cancelOrder(1);
                await transaction.wait();
                await expect(exchange.connect(user2).fillOrder(1)).to.be.reverted;
              });
            });
          });
      });
}); 
  