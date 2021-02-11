import {select, classNames, templates, settings} from '../settings.js';
import utils from '../utils.js';
import CartProduct from './CartProduct.js';
import appService from '../appService.js';



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
      thisCart.signalChanged();
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
    thisCart.hideOnClickOutside();
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

  signalChanged() {
    const thisCart = this;
    appService.signalChanged(thisCart.dom.subtotalPrice);
    thisCart.dom.totalPriceElems.forEach((e) => appService.signalChanged(e));      
  }
  hideOnClickOutside() {
    const thisCart = this;
    const outsideClickListener = event => {
      if (!thisCart.dom.wrapper.contains(event.target)) {
        thisCart.dom.wrapper.classList.remove(classNames.cart.wrapperActive);
      }
    };
    //if many of such elements (menues for example) than this function should go to appService
    //and listenner below would have to be removed each time the element becomes hidden, 
    //both in above outsideClickListener function and also in any other toggle action.
    document.addEventListener('click', outsideClickListener);
  }   
  
}

export default Cart;