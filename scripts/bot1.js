

//TODO: check dripAmount and do stuff
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

let minAmount_CHD = web3.utils.toWei("10")
let threshold = .03 //e.g. .01 = 1%

async function bot1(){
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
        maticPrice = 1
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
    let ethCfc = await hre.ethers.getContractAt("feeContract/contracts/CFC.sol:CFC", c.ETHEREUM_CFC, gnoSigner)
    let gnoCfc = await hre.ethers.getContractAt("feeContract/contracts/CFC.sol:CFC", c.GNOSIS_CFC, chiSigner)
    let polCfc = await hre.ethers.getContractAt("feeContract/contracts/CFC.sol:CFC", c.POLYGON_CFC, mumSigner)
    cit = await hre.ethers.getContractAt("incentiveToken/contracts/Auction.sol:Auction", c.ETHEREUM_CIT, gnoSigner)
    let ethChd = await hre.ethers.getContractAt("charonAMM/contracts/mocks/MockERC20.sol:MockERC20", c.ETHEREUM_CHD, gnoSigner)
    let gnoChd = await hre.ethers.getContractAt("charonAMM/contracts/mocks/MockERC20.sol:MockERC20", c.GNOSIS_CHD, chiSigner)
    let polChd = await hre.ethers.getContractAt("charonAMM/contracts/mocks/MockERC20.sol:MockERC20", c.POLYGON_CHD, mumSigner)
    let ethBaseToken = await hre.ethers.getContractAt("charonAMM/contracts/mocks/MockERC20.sol:MockERC20", c.ETHEREUM_BASETOKEN, gnoSigner)
    let gnoBaseToken = await hre.ethers.getContractAt("charonAMM/contracts/mocks/MockERC20.sol:MockERC20", c.GNOSIS_BASETOKEN, chiSigner)
    let polBaseToken = await hre.ethers.getContractAt("charonAMM/contracts/mocks/MockERC20.sol:MockERC20", c.POLYGON_BASETOKEN, mumSigner)

    // trade in/out of CHD based on this info to rebalance pools w/in some threshold (e.g. must be 1% off) 

    errors = 0
    while (errors > 1){
        try{

            let GNOCHDPrice = ethers.utils.formatEther(await chiadoCharon.getSpotPrice()) / xDaiPrice
            let ETHCHDPrice = ethers.utils.formatEther(await sepoliaCharon.getSpotPrice()) / ethPrice
            let POLCHDPrice = ethers.utils.formatEther(await mumbaiCharon.getSpotPrice()) / maticPrice
            let avgCHDPrice = (GNOCHDPrice + ETHCHDPrice + POLCHDPrice)/3
            //check my balance
            let myPOLBalance = await polBaseToken.balanceOf(myAddress)
            let myETHBalance = await ethBaseToken.balanceOf(myAddress)
            let myGNOBalance = await gnoBaseToken.balanceOf(myAddress)
            let myPOLCHDBalance = await polChd.balanceOf(myAddress)
            let myETHCHDBalance = await ethChd.balanceOf(myAddress)
            let myGNOCHDBalance = await gnoChd.balanceOf(myAddress)

            if(myPOLCHDBalance <= minAmount_CHD){
                console.log("need more CHD on polygon")
            }
            if(myETHCHDBalance <= minAmount_CHD){
                console.log("need more CHD on ethereum")
            }
            if(myGNOCHDBalance <= minAmount_CHD){
                console.log("need more CHD on gnosis")
            }
            if(myPOLBalance / maticPrice <= minAmount_CHD * avgCHDPrice){
                console.log("need more baseToken on polygon")
            }
            if(myETHBalance / ethPrice <= minAmount_CHD * avgCHDPrice){
                console.log("need more baseToken on ethereum")
            }
            if(myGNOBalance / xDaiPrice <= minAmount_CHD * avgCHDPrice){
                console.log("need more baseToken on gnosis")
            }

            if(Math.abs(1 - GNOCHDPrice/avgCHDPrice) < threshold){

            }
            if(Math.abs(1 - GNOCHDPrice/avgCHDPrice) < threshold){

            }
            if(Math.abs(1 - GNOCHDPrice/avgCHDPrice) < threshold){

            }
            //arbitrage to make adjustments to price
            //do rebalancing (depositToOtherChains w/ excess amount of any given asset to proper chain)

            let ethDollarAmount
            let polDollarAmount
            let gnoDollarAmount

            //get top and bottom
            //if top is 20% > bottom, rebalance


        }catch(err){
            console.log("errored out ", err)
            errors += 1
        }


    }

    let myKeypair = new Keypair({privkey:process.env.PK, myHashFunc: poseidon});
    console.log("my private balance ETHEREUM CHD", await getPrivateBalance(sepoliaCharon,myKeypair,5))
    console.log("my private balance GNOSIS CHD", await getPrivateBalance(chiadoCharon,myKeypair,10200))
    console.log("my private balance POLYGON CHD", await getPrivateBalance(mumbaiCharon,myKeypair,80001))

    // console.log("my CIT balance")

    console.log("ETHEREUM")
    console.log("RecordBalance: ",ethers.utils.formatEther(await sepoliaCharon.recordBalance()))
    console.log("RecordBalanceSynth: ",ethers.utils.formatEther(await sepoliaCharon.recordBalanceSynth()))
    console.log("Total Supply: ",ethers.utils.formatEther(await sepoliaCharon.totalSupply()))
    console.log("CHD Total Supply", ethers.utils.formatEther(await ethChd.totalSupply()))
    console.log("CIT TotalSupply ", ethers.utils.formatEther(await cit.totalSupply()))

    console.log("GNOSIS")
    console.log("RecordBalance: ",ethers.utils.formatEther(await chiadoCharon.recordBalance()))
    console.log("RecordBalanceSynth: ",ethers.utils.formatEther(await chiadoCharon.recordBalanceSynth()))
    console.log("Total Supply: ",ethers.utils.formatEther(await chiadoCharon.totalSupply()))
    console.log("CHD Total Supply", ethers.utils.formatEther(await chiChd.totalSupply()))

    console.log("POLYGON")
    console.log("RecordBalance: ",ethers.utils.formatEther(await mumbaiCharon.recordBalance()))
    console.log("RecordBalanceSynth: ",ethers.utils.formatEther(await mumbaiCharon.recordBalanceSynth()))
    console.log("Total Supply: ",ethers.utils.formatEther(await mumbaiCharon.totalSupply()))
    console.log("CHD Total Supply", ethers.utils.formatEther(await mumChd.totalSupply()))
    console.log("..all variables initialized correctly")

    // if(Date.now()/1000 - await cit.endDate() > 0){console.log("CIT Auction is over and ready to start new round!")}

    // let feePeriod = await cfc.getFeePeriods()
    // let thisPeriod = await cfc.getFeePeriodByTimestamp(feePeriod[feePeriod.length - 1])
    // if(Date.now()/1000 - thisPeriod.endDate > 0){console.log("fee period is ready for token balance reporting and distribution!")


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

bot1()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
