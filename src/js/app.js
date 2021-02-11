import {settings, select} from './settings.js';
import Product from './components/Product.js';
import Cart from './components/Cart.js';


const app = {
  initMenu: function() {
    const thisApp = this;
    
    for(let productData in thisApp.data.products) {
      new Product(thisApp.data.products[productData].id, thisApp.data.products[productData]);
    }
  }, 

  initData: function() {
    const thisApp = this;
    const url = settings.db.url + '/' + settings.db.products;
    thisApp.data = {};
    fetch(url)
      .then((rawResponse) => rawResponse.json())
      .then((parsedResponse) => {
        console.log('parsed Resposne', parsedResponse);
        thisApp.data.products = parsedResponse;
        console.log('this app data', thisApp.data);
        thisApp.initMenu();
      });    
  },
  
  init: function() {
    const thisApp = this;
    console.log('*** App starting ***');

    thisApp.initData();
    thisApp.initCart(); 
  },

  initCart: function() {
    const thisApp = this;

    const cartElem = document.querySelector(select.containerOf.cart);
    thisApp.cart = new Cart(cartElem);
    thisApp.productList = document.querySelector(select.containerOf.menu);
    thisApp.productList.addEventListener('add-to-cart', (event) => {
      thisApp.cart.add(event.detail.product);
    });
  }
};

app.init();

