var Web3 = require('web3')
var provider = new Web3.providers.HttpProvider('http://localhost:9545')
global.web3 = new Web3(provider)

var contracts = require('./contract_interface.js')
var SecondaryRegistrar = require('./secondary_registrar.js')
var secReg = new SecondaryRegistrar(provider)
var fifs = contracts.makeFIFS(provider)

t = async () => {
    var res = await fifs.register(
        web3.sha3('sukunropstenn'),
        web3.eth.accounts[0],
        {from: web3.eth.accounts[0]}
    )

    res = await secReg.listBuyNowName('sukunropstenn.eth', 0.01)
    cnt = await secReg.getBuyNowListingCount()
    cnt = Number(cnt.toString())
    await secReg.getListings(0, cnt, console.log)
}
t()

