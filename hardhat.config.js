/* eslint-disable indent, no-undef */
require('@nomiclabs/hardhat-ethers')
require('@nomiclabs/hardhat-waffle')
require('@nomiclabs/hardhat-etherscan')
require('dotenv').config()

const config = {
  solidity: {
    compilers: [
      {
        version: '0.6.12',
        settings: {
          optimizer: {
            enabled: true,
            runs: 2,
          },
        },
      },
      {
        version: '0.8.4',
        settings: {
          optimizer: {
            enabled: true,
            runs: 2,
          },
        },
      },
      {
        version: '0.8.17',
        settings: {
          optimizer: {
            enabled: true,
            runs: 2,
          },
        },
      },
        {
          version: '0.8.19',
          settings: {
            optimizer: {
              enabled: true,
              runs: 200,
            },
          },
      },
    ],
    overrides: {
      "charonAMM/contracts/Charon.sol:Charon": {
        version: "0.8.17",
        settings: { 
          optimizer: {
            enabled: true,
            runs: 2,
          }
        }
      },
      "contracts/FlatCharon.sol:FlatCharon": {
        version: "0.8.17",
        settings: { 
          optimizer: {
            enabled: true,
            runs: 2,
          }
        }
      },
    }
  },
  networks: {
    hardhat: {
      chainId: 1,
      initialBaseFeePerGas: 5,
      //allowUnlimitedContractSize: true
    },
    sepolia: {
           url: `${process.env.NODE_URL_SEPOLIA}`,
           accounts: [process.env.PK],
           gas: 9000000,
           chainId:11155111
      } ,
    mumbai: {
        url: `${process.env.NODE_URL_MUMBAI}`,
        accounts: [process.env.PK],
        gas: 9000000,
        chainId: 80001
    } ,
    chiado: {
        url: `${process.env.NODE_URL_CHIADO}`,
        accounts: [process.env.PK],
        gas: 9000000,
        chainId: 10200
    } ,
    optimism: {
      url: `${process.env.NODE_URL_OPTIMISM}`,
      accounts: [process.env.MAINPK],
      gas: 2000000,
      chainId:10
    } ,
    polygon: {
      url: `${process.env.NODE_URL_POLYGON}`,
      accounts: [process.env.MAINPK],
      gas: 2000000,
      gasPrice: 175000000000,
      chainId: 137
    } ,
    gnosis: {
      url: `${process.env.NODE_URL_GNOSIS}`,
      accounts: [process.env.MAINPK],
      gas: 2000000,
      chainId: 100
    } ,
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_KEY,
      polygonMumbai: process.env.POLYGONSCAN_KEY,
      chiado: process.env.BLOCKSCOUT_KEY,
      optimisticEthereum:process.env.OPSCAN_KEY,
      polygon:process.env.POLYGONSCAN_KEY,
      gnosis:process.env.BLOCKSCOUT_KEY
    },
    customChains: [
      {
        network: "gnosis",
        chainId: 100,
        urls: {
          apiURL: "https://blockscout.com/xdai/mainnet/api",
          browserURL: "https://blockscout.com/xdai/mainnet"
        }
      },
      {
        network: "chiado",
        chainId: 10200,
        urls: {
          apiURL: "https://blockscout.com/gnosis/chiado/api",
          browserURL: "https://blockscout.com/gnosis/chiado"
        }
      }
    ]
  },
  mocha: {
    timeout: 600000000,
  }
}

module.exports = config
