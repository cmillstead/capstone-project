import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import config from '../config.json';

import {
  loadProvider,
  loadNetwork,
  loadAccount,
  loadTokens,
  loadExchange
} from '../store/interactions';

import Navbar from './Navbar'

function App() {
  const dispatch = useDispatch();

  const loadBlockchainData = async () => {
    // connect Ethers to blockchain
    const provider = loadProvider(dispatch);

    // fetch current network's chainId (e.g. hardhat: 31337, goerlie: 5)
    const chainId = await loadNetwork(provider, dispatch);

    // reload page when network changes
    window.ethereum.on('chainChanged', () => {
      window.location.reload();
    })

    // fetch current account & balance from Metamask when changed
    window.ethereum.on('accountsChanged', () => {
      loadAccount(provider, dispatch);
    })

    // load token smart contracts
    console.log(`Loading tokens for chainId: ${chainId}`);
    const DApp = config[chainId].DApp;
    const mETH = config[chainId].mETH;
    await loadTokens(provider, [DApp.address, mETH.address], dispatch);

    // load exchange smart contract
    const exchangeConfig = config[chainId].exchange;
    await loadExchange(provider, exchangeConfig.address, dispatch);
  }

  useEffect(() => {
    loadBlockchainData();
  })

  return (
    <div>

      <Navbar />

      <main className='exchange grid'>
        <section className='exchange__section--left grid'>

          {/* Markets */}

          {/* Balance */}

          {/* Order */}

        </section>
        <section className='exchange__section--right grid'>

          {/* PriceChart */}

          {/* Transactions */}

          {/* Trades */}

          {/* OrderBook */}

        </section>
      </main>

      {/* Alert */}

    </div>
  );
}

export default App;
