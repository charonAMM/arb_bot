//TODO: check dripAmount and do stuff
require("@nomiclabs/hardhat-ethers");
const hre = require("hardhat");
const c = require("./testAddys.js")
const fetch = require('node-fetch');
require("dotenv").config();
const web3 = require('web3');
//const charonContract = require('../artifacts/charonAMM/contracts/Charon.sol/Charon.json')
//npx hardhat run scripts/bot1.js --network mumbai


var myAddress = process.env.PUBLICKEY
let minAmount_CHD = web3.utils.toWei("10")
let threshold = .03 //e.g. .01 = 1%
let _network = hre.network.name

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

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
        maticPrice = .676
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
    let gnoNode = process.env.NODE_URL_SEPOLIA;
    let polNode = process.env.NODE_URL_MUMBAI;
    let chiNode = process.env.NODE_URL_CHIADO;
    let provider = new ethers.providers.JsonRpcProvider(gnoNode);
    let wallet = new ethers.Wallet(process.env.PK, provider);
    let gnoSigner = wallet.provider.getSigner(wallet.address)
    sepoliaCharon = await hre.ethers.getContractAt("Charon", c.ETHEREUM_CHARON, gnoSigner)
    provider = new ethers.providers.JsonRpcProvider(chiNode);
    wallet = new ethers.Wallet(process.env.PK, provider);
    let chiSigner = wallet.provider.getSigner(wallet.address)
    chiadoCharon = await hre.ethers.getContractAt("Charon", c.GNOSIS_CHARON, chiSigner)
    provider = new ethers.providers.JsonRpcProvider(polNode);
    wallet = new ethers.Wallet(process.env.PK, provider);
    let mumSigner = wallet.provider.getSigner(wallet.address)
    mumbaiCharon = await hre.ethers.getContractAt("Charon", c.POLYGON_CHARON,mumSigner)
    let ethChd = await hre.ethers.getContractAt("CHD", c.ETHEREUM_CHD, gnoSigner)
    let gnoChd = await hre.ethers.getContractAt("CHD", c.GNOSIS_CHD, chiSigner)
    let polChd = await hre.ethers.getContractAt("CHD", c.POLYGON_CHD, mumSigner)
    let ethBaseToken = await hre.ethers.getContractAt("Token", c.ETHEREUM_BASETOKEN, gnoSigner)
    let gnoBaseToken = await hre.ethers.getContractAt("Token", c.GNOSIS_BASETOKEN, chiSigner)
    let polBaseToken = await hre.ethers.getContractAt("Token", c.POLYGON_BASETOKEN, mumSigner)

    // trade in/out of CHD based on this info to rebalance pools w/in some threshold (e.g. must be 1% off) 

    errors = 0
    while (errors < 1){
        try{

            let GNOCHDPrice = ethers.utils.formatEther(await chiadoCharon.getSpotPrice()) / xDaiPrice
            let ETHCHDPrice = ethers.utils.formatEther(await sepoliaCharon.getSpotPrice()) / ethPrice
            let POLCHDPrice = ethers.utils.formatEther(await mumbaiCharon.getSpotPrice()) / maticPrice
            let avgCHDPrice = (GNOCHDPrice + ETHCHDPrice + POLCHDPrice)/3

            console.log("Gnosis CHD Price : ", GNOCHDPrice)
            console.log("Ethereum CHD Price : ", ETHCHDPrice)
            console.log("Polygon CHD Price : ", POLCHDPrice)
            console.log("Average Price", avgCHDPrice)
            //check my balance
            let myPOLBalance = await polBaseToken.balanceOf(myAddress)
            let myETHBalance = await ethBaseToken.balanceOf(myAddress)
            let myGNOBalance = await gnoBaseToken.balanceOf(myAddress)
            let myPOLCHDBalance = await polChd.balanceOf(myAddress)
            let myETHCHDBalance = await ethChd.balanceOf(myAddress)
            let myGNOCHDBalance = await gnoChd.balanceOf(myAddress)
            console.log("polBase", web3.utils.fromWei(String(myPOLBalance)))
            console.log("ethBase", web3.utils.fromWei(String(myETHBalance)))
            console.log("gnoBase", web3.utils.fromWei(String(myGNOBalance)))
            console.log("polCHD", web3.utils.fromWei(String(myPOLCHDBalance)))
            console.log("ethCHD", web3.utils.fromWei(String(myETHCHDBalance)))
            console.log("gnoCHD", web3.utils.fromWei(String(myGNOCHDBalance)))

            if(myPOLCHDBalance <= minAmount_CHD){
                console.log("need more CHD on polygon", myPOLCHDBalance)
            }
            if(myETHCHDBalance <= minAmount_CHD){
                console.log("need more CHD on ethereum", myETHCHDBalance)
            }
            if(myGNOCHDBalance <= minAmount_CHD){
                console.log("need more CHD on gnosis", myGNOCHDBalance)
            }
            if(myPOLBalance / maticPrice <= minAmount_CHD * avgCHDPrice){
                console.log("need more baseToken on polygon", web3.utils.fromWei(String(myPOLBalance)) / maticPrice)
            }
            if(myETHBalance / ethPrice <= minAmount_CHD * avgCHDPrice){
                console.log("need more baseToken on ethereum",web3.utils.fromWei(String(myETHBalance)) / ethPrice )
            }
            if(myGNOBalance / xDaiPrice <= minAmount_CHD * avgCHDPrice){
                console.log("need more baseToken on gnosis", web3.utils.fromWei(String(myGNOBalance)) / xDaiPrice)
            }
            let _thisCHDPrice, _price
            let _feeData = await hre.ethers.provider.getFeeData();
            delete _feeData.lastBaseFeePerGas
            delete _feeData.gasPrice
            if(_network == "chiado"){
                _thisCHDPrice = GNOCHDPrice
                _price = xDaiPrice
                charon = c.GNOSIS_CHARON
                baseToken = c.GNOSIS_BASETOKEN
                chd = c.GNOSIS_CHD
            }
            else if(_network == "mumbai"){
                _thisCHDPrice = POLCHDPrice
                _price = maticPrice
                charon = c.POLYGON_CHARON
                baseToken = c.POLYGON_BASETOKEN
                chd = c.POLYGON_CHD
            }
            else if(_network == "sepolia"){
                _thisCHDPrice = ETHCHDPrice
                _price = ethPrice
                charon = c.ETHEREUM_CHARON
                baseToken = c.ETHEREUM_BASETOKEN
                chd = c.ETHEREUM_CHD
            }
            else if(_network == "polygon"){
                _feeData = {"gasPrice":160000000000}
                try{
                    const key = process.env.OWLKEY; // fill your api key here
                    const res = await fetch(`https://api.owlracle.info/v4/poly/gas?apikey=${ key }`);
                    const data = await res.json();
                    if(data.avgGas > 10){
                        _feeData = {"gasPrice": Math.floor(1000000000 * data.speeds[1].maxFeePerGas)}
                        console.log("Polygon gas price", Math.floor(1000000000 * data.speeds[1].maxFeePerGas));
                    }else{
                        console.log("using manual gas price")
                    }
                }
                catch{
                    console.log("error getting polygon gas price")
                }
            }
            if(Math.abs(1 - _thisCHDPrice/avgCHDPrice) > threshold){
                charon = await hre.ethers.getContractAt("Charon", charon)
                baseToken = await hre.ethers.getContractAt("Token", baseToken)
                chd = await hre.ethers.getContractAt("CHD", chd)
                if(_thisCHDPrice > avgCHDPrice){
                        _10Dollars = web3.utils.toWei("500") / _price
                            if(await baseToken.balanceOf(myAddress) - _10Dollars > 0){
                                if(await baseToken.allowance(myAddress, charon.address) - _10Dollars < 0){
                                    await baseToken.approve(charon.address,String(await baseToken.balanceOf(myAddress)),_feeData)
                                    await sleep(5000)
                                }
                                await charon.estimateGas.swap(false,String(_10Dollars),0,web3.utils.toWei("9999999"),_feeData)
                                await charon.swap(false,String(_10Dollars),0,web3.utils.toWei("9999999"),_feeData)
                                await sleep(5000)
                                console.log("bought CHD....")
                            }
                            else{
                                console.log("need more base token")
                                errors += 1
                            }
                    }
                    else{
                        _10Dollars = web3.utils.toWei("100")
                        if(await chd.balanceOf(myAddress) - _10Dollars > 0){
                            if(await chd.allowance(myAddress,charon.address) > _10Dollars){
                                await chd.approve(charon.address,await chd.balanceOf(myAddress),_feeData)
                                await sleep(5000)
                            }
                            await charon.estimateGas.swap(true,String(_10Dollars),0,web3.utils.toWei("9999999"),_feeData)
                            await charon.swap(true,String(_10Dollars),0,web3.utils.toWei("9999999"),_feeData)
                            await sleep(5000)
                            console.log("sold CHD....")
                        }
                        else{
                            console.log("need to more chd")
                            errors += 1
                        }
                    }
            }
            else{
                console.log("within threshold!!")
                errors = 100
            }
            //arbitrage to make adjustments to price
            //do rebalancing (depositToOtherChains w/ excess amount of any given asset to proper chain)
            //get top and bottom
            //if top is 20% > bottom, rebalance
        }catch(err){
            console.log("errored out ", err)
            errors += 1
        }


    }
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
