var Contract = require("truffle-contract");

var conConstructor = function(contract, address) {
    var res = function(provider) {
        var nc = new Contract(contract)
        nc.setProvider(provider)
        nc = nc.at(address)
        return nc
    }
    return res;
}
var fifsJson = require('./contracts/FIFSRegistrar')
var secRegJson = require('./contracts/SecondaryRegistrar')
var ensJson = require('./contracts/ENS')
var makeFIFS = conConstructor(fifsJson, '0xf25186b5081ff5ce73482ad761db0eb0d25abfbf')
var makeSecReg = conConstructor(secRegJson,'0x9fbda871d559710256a2502a2517b794b482db40')
var makeENS = conConstructor(ensJson, '0x345ca3e014aaf5dca488057592ee47305d9b3e10')


//var makeFIFS = conConstructor(fifsJson, '0x21397c1a1f4acd9132fe36df011610564b87e24b')
//var makeSecReg = conConstructor(secRegJson,'0xdb7641ab5b1e2f4b5ed035b4e3541452e15793cd')
//var makeENS = conConstructor(ensJson, '0x112234455c3a32fd11230c42e7bccd4a84e02010')

module.exports.makeFIFS = makeFIFS
module.exports.makeSecReg = makeSecReg
module.exports.makeENS = makeENS
