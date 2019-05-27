var contracts = require('./contract_interface')
function SecondaryRegistrar(web3Provider) {
    this.secReg = contracts.makeSecReg(web3Provider)

    this.listBuyNowName = function(name, priceInETH) {
        var price = Number(priceInETH) * 100000000
        return this.secReg.listName(
            name,
            price,
            {from:web3.eth.accounts[0], gas:3000000}
        )
    }

    this.getBuyNowListingCount = function() {
        return this.secReg.getCount.call()
    }

    this.getAuctionListingCount = function() {
        return this.secReg.getAuctionCount.call()
    }

    this.getAuctionListings = function(st, ed, callback) {
        var output = []
        var cnt = 0
        for (var i = st; i < ed; i++) {
            this.secReg.getAuctionRecord.call(i).then(function(result) {
                output.push(result)
                cnt = cnt + 1
                if (cnt == (ed - st)) {
                    callback(output)
                }
            })
        }
    }

    this.getBestBidder = function(name) {
        return this.secReg.getBestBidder.call(name)
    }

    this.getListings = function(st, ed, callback) {
        var output = []
        var cnt = 0
        for (var i = st; i < ed; i++) {
            this.secReg.getRecord.call(i).then(function(result) {
                output.push(result)
                cnt = cnt + 1
                if (cnt == (ed - st)) {
                    callback(output)
                }
            })
        }
    }

    this.buy = this.secReg.buy
    this.address = this.secReg.address

}

module.exports = SecondaryRegistrar
