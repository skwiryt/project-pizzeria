import utils from '../utils.js';
import {select, templates, classNames, settings} from '../settings.js';
import AmountWidget from './AmountWidget.js';
import appService from '../appService.js';


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
    thisProduct.amountWidget.dom.wrapper.addEventListener('updated', () => { 
      thisProduct.processOrder();
      appService.signalChanged(thisProduct.amountWidget.dom.input);
    }); 
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
    //app.cart.add(thisProduct.prepareCartProduct());    
    const event = new CustomEvent('add-to-cart', {
      bubbles: true,
      detail: {
        product: thisProduct.prepareCartProduct(),
      }
    });
    thisProduct.dom.wrapper.dispatchEvent(event);
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
export default Product;