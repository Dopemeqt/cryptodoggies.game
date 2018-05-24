/* Main Object to manage Contract interactions */
var App = {
  contracts: {},
  CryptoDoggiesAddress: '0x46f85249d761A717e279A670edB8aa599392772D',

  init() {
    return App.initWeb3();
  },
  
  initWeb3() {
    if (typeof web3 != 'undefined') {
      web3 = new Web3(web3.currentProvider);
    }else {
      web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
    }
    return App.initContract();
  },

  initContract(){
    $.getJSON('CryptoDoggies.json', (data) => {
      const CryptoDoggiesArtifact = data;
      App.contracts.CryptoDoggies = TruffleContract(CryptoDoggiesArtifact);
      App.contracts.CryptoDoggies.setProvider(web3.currentProvider);
      return App.loadDoggies();
    });
    return App.bindEvents();
  },

  loadDoggies() {
    web3.eth.getAccounts(function(err, accounts) {
      if(err != null) {
        console.error("An error occured: " + err);
      }else if (accounts.length == 0) {
        console.log("User is not logged into MetaMask");
      }else {
        $('#card-row').children().remove();
      }
    });

    var address = web3.eth.defaultAccount;
    let contractInstance = App.contracts.CryptoDoggies.at(App.CryptoDoggiesAddress);
    return totalSupply = contractInstance.totalSupply().then((supply) => {
      for (var i=0; i < supply; i++) {
        App.getDoggyDetails(i, address);
      }
    }).catch((err) => {
      console.log(err.message);
    })
  },

  getDoggyDetails(doggyId, localAddress) {
    let contractInstance = App.contracts.CryptoDoggies.at(App.CryptoDoggiesAddress);
    return contractInstance.getToken(doggyId).then((doggy) => {
      var doggyJson = {
        'doggyId'           : doggyId,
        'doggyName'         : doggy[0],
        'doggyDna'          : doggy[1],
        'doggyPrice'        : web3.fromWei(doggy[2]).toNumber(),
        'doggyNextPrice'    : web3.fromWei(doggy[3]).toNumber(),
        'ownerAddress'      : doggy[4]
      };
      if (doggyJson.ownerAddress != localAddress) {
        loadDoggy(
          doggyJson.doggyId,
          doggyJson.doggyName,
          doggyJson.doggyDna,
          doggyJson.doggyPrice,
          doggyJson.doggyNextPrice,
          doggyJson.ownerAddress,
          false
        );
      }else{
        loadDoggy(
          doggyJson.doggyId,
          doggyJson.doggyName,
          doggyJson.doggyDna,
          doggyJson.doggyPrice,
          doggyJson.doggyNextPrice,
          doggyJson.ownerAddress,
          true
        );
      }
    }).catch((err) => {
      console.log(err.message);
    });
  },

  handlePurchase(event) {
    event.preventDefault();

    var doggyId = parseInt($(event.target.elements).closest('.btn-buy').data('id'));

    web3.eth.getAccounts((error, accounts) => {
      if (error) {
        console.log(error);
      }
      var account = accounts[0];

      let contractInstance = App.contracts.CryptoDoggies.at(App.CryptoDoggiesAddress);
      contractInstance.priceOf(doggyId).then((price) => {
        return contractInstance.purchase(doggyId, {
          from: account,
          value: price,
        }).then(result => App.loadDoggies()).catch((err) => {
          console.log(err.message);
        });
      });
    });
  },

  bindEvents() {
    $(document).on('submit', 'form.doggy-purchase', App.handlePurchase);
  },

};

/* Generates a Doggy image based on Doggy DNA */
function generateDoggyImage(doggyId, size, canvas){
  size = size || 10;
  var data = doggyidparser(doggyId);
  var canvas = document.getElementById(canvas);
  canvas.width = size * data.length;
  canvas.height = size * data[1].length;
  var ctx = canvas.getContext("2d");

  for(var i = 0; i < data.length; i++){
      for(var j = 0; j < data[i].length; j++){
          var color = data[i][j];
          if(color){
          ctx.fillStyle = color;
          ctx.fillRect(i * size, j * size, size, size);
          }
      }
  }
  return canvas.toDataURL();
}

/* Load Doggies based on input data */
function loadDoggy(doggyId, doggyName, doggyDna, doggyPrice, doggyNextPrice, ownerAddress, locallyOwned) {
  var cardRow = $('#card-row');
  var cardTemplate = $('#card-template');

  if(locallyOwned) {
    cardTemplate.find('btn-buy').attr('disabled', true);
  }
  else{
    cardTemplate.find('btn-buy').removeAttr('disabled');
  }

  cardTemplate.find('.doggy-name').text(doggyName);
  cardTemplate.find('.doggy-canvas').attr('id', "doggy-canvas-" + doggyId);
  cardTemplate.find('.doggy-dna').text(doggyDna);
  cardTemplate.find('.doggy-owner').text(ownerAddress);
  cardTemplate.find('.doggy-name').attr("href", "https://etherscan.io/address/" + ownerAddress);
  cardTemplate.find('.btn-buy').attr('data-id', doggyId);
  cardTemplate.find('.doggy-price').text(parseFloat(doggyPrice).toFixed(4));
  cardTemplate.find('.doggy-next-price').text(parseFloat(doggyNextPrice).toFixed(4));

  cardRow.append(cardTemplate.html());
  generateDoggyImage(doggyDna, 3, "doggy-canvas-" + doggyId);
}

/* Called When Document has loaded */
jQuery(document).ready(
  function ($) {
    App.init();
  }
);
