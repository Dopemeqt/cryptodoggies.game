var CryptoDoggies = artifacts.require('CryptoDoggies');

contract('CryptoDoggies', function(accounts) {
    var helpfulFunctions = require('./utils/CryptoDoggiesUtils')(CryptoDoggies, accounts);
    var hfn = Object.keys(helpfulFunctions);
    for (var i = 0; i < hfn.length; i++ ) {
        global[hfn[i]] = helpfulFunctions[hfn[i]];
    }

    checkTotalSupply(0);

    for (x = 0; x < 100; x++) {
        checkDoggyCreation('Doggy' + x);
    }

    checkTotalSupply(100);
});