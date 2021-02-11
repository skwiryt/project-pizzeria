import {select,settings} from '../settings.js';
import appService from '../appService.js';

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
    appService.signalChanged(thisWidget.input);
  }
}
export default AmountWidget;