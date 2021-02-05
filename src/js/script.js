/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  'use strict';

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
      cartProduct: '#template-cart-product',
    },
    containerOf: {
      menu: '#product-list',
      cart: '#cart',
    },
    all: {
      menuProducts: '#product-list > .product',
      menuProductsActive: '#product-list > .product.active',
      formInputs: 'input, select',
    },
    menuProduct: {
      clickable: '.product__header',
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
    },
    widgets: {
      amount: {
        input: 'input.amount',
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
    cart: {
      productList: '.cart__order-summary',
      toggleTrigger: '.cart__summary',
      totalNumber: '.cart__total-number',
      totalPrice: '.cart__total-price strong, .cart__order-total .cart__order-price-sum strong',
      subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
      deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
      form: '.cart__order',
      formSubmit: '.cart__order [type="submit"]',
      phone: '[name="phone"]',
      address: '[name="address"]',
    },
    cartProduct: {
      amountWidget: '.widget-amount',
      price: '.cart__product-price',
      edit: '[href="#edit"]',
      remove: '[href="#remove"]',
    },
  };

  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
    cart: {
      wrapperActive: 'active',
    },
  };

  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 9,
    },
    cart: {
      defaultDeliveryFee: 20,
      inputLength: 10,
    },
    db: {
      url: '//localhost:3131',
      products: 'products',
      order: 'orders',
    },
  };

  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
    cartProduct: Handlebars.compile(document.querySelector(select.templateOf.cartProduct).innerHTML),
  };

  class Product {
    constructor(id, data) {
      const thisProduct = this;
      thisProduct.id = id;
      thisProduct.data = data;
      thisProduct.dom = {};
      thisProduct.renderInMenu();
      thisProduct.getElements();
      thisProduct.initAccordion();
      thisProduct.initOrderForm();
      thisProduct.initAmountWidget();
      thisProduct.processOrder();
      console.log('product id', thisProduct.id);
    }

    renderInMenu() {
      const thisProduct = this;
      
      /* generate HTML based on template */
      const generatedHTML = templates.menuProduct(thisProduct.data);
      /* create element using utils.createElementFromHTML */
      thisProduct.dom.wrapper = utils.createDOMFromHTML(generatedHTML);
      /* find menu container */
      const menuContainer = document.querySelector(select.containerOf.menu);
      /* add element to menu */
      menuContainer.appendChild(thisProduct.dom.wrapper);

    }

    getElements(){
      const thisProduct = this;
    
      thisProduct.dom.accordionTrigger = thisProduct.dom.wrapper.querySelector(select.menuProduct.clickable);
      thisProduct.dom.form = thisProduct.dom.wrapper.querySelector(select.menuProduct.form);
      thisProduct.dom.formInputs = thisProduct.dom.form.querySelectorAll(select.all.formInputs);
      thisProduct.dom.cartButton = thisProduct.dom.wrapper.querySelector(select.menuProduct.cartButton);
      thisProduct.dom.priceElem = thisProduct.dom.wrapper.querySelector(select.menuProduct.priceElem);    
      thisProduct.dom.imageWrapper = thisProduct.dom.wrapper.querySelector(select.menuProduct.imageWrapper);  
      thisProduct.dom.amountWidgetElem = thisProduct.dom.wrapper.querySelector(select.menuProduct.amountWidget);
    }
    initAmountWidget() {
      const thisProduct = this;
      thisProduct.amountWidget = new AmountWidget(thisProduct.dom.amountWidgetElem);
      thisProduct.amountWidget.element.addEventListener('updated', () => { thisProduct.processOrder();}); 
    }

    initAccordion() {
      const thisProduct = this;

      /* START: add event listener to clickable trigger on event click */
      thisProduct.dom.accordionTrigger.addEventListener('click', function(event) {
        /* prevent default action for event */
        event.preventDefault();
        /* find active product (product that has active class) */
        const activeProduct = document.querySelector(`${select.all.menuProducts}.${classNames.menuProduct.wrapperActive}`);
        /* if there is active product and it's not thisProduct.dom.wrapper, remove class active from it */
        if ( activeProduct != null && activeProduct !== thisProduct.dom.wrapper ) {
          activeProduct.classList.remove(classNames.menuProduct.wrapperActive);
        }
        /* toggle active class on thisProduct.dom.wrapper */
        thisProduct.dom.wrapper.classList.toggle(classNames.menuProduct.wrapperActive);
        
      });       
     
    }

    initOrderForm() {
      const thisProduct = this;

      thisProduct.dom.form.addEventListener('submit', function(event){
        event.preventDefault();
        thisProduct.processOrder();
      });
      
      for(let input of thisProduct.dom.formInputs){
        input.addEventListener('change', function(){
          thisProduct.processOrder();
        });
      }
      
      thisProduct.dom.cartButton.addEventListener('click', function(event){
        event.preventDefault();
        thisProduct.processOrder();
        thisProduct.addToCart();
      });
    }

    processOrder() {
      const thisProduct = this;
      const formData = utils.serializeFormToObject(thisProduct.dom.form);

      // set price to default price
      let price = thisProduct.data.price;

      // for every category (param)...
      for(let paramId in thisProduct.data.params) {
      // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
        const param = thisProduct.data.params[paramId];
        // for every option in this category
        for(let optionId in param.options) {
        // determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
          const option = param.options[optionId];
          
          const optionSelected = formData[paramId].includes(optionId);

          if ( option.default && !optionSelected) {
            price -= option.price;
          }
          if ( !option.default && optionSelected) {
            price += option.price;
          }
          //pictures that are specific for an option and not general for the product
          let specialPicture = thisProduct.dom.imageWrapper.querySelector(`[class~="${paramId}-${optionId}"]`);
          
          if ( specialPicture && optionSelected ) {
            specialPicture.classList.add(classNames.menuProduct.imageVisible);
          }
          else if ( specialPicture ) {
            specialPicture.classList.remove(classNames.menuProduct.imageVisible);
          }
          
        }
      }
      

      // update calculated price in the HTML
      thisProduct.priceSingle = price;
      price *= thisProduct.amountWidget.value;
      thisProduct.dom.priceElem.innerHTML = price;

    }

    addToCart() {
      const thisProduct = this;
      app.cart.add(thisProduct.prepareCartProduct());
      thisProduct.amountWidget.setValue(settings.amountWidget.defaultValue);
    }

    prepareCartProduct() {
      const thisProduct = this;
      const productSummary = {};
      productSummary.params = thisProduct.prepareCartProductParams();
      productSummary.id = thisProduct.id;
      productSummary.name = thisProduct.data.name;
      productSummary.priceSingle = thisProduct.priceSingle;
      productSummary.price = thisProduct.priceSingle * thisProduct.amountWidget.value;
      productSummary.amount = thisProduct.amountWidget.value;
      return productSummary;
    }

    prepareCartProductParams() {
      const thisProduct = this;
      const formData = utils.serializeFormToObject(thisProduct.dom.form);  

      // set empty params object
      const chosenParams = {};
      
      // for every category (param)...
      for(let paramId in thisProduct.data.params) {
      // determine param value,
        const param = thisProduct.data.params[paramId];
        chosenParams[paramId] = { 
          label: param.label,
          options: {},
        };
        // for every option in this category
        for(let optionId in param.options) {
        // determine option value
          const option = param.options[optionId];          
          const optionSelected = formData[paramId].includes(optionId);
          if (optionSelected) {
            chosenParams[paramId].options[optionId] = option.label;
          }   
        }
      }
      return chosenParams;      
    }
  }
  
  class AmountWidget {

    constructor(element) {
      const thisWidget = this;
      const amount = element.querySelector(select.widgets.amount.input).value;
      thisWidget.getElements(element);
      thisWidget.setValue(amount ? amount : settings.amountWidget.defaultValue);
      thisWidget.initActions();
    }
    getElements(element) {
      const thisWidget = this;
      thisWidget.element = element;
      thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input);
      thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
      thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease);
    }
    setValue(value) {
      const thisWidget = this;
      const newValue = parseInt(value);

      if (
        (newValue !== thisWidget.value) 
        && !isNaN(newValue)
        && newValue >= settings.amountWidget.defaultMin
        && newValue <= settings.amountWidget.defaultMax
      ) {
        thisWidget.value = newValue;
        thisWidget.announce();
      }
      thisWidget.input.value = thisWidget.value;
    }
    initActions() {
      const thisWidget = this;
      thisWidget.input.addEventListener('change', () => { 
        thisWidget.setValue(thisWidget.input.value);
      });
      thisWidget.linkDecrease.addEventListener('click', (event) => {
        event.preventDefault();
        thisWidget.setValue(thisWidget.value - 1);
      });
      thisWidget.linkIncrease.addEventListener('click', (event) => {
        event.preventDefault();
        thisWidget.setValue(thisWidget.value + 1);
      });      
    }

    announce() {
      const thisWidget = this;
      const event = new Event('updated', { bubbles: true });
      thisWidget.element.dispatchEvent(event);
    }
  }
  class Cart {
    constructor(element) {
      const thisCart = this;

      thisCart.products = [];
      thisCart.getElements(element);
      thisCart.initActions();
    }

    getElements(element) {
      const thisCart = this;
      thisCart.dom = {};
      thisCart.dom.wrapper = element;
      thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
      thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);
      thisCart.dom.deliveryFee = thisCart.dom.wrapper.querySelector(select.cart.deliveryFee);
      thisCart.dom.subtotalPrice = thisCart.dom.wrapper.querySelector(select.cart.subtotalPrice);
      thisCart.dom.totalPriceElems = thisCart.dom.wrapper.querySelectorAll(select.cart.totalPrice);
      thisCart.dom.totalNumber = thisCart.dom.wrapper.querySelector(select.cart.totalNumber);
      thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form); 
      thisCart.dom.address = thisCart.dom.form.querySelector(select.cart.address);
      thisCart.dom.phone = thisCart.dom.form.querySelector(select.cart.phone);
    }

    initActions() {
      const thisCart = this;
      thisCart.dom.toggleTrigger.addEventListener('click', () => {
        thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
      });
      thisCart.dom.productList.addEventListener('updated', () => {
        thisCart.update();
      });
      thisCart.dom.productList.addEventListener('remove', (event) => {
        thisCart.remove(event.detail.cartProduct);
      });
      thisCart.dom.form.addEventListener('submit', (event) => {
        event.preventDefault();
        thisCart.sendOrder();
      });
      thisCart.dom.address.addEventListener('change', () => {
        thisCart.formValidation();
      });
      thisCart.dom.phone.addEventListener('change', () => {
        thisCart.formValidation();
      });
    }

    add(menuProduct) {
      const thisCart = this;
      /* generate HTML based on template */
      const generatedHTML = templates.cartProduct(menuProduct);
      /* create element using utils.createElementFromHTML */
      const generatedDom = utils.createDOMFromHTML(generatedHTML);
      thisCart.dom.productList.appendChild(generatedDom);
      thisCart.products.push(new CartProduct(menuProduct, generatedDom));
      thisCart.update();
      console.log('products', thisCart.products);
    }

    update() {
      const thisCart = this;
      const deliveryFee = settings.cart.defaultDeliveryFee;
      thisCart.totalNumber = 0;
      thisCart.subtotalPrice = 0;
      thisCart.products.forEach((p) => {
        thisCart.totalNumber += p.amount;
        thisCart.subtotalPrice += p.price;
      });
      thisCart.totalPrice = thisCart.totalNumber == 0 ? 0 : deliveryFee + thisCart.subtotalPrice;
      thisCart.dom.deliveryFee.innerHTML = thisCart.totalNumber == 0 ? 0 : deliveryFee;
      thisCart.dom.subtotalPrice.innerHTML = thisCart.subtotalPrice;
      thisCart.dom.totalPriceElems.forEach((e) => e.innerHTML = thisCart.totalPrice);
      thisCart.dom.totalNumber.innerHTML = thisCart.totalNumber;
    }

    remove(cartProduct) {
      const thisCart = this;
      const productId = cartProduct.id;
      thisCart.products = thisCart.products.filter((p) => p.id != productId);
      cartProduct.dom.wrapper.remove();
      thisCart.update();
      console.log('new products', thisCart.products);
    }

    sendOrder() {
      const thisCart = this;
      const url = settings.db.url + '/' + settings.db.order;
      const payload = {};
      payload.address = thisCart.dom.address.value;
      payload.phone = thisCart.dom.phone.value;
      payload.totalPrice = thisCart.totalPrice;
      payload.subtotalPrice = thisCart.subtotalPrice;
      payload.totalNumber = thisCart.totalNumber;
      payload.deliveryFee = settings.cart.defaultDeliveryFee;
      payload.products = [];
      thisCart.products.forEach((p) => payload.products.push(p.getData()));
      console.log('payload', payload);

      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      };
      if (thisCart.formValidation()) {
        fetch(url, options)
          .then((response) => response.json())
          .then((parsedResponse) => { 
            console.log('parsed response', parsedResponse);
            thisCart.products.forEach((p) => p.remove());
            thisCart.clearForm();
          });
      }
      else {
        console.log('not valid order');
      }
    }
    clearForm() {
      const thisCart = this;
      thisCart.dom.address.value = '';
      thisCart.dom.phone.value = '';
    }

    formValidation() {
      const thisCart = this;
      let valid = true;
      if (thisCart.dom.address.value.length >= settings.cart.inputLength) {
        valid = valid && true;
        thisCart.dom.address.classList.remove('error');
      }
      else {
        valid = false;
        thisCart.dom.address.classList.add('error');
      }
      if (thisCart.dom.phone.value.length >= settings.cart.inputLength) {
        valid = valid && true;
        thisCart.dom.phone.classList.remove('error');
      }
      else {
        valid = false;
        thisCart.dom.phone.classList.add('error');
      }
      if (thisCart.subtotalPrice > 0) {
        valid = valid && true;
      }
      else {
        valid = false;
      }
      return valid;
    }
  }
  class CartProduct {
    constructor(menuProduct, element) {
      const thisCartProduct = this;
      thisCartProduct.id = menuProduct.id;
      thisCartProduct.name = menuProduct.name;
      thisCartProduct.price = menuProduct.price;
      thisCartProduct.priceSingle = menuProduct.priceSingle;
      thisCartProduct.amount = menuProduct.amount;
      thisCartProduct.params = menuProduct.params;
      thisCartProduct.getElements(element);
      thisCartProduct.initAmountWidget();
      thisCartProduct.initActions();   
    }
    getElements(element) {
      const thisCartProduct = this;
      thisCartProduct.dom = {};
      thisCartProduct.dom.wrapper = element;
      thisCartProduct.dom.amountWidgetElem = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.amountWidget);
      thisCartProduct.dom.price = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.price);
      thisCartProduct.dom.edit = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.edit);      
      thisCartProduct.dom.remove = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.remove);
    }

    initActions() {
      const thisCartProduct = this;
      thisCartProduct.dom.edit.addEventListener('click', (event) => {
        event.preventDefault();
      });
      thisCartProduct.dom.remove.addEventListener('click', (event) => {
        event.preventDefault();
        thisCartProduct.remove();
      });
    }
    initAmountWidget() {
      const thisCartProduct = this;
      thisCartProduct.amountWidget = new AmountWidget(thisCartProduct.dom.amountWidgetElem);
      thisCartProduct.amountWidget.element.addEventListener('updated', () => { 
        thisCartProduct.amount = thisCartProduct.amountWidget.value;
        thisCartProduct.price = thisCartProduct.priceSingle * thisCartProduct.amountWidget.value;
        thisCartProduct.dom.price.textContent = thisCartProduct.price;        
      }); 
    }

    remove() {
      const thisCartProduct = this;
      const event = new CustomEvent('remove', { 
        bubbles: true,
        detail: {
          cartProduct: thisCartProduct,
        }
      });
      thisCartProduct.dom.wrapper.dispatchEvent(event);
      console.log('remove event', event);
    }

    getData() {
      const thisCartProduct = this;
      const data = {};
      data.id = thisCartProduct.id;
      data.amount = thisCartProduct.amountWidget.value;
      data.price = thisCartProduct.price;
      data.priceSingle = thisCartProduct.priceSingle;
      data.name = thisCartProduct.name;
      data.params = thisCartProduct.params;
      return data;
    }

  }
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
    }
  };

  app.init();
}
