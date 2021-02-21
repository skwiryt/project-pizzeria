import {settings, select, classNames} from './settings.js';
import Product from './components/Product.js';
import Cart from './components/Cart.js';
import Booking from './components/Booking.js';
import Home from './components/Home.js';


const app = {

  initPages: function() {
    const thisApp = this;
    thisApp.pages = document.querySelector(select.containerOf.pages).children;
    thisApp.navLinks = document.querySelectorAll(select.nav.links);
    thisApp.navBoxes = document.querySelectorAll(select.nav.boxes);
    thisApp.navItems = [...thisApp.navLinks, ...thisApp.navBoxes];
    console.log('navItems', thisApp.navBoxes);
    const idFromHash = window.location.hash.replace('#/', '');

    let pageMatchinHash = thisApp.pages[0];
    for (let page of thisApp.pages) {
      if (page.id == idFromHash) {
        pageMatchinHash = page;
        break;
      } 
    }
    thisApp.activatePage(pageMatchinHash.id);
    for (let link of thisApp.navItems) {
      link.addEventListener('click', function(event) {
        const clickedElement = this;
        event.preventDefault();
        console.log('clickedElement', this);
        /* get page id form href attribute */        
        const id = clickedElement.getAttribute('href').replace('#', '');
        thisApp.activatePage(id);

        /* change URL hash */
        window.location.hash = '#/' + id;

      });
    }   
  },
  activatePage: function(pageId) {
    const thisApp = this;

    /* add class "active" to matching pages, remove from non-matching */
    for (let page of thisApp.pages) {      
      page.classList.toggle(classNames.pages.active, page.id == pageId);      
    }

    /* add class "active" to matching links, remove from non-matching */
    for (let link of thisApp.navLinks) {      
      link.classList.toggle(
        classNames.nav.active, 
        link.getAttribute('href') == '#' + pageId
      );      
    }

  },

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
    thisApp.initHome();
    thisApp.initPages();
    thisApp.initData();
    thisApp.initCart();
    thisApp.initBooking();
    
  },

  initHome: function() {
    const thisApp = this;

    const homeElem = document.querySelector(select.containerOf.home);
    thisApp.home = new Home(homeElem);
  },

  initCart: function() {
    const thisApp = this;

    const cartElem = document.querySelector(select.containerOf.cart);
    thisApp.cart = new Cart(cartElem);
    thisApp.productList = document.querySelector(select.containerOf.menu);
    thisApp.productList.addEventListener('add-to-cart', (event) => {
      thisApp.cart.add(event.detail.product);
    });
  },

  initBooking: function() {
    const thisApp = this;
    const bookingWrapper = document.querySelector(select.containerOf.booking);
    thisApp.booking = new Booking(bookingWrapper);
  }
};

app.init();

