var $;
$ = require('jquery')
var Web3 = require('web3')
var SecReg = require('./secondary_registrar')
var URI = require('urijs')
var namehash = require('eth-ens-namehash')
var moment = require('moment')
var web3, fifs, secReg, ens


$(document).ready(function() {
    if (typeof window.web3 !== 'undefined') {
        window.web3 = new Web3(window.web3.currentProvider)
    } else {
        // If no injected web3 instance is detected, fallback to Truffle Develop.
        var web3Provider = new Web3.providers.HttpProvider('http://localhost:9545')
        window.web3 = new Web3(web3Provider)
    }
    var contractFuncs = require('./contract_interface')
    var makeFIFS = contractFuncs.makeFIFS
    var makeENS = contractFuncs.makeENS
    fifs = makeFIFS(window.web3.currentProvider)
    secReg = new SecReg(window.web3.currentProvider)
    ens = makeENS(window.web3.currentProvider)
    web3 = window.web3

    var url = window.location.href
    var uri = URI(url)
    if (uri.path() === '/'){
        populateListings()
        populateAuctionListings()
    } else if (uri.path().indexOf('buy/now/') !== -1) {
        populateSingleOffering()
    } else if (uri.path().indexOf('bid/') !== -1) {
        populateAuctionSingleOffering()
    }
})


$('#fifs-buy-button-real').click(function() {
    var requestedDomain = $('#fifs-buy-input').val()
    fifs.register(
        web3.sha3(requestedDomain),
        web3.eth.accounts[0],
        {from: web3.eth.accounts[0]}
    ).then(function(result) {
        console.log(result);
        window.location.href = '/sell';
    })

})

function listDomain(domainSelling, price) {
    var domainName = domainSelling + '.eth'
    secReg.secReg.listName(
        domainName,
        web3.toWei(price),
        {from: web3.eth.accounts[0]}
    ).then(function (result) {
        ens.setOwner(namehash.hash(domainName), secReg.address, {from: web3.eth.accounts[0], gas: 3000000})
            .then(function(_) {
                document.location.href = '/';
            })
    })
}

function listSubDomain(label, domain, price) {
    domain = domain + '.eth'
    secReg.secReg
        .listSubDomain(domain, label, web3.toWei(price), {from: web3.eth.accounts[0], gas: 3000000})
        .then(function (result) {
            ens.setOwner(
                namehash.hash(domain),
                secReg.address,
                {from: web3.eth.accounts[0]})
        })

}

var auctionDomain = (name, price, time) => {
    var domainName = name + '.eth'
    secReg.secReg.startAuctionDomain(
        domainName,
        web3.toWei(price),
        time,
        {
            from: web3.eth.accounts[0],
            gas: 3000000
        }
    ).then(() => {
        ens.setOwner(
            namehash.hash(domainName),
            secReg.address,
            {from: web3.eth.accounts[0], gas: 3000000}
        ).then(() => {
            document.location.href = '/';
        })
    })
}


$('#list-name-button').click(function() {
    var tp = $('#sell-switch').val()
    if (tp == 'Buy Now') {
        var domainSelling = $('#sell-input-name').val()
        var price = Number($('#sell-input-price').val())
        var elems = domainSelling.split('.')
        if (elems.length === 2) {
            listSubDomain(elems[0], elems[1], price)
        } else if (elems.length == 1) {
            listDomain(elems[0], price)
        }
    } else if (tp  == 'Auction') {
        var domainSelling = $('#bid-input-name').val()
        var price = Number($('#bid-input-price').val())
        var time = Number($('#bid-time').val())
        var elems = domainSelling.split('.')
        if (elems.length == 2) {
            auctionSubDomain(elems[0], elems[1], price, time)
        } else {
            auctionDomain(elems[0], price, time)
        }
    }


})

$('#buy-now').click(function() {
    document.location.href='buy'
})


var populateListings = () => {
    secReg.getBuyNowListingCount().then(function(cnt){
        var c = Number(cnt.toString())
        secReg.getListings(0, c, listOfferings)
    })
}

var wrapDiv = (html, props) => {
    strOut = '<div '
    propid = ''
    if (props.id !== undefined) {
        propid = 'id="' + props.id + '"'
    }
    propclass = ''
    if (props.classes !== undefined) {
        classes = props.classes.join(' ')
        propclass='class="' + classes + '"'
    }
    strOut = strOut + propid + ' ' + propclass + ' ' + '>'
    strEnd = '</div>'
    return strOut + html + strEnd;
}

var listOfferings = (offerArr) => {

    var getBuyNowButton = (recordCnt) => {
        return '<button id="buy-now-' + recordCnt + '" class="buy-now-button btn btn-primary btn-sm"> Buy Now! </button>';
    }


    var getOfferingHTML = (offering, cnt) => {
        var subName = offering[3]
        var name = offering[0]
        if (subName) {
            name = subName + '.' + name
        }
        var price = offering[1].toString()
        price = web3.fromWei(price, 'ether')
        var nameDiv = wrapDiv(name, {classes: ['buy-now-name']})
        var priceDiv = wrapDiv(price + ' ETH', {classes: ['buy-now-price']})
        var offeringDiv = wrapDiv(nameDiv + priceDiv, {classes: ['buy-now-offering']})
        var button = getBuyNowButton(cnt)
        var buttonDiv = wrapDiv(button, {classes: ['buy-now-button-div']})
        var res = wrapDiv(offeringDiv + buttonDiv, {classes: ['buy-now-listing', 'row']})
        return res
    }

    var getOfferingHeader = () => {
        var headerDiv = '<h4> Buy Now Offerings! </h4>'
        var headerHTML = wrapDiv(headerDiv, {id: 'buy-now-offerings-header', classes: ['offerings-header', 'row', 'text-center']})
        return headerHTML;
    }

    contentHTML = [getOfferingHeader()]
    for(var i = 0; i < offerArr.length; i++) {
        var offering = offerArr[i]
        if (offering[2]) {
            contentHTML.push(getOfferingHTML(offering, i))
        }
    }
    contentStr = contentHTML.join(' ')
    $('#listing-container').html(contentStr)
    $('.buy-now-button').click(function(){
        console.log('here')
        var id = $(this).attr('id')
        id = id.replace('buy-now-', '')
        id = Number(id)
        if (id !== undefined) {
            document.location.href = '/buy/now/' + id
        }
    })
}


var populateRecord = (record) => {
    var subName = record[3]
    var name = record[0]
    if (subName) {
        var name = subName + '.' + name
    }
    var eId = 'offering-button'
    var price = (record[1].toString())
    var price = web3.fromWei(price, 'ether')
    var nameHTML = '<p class="offering-name">' + name + '</p>'
    var priceHTML = '<p class="offering-price"> price ' + price + ' ETH</p>'
    nameHTML = wrapDiv(nameHTML, {classes: ['offering-name-div']})
    priceHTML = wrapDiv(priceHTML, {classes: ['offering-price-div']})

    var buttonHTML = '<button id="' + eId + '" class="offering-buy-button btn btn-primary"> Buy Now! </button>'
    buttonHTML = wrapDiv(buttonHTML, {classes: ['offering-buy-button-div']})
    var offeringHTML = wrapDiv(nameHTML + priceHTML+ buttonHTML, {classes: ['single-offering-container text-center row'], id: 'offering-'+name})
    var makeListener = function() {
        return function () {
            name = name.trim()
            var pr = null
            if (subName) {
                name = name.replace(subName + '.', '')
            }
            if(subName.length > 0) {
                pr = secReg.secReg.buySubDomain.sendTransaction(
                    name,
                    subName,
                    {
                        from: web3.eth.accounts[0],
                        value: web3.toWei(price),
                        gas: 3000000
                    }
                )
            } else {
                pr = secReg.buy.sendTransaction(
                    name,
                    {
                        from: web3.eth.accounts[0],
                        gas: 3000000,
                        value: web3.toWei(price)
                    }
                )
            }
            pr.then(function (result) {
                console.log(result)
                $('.container').html('<p> You have bought the name</p>')
            }).catch(function(error){
                console.log(error)
            })
        }
    }
    f = makeListener()
    $('#offering').html(offeringHTML)
    $('#' + eId).click(f)
}

var listAuctionOfferings = (offerArr) => {
    var getBuyNowButton = (recordCnt, timeLeft) => {
        var txt = 'Bid Now'
        if (timeLeft < 0){
            txt = 'Finalise'
        }
        return '<button id="bid-now-' + recordCnt + '" class="bid-now-button btn btn-primary btn-sm">' +txt+ '</button>';
    }


    var getOfferingHTML = (offering, cnt) => {
        var subName = offering[1]
        var name = offering[0]
        if (subName) {
            name = subName + '.' + name
        }
        var price = offering[3].toString()
        price = web3.fromWei(price, 'ether')
        var expiryTime = offering[4].toString()
        expiryTime = moment.unix(expiryTime)
        var now = moment();
        var timeLeft = expiryTime.diff(now, 'seconds')
        var nameDiv = wrapDiv(name, {classes: ['bid-now-name']})
        var priceDiv = wrapDiv(price + ' ETH', {classes: ['bid-now-price']})
        var offeringDiv;
        var timeDiv;
        if (timeLeft > 0) {
             timeDiv = wrapDiv(timeLeft + ' seconds', {classes: ['bid-now-time-list']})
             offeringDiv = wrapDiv(nameDiv + priceDiv + timeDiv, {classes: ['bid-now-offering']})
        } else {
            timeDiv = wrapDiv('Auction Complete', {classes: ['bid-now-time-list']})
            offeringDiv = wrapDiv(nameDiv + priceDiv + timeDiv, {classes: ['bid-now-offering']})
        }
        var button = getBuyNowButton(cnt, timeLeft)
        var buttonDiv = wrapDiv(button, {classes: ['bid-now-button-div']})
        var res = wrapDiv(offeringDiv + buttonDiv, {classes: ['bid-now-listing', 'row']})
        return res
    }

    var getOfferingHeader = () => {
        var headerDiv = '<h4> Auction Offerings </h4>'
        var headerHTML = wrapDiv(
            headerDiv,
            {
                id: 'bid-now-offerings-header',
                classes: ['offerings-header', 'row', 'text-center']
            }
        )
        return headerHTML;
    }

    contentHTML = [getOfferingHeader()]
    for(var i = 0; i < offerArr.length; i++) {
        var offering = offerArr[i]
        if (offering[2]){
            contentHTML.push(getOfferingHTML(offering, i))
        }
    }
    contentStr = contentHTML.join(' ')
    $('#auction-listing-container').html(contentStr)
    $('.bid-now-button').click(function(){
        console.log('here')
        var id = $(this).attr('id')
        id = id.replace('bid-now-', '')
        id = Number(id)
        if (id !== undefined) {
            document.location.href = '/bid/' + id
        }
    })
}

var populateSingleOffering = () => {
    var url = window.location.href
    url = URI(url)
    var record = url.path().replace('/buy/now/', '')
    record = Number(record)
    console.log(record)
    var wrapOne = (records) => {
        return populateRecord(records[0])
    }
    secReg.getListings(record, record+1, wrapOne)
}

var populateAuctionListings = () => {
    secReg.getAuctionListingCount().then(function(cnt){
        var c = Number(cnt.toString())
        secReg.getAuctionListings(0, c, listAuctionOfferings)
    })
}

var populateAuctionRecord = (record) => {
    console.log(record)
    var subName = record[1]
    var name = record[0]
    if (subName) {
        var name = subName + '.' + name
    }
    var eId = 'offering-button'
    var expiryTime = record[4].toString()
    expiryTime = moment.unix(expiryTime)
    var now = moment();
    var timeLeft = expiryTime.diff(now, 'seconds')
    var price = (record[3].toString())
    var price = web3.fromWei(price, 'ether')
    var nameHTML = '<p class="offering-name">' + name + '</p>'
    var priceHTML = '<p class="offering-price">' + price + ' ETH</p>'
    nameHTML = wrapDiv(nameHTML, {classes: ['offering-name-div']})
    priceHTML = wrapDiv(priceHTML, {classes: ['offering-price-div']})
    var inputPriceHTML = '<input  id="bid-input" type="text"' +
        '                            class="form-control" placeholder="your bid"' +
        '                            aria-describedby="basic-addon3">' +
        '                    <span class="input-group-addon" id="basic-addon3">.eth</span>';
    inputPriceHTML = wrapDiv(inputPriceHTML, {classes: ['input-group']})
    var buttonHTML = '<button id="' + eId + '" class="offering-buy-button btn btn-primary"> Bid! </button>'
    var isWinner = false;
    if (timeLeft < 0) {
        inputPriceHTML = ''
        var winner = record[5]
        if (winner == web3.eth.accounts[0]) {
            isWinner = true;
            buttonHTML = '<button id="' + eId + '" class="offering-buy-button btn btn-primary"> Finalise </button>'
        } else {
            buttonHTML = 'The auction is over folks';
        }
    }
    buttonHTML = wrapDiv(buttonHTML, {classes: ['offering-buy-button-div']})
    var offeringHTML = wrapDiv(
        nameHTML + priceHTML+ inputPriceHTML + buttonHTML,
        {classes: ['single-offering-container text-center row'], id: 'offering-'+name}
    )
    var makeListener = function() {
        return function () {
            name = name.trim()
            var pr = null
            var amount = $('#bid-input').val()
            if (subName) {
                name = name.replace(subName + '.', '')
            }
            if (!isWinner) {
                pr = secReg.secReg.bidDomain.sendTransaction(
                    name,
                    {
                        from: web3.eth.accounts[0],
                        gas: 3000000,
                        value: web3.toWei(amount)
                    }
                )
            } else {
                pr = secReg.secReg.finalize.sendTransaction(
                    name,
                    {
                        from: web3.eth.accounts[0],
                        gas: 3000000
                    }
                )
            }

            pr.then(function (result) {
                console.log(result)
                if (!isWinner) {
                    $('.container').html('<p> Your Bid Has been taken </p>')
                } else {
                    $('.container').html('<p> The ownership has been transferred </p>')
                }
            }).catch(function(error){
                console.log(error)
            })
        }
    }
    f = makeListener()
    $('#offering').html(offeringHTML)
    $('#' + eId).click(f)
}

var populateAuctionSingleOffering = () => {
    var url = window.location.href
    url = URI(url)
    var record = url.path().replace('/bid/', '')
    record = Number(record)
    var wrapAuctionOne = (records) => {
        var name = records[0][0]
        console.log(name);
        secReg.getBestBidder(name).then((addr) => {
            records[0].push(addr)
            return populateAuctionRecord(records[0])
        })
    }
    secReg.getAuctionListings(record, record+1, wrapAuctionOne)
}

$('#sell-switch').change(() => {
    var tp = $('#sell-switch').val()
    if (tp == 'Auction') {
        $('#buy-now-sell').css('display', 'none')
        $('#auction-sell').css('display', 'inline-block')
    }
    if (tp == 'Buy Now') {
        $('#auction-sell').css('display', 'none')
        $('#buy-now-sell').css('display', 'inline-block')
    }
})

$('#whois-real-button').click(() => {
    var domain = $('#whois-input-text').val()
    domain = domain + '.eth'
    ens.owner(namehash.hash(domain)).then(function(result) {
        $('#owner-output').html('<p>The owner is: ' + result + '</p>')
    })
})
