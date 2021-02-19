import appService from '../appService.js';
import {select} from '../settings.js';
import AmountWidget from './AmountWidget.js';

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
    thisCartProduct.amountWidget = new AmountWidget(thisCartProduct.dom.amountWidgetElem, thisCartProduct.amount);
    thisCartProduct.amountWidget.dom.wrapper.addEventListener('updated', () => { 
      thisCartProduct.amount = thisCartProduct.amountWidget.value;
      thisCartProduct.price = thisCartProduct.priceSingle * thisCartProduct.amountWidget.value;
      thisCartProduct.dom.price.textContent = thisCartProduct.price; 
      appService.signalChanged(thisCartProduct.dom.price);      
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

export default CartProduct;
