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

function App() {
  const dispatch = useDispatch();

  const loadBlockchainData = async () => { 
    // connect Ethers to blockchain
    const provider = await loadProvider(dispatch);
    
    // fetch current network's chainId
    const chainId = await loadNetwork(provider, dispatch);
    
    // fetch current account and balance from metamask
    loadAccount(provider, dispatch);

    // load token smart contracts
    const DApp = config[chainId].DApp;
    const mETH = config[chainId].mETH;
    await loadTokens(provider, [DApp.address, mETH.address], dispatch) ;

    // exchange smart contract
    const exchangeConfig = config[chainId].exchange;
    await loadExchange(provider, exchangeConfig.address, dispatch);
  }

  useEffect(() => {
    loadBlockchainData();
  })

  return (
    <div>

      {/* Navbar */}

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
