//bot for grabbing rewards in the system
/*types of rewards:
-oracleRewards
-userRewards
*/

//grab gas price for network
//grab price of each asset
//grab given reward
//calculate if profitable to a given threshold/amount, then perform action

require("hardhat-gas-reporter");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
const hre = require("hardhat");
const c = require("./contractAddys.js")
require("dotenv").config();
const web3 = require('web3');
//npx hardhat run scripts/dailyChecks.js --network mumbai
var myAddress = process.env.PUBLICKEY
const fetch = require('node-fetch');
const { buildPoseidon } = require("circomlibjs");
const { Keypair } = require("../src/keypair.js");
const Utxo = require("../src/utxo.js");
const { toFixedHex } = require('../src/utils.js')

function poseidon(inputs){
    let val = builtPoseidon(inputs)
    return builtPoseidon.F.toString(val)
}

async function bot2(charonInstance, myKeypair,chainID){
    let filter = charonInstance.filters.NewCommitment()
    let events = await charonInstance.queryFilter(filter,0,"latest")
    let thisUTXO
    let myAmount = 0
    let myNullifier;
    for(i = 0; i< events.length; i++){
        try {
            thisUTXO = Utxo.decrypt(myKeypair, events[i].args._encryptedOutput, events[i].args._index)
            thisUTXO.chainID = chainID;
            //nowCreate nullifier
            try{
                myNullifier = thisUTXO.getNullifier(poseidon)
                myNullifier = toFixedHex(myNullifier)
                if(!await charonInstance.isSpent(myNullifier)){
                    myAmount += parseInt(thisUTXO.amount);
                }
            }catch{
                console.log("nullifier error", i)
            }
        } catch{
            //console.log("not here")
        }
    }
    return ethers.utils.formatEther(myAmount.toString());
}


async function runChecks() {
    let xDaiPrice,maticPrice,ethPrice;

    try{
        xDaiPrice =await fetch('https://api.coingecko.com/api/v3/simple/price?ids=xdai&vs_currencies=usd').then(response => response.json());
        xDaiPrice = xDaiPrice["xdai"]["usd"]
        console.log("xDai price: ",xDaiPrice)
    }catch{
        xDaiPrice = 1;
        console.log("couldnt fetch xdai price")
    }
    try {
        maticPrice = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=usd').then(response => response.json());
        maticPrice = maticPrice["matic-network"]["usd"]
        console.log("matic price", maticPrice)
    }catch{
        maticPrice = 1.15
        console.log("couldnt fetch matic price")
    }
    try{
        ethPrice = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd').then(response => response.json());
        ethPrice = ethPrice["ethereum"]["usd"]
        console.log("eth price", ethPrice)
    }catch{
        ethPrice = 1800
        console.log("couldn't fetch eth price")
    }
    builtPoseidon = await buildPoseidon()
    let gnoNode = process.env.NODE_URL_SEPOLIA;
    let polNode = process.env.NODE_URL_MUMBAI;
    let chiNode = process.env.NODE_URL_CHIADO;
    let provider = new ethers.providers.JsonRpcProvider(gnoNode);
    let wallet = new ethers.Wallet(process.env.PK, provider);
    let gnoSigner = wallet.provider.getSigner(wallet.address)
    sepoliaCharon = await hre.ethers.getContractAt("charonAMM/contracts/Charon.sol:Charon", c.ETHEREUM_CHARON, gnoSigner)
    provider = new ethers.providers.JsonRpcProvider(chiNode);
    wallet = new ethers.Wallet(process.env.PK, provider);
    let chiSigner = wallet.provider.getSigner(wallet.address)
    chiadoCharon = await hre.ethers.getContractAt("charonAMM/contracts/Charon.sol:Charon", c.GNOSIS_CHARON, chiSigner)
    provider = new ethers.providers.JsonRpcProvider(polNode);
    wallet = new ethers.Wallet(process.env.PK, provider);
    let mumSigner = wallet.provider.getSigner(wallet.address)
    mumbaiCharon = await hre.ethers.getContractAt("charonAMM/contracts/Charon.sol:Charon", c.POLYGON_CHARON,mumSigner)
    console.log("running daily checks")

let ethCfc = await hre.ethers.getContractAt("feeContract/contracts/CFC.sol:CFC", c.ETHEREUM_CFC, gnoSigner)
let chiCfc = await hre.ethers.getContractAt("feeContract/contracts/CFC.sol:CFC", c.GNOSIS_CFC, chiSigner)
let mumCfc = await hre.ethers.getContractAt("feeContract/contracts/CFC.sol:CFC", c.POLYGON_CFC, mumSigner)
cit = await hre.ethers.getContractAt("incentiveToken/contracts/Auction.sol:Auction", c.ETHEREUM_CIT, gnoSigner)
let ethChd = await hre.ethers.getContractAt("charonAMM/contracts/mocks/MockERC20.sol:MockERC20", c.ETHEREUM_CHD, gnoSigner)
let chiChd = await hre.ethers.getContractAt("charonAMM/contracts/mocks/MockERC20.sol:MockERC20", c.GNOSIS_CHD, chiSigner)
let mumChd = await hre.ethers.getContractAt("charonAMM/contracts/mocks/MockERC20.sol:MockERC20", c.POLYGON_CHD, mumSigner)

let myKeypair = new Keypair({privkey:process.env.PK, myHashFunc: poseidon});


let GNOCHDPrice = ethers.utils.formatEther(await chiadoCharon.getSpotPrice()) / xDaiPrice
let ETHCHDPrice = ethers.utils.formatEther(await sepoliaCharon.getSpotPrice()) / ethPrice
let POLCHDPrice = ethers.utils.formatEther(await mumbaiCharon.getSpotPrice()) / maticPrice

console.log("Gnosis CHD Price : ", GNOCHDPrice)
console.log("Ethereum CHD Price : ", ETHCHDPrice)
console.log("Polygon CHD Price : ", POLCHDPrice)
// What's the arb opportunity
// How many times was each function run in past day
// TVL / TDV
// Amount of CHD LP'd, free floating public / private

}

bot2()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
