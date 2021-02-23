import { classNames, select, settings, templates } from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

class Booking {
  constructor(element) {
    const thisBooking = this;
    thisBooking.render(element);
    thisBooking.initWidgets();
    thisBooking.getData();
    thisBooking.initPreBooking();
  }

  getData() {
    const thisBooking = this;
    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
    const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);
    const params = {
      booking: [
        startDateParam,
        endDateParam,
      ],
      eventsCurrent: [
        settings.db.notRepeatParam,
        startDateParam,
        endDateParam,
      ],
      eventsRepeat: [
        settings.db.repeatParam,
        endDateParam,
      ],
    };
    // console.log('get data params', params);

    const urls = {
      booking:       settings.db.url + '/' + settings.db.booking 
                                     + '?' + params.booking.join('&'),
      eventsCurrent: settings.db.url + '/' + settings.db.event   
                                     + '?' + params.eventsCurrent.join('&'),
      eventsRepeat:  settings.db.url + '/' + settings.db.event   
                                     + '?' + params.eventsRepeat.join('&'),
    };
    // console.log('urls', urls);
    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])    
      .then(function(allResponses) {
        const bookingsResponse = allResponses[0];
        const eventsCurrentResponse = allResponses[1];
        const eventsRepeatResponse = allResponses[2];
        return Promise.all([
          bookingsResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]) ;
      })
      .then(function([bookings, eventsCurrent, eventsRepeat]) {
        // console.log(bookings);
        // console.log(eventsCurrent);
        // console.log(eventsRepeat);
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
      
  }

  parseData(bookings, eventsCurrent, eventsRepeat) {
    const thisBooking = this;
    thisBooking.booked = {};  
    
    for(let item of eventsCurrent) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }
    for(let item of bookings) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }
    
    for(let item of eventsRepeat) {
      if (item.repeat == 'daily') {
        const minDate = thisBooking.datePicker.minDate;
        const maxDate = thisBooking.datePicker.maxDate;
        
        for (let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)) {
         
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }
      }     
    } 
    
    console.log('thisBooking.booked', thisBooking.booked);
    console.log('datePickerValue', thisBooking.datePicker.value);
    thisBooking.upDateDOM();
    thisBooking.upDateSliderStyle(thisBooking.datePicker.value);
  }

  makeBooked(date, hour, duration, table) {
    const thisBooking = this;
    if (typeof thisBooking.booked[date] == 'undefined') {
      thisBooking.booked[date] = {};
    }
    const startHour = utils.hourToNumber(hour);
    for (let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5) {
      if (typeof thisBooking.booked[date][hourBlock] == 'undefined') {
        thisBooking.booked[date][hourBlock] = [];
      }
      thisBooking.booked[date][hourBlock].push(table);
    }
    
  }

  upDateDOM() {
    const thisBooking = this;
    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    let allAvailable = false;
    if (
      typeof thisBooking.booked[thisBooking.date] == 'undefined'
      ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
    ) {
      allAvailable = true;
    }

    for (let table of thisBooking.dom.tables) {
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if (!isNaN(tableId)) {
        tableId = parseInt(tableId);
      }
      if (
        !allAvailable
        &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
      ) {
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }
  }

  render(element) {
    const thisBooking = this;
    const generatedHtml = templates.bookingWidget();
    thisBooking.dom = {};
    thisBooking.dom.wrapper = element;
    thisBooking.dom.wrapper.innerHTML = generatedHtml;
    thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);
    thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);   
    thisBooking.dom.starters = thisBooking.dom.wrapper.querySelectorAll(select.booking.checkboxes);
    thisBooking.dom.phone = thisBooking.dom.wrapper.querySelector(select.booking.phone);
    thisBooking.dom.address = thisBooking.dom.wrapper.querySelector(select.booking.address);
    thisBooking.dom.btn = thisBooking.dom.wrapper.querySelector(select.booking.btn);
    thisBooking.dom.floor = thisBooking.dom.wrapper.querySelector(select.booking.floor);

  }

  initWidgets() {
    const thisBooking = this;

    thisBooking.peopleAmountWidget = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmountWidget = new AmountWidget(thisBooking.dom.hoursAmount);
    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);

    thisBooking.dom.wrapper.addEventListener('updated', (event) => {
      thisBooking.upDateDOM();
      thisBooking.resetBooking();
      if (event.target == thisBooking.datePicker.dom.wrapper) {
        thisBooking.upDateSliderStyle(thisBooking.datePicker.value);
      }      
    });
  }
  upDateSliderStyle(date) {
    const thisBooking = this;
    const slideElem = document.querySelector(select.widgets.hourPicker.slider);
    
    slideElem.setAttribute('style', `background: linear-gradient(to right, ${thisBooking.getColorSpec(date)})`);
  }
  getColorSpec(date) {
    const thisBooking = this; 
    const getHourColor = (hourBookings) => {
      if (typeof hourBookings == 'undefined') {
        return settings.hourPicker.colors.free;
      }
      if (hourBookings.length  == settings.booking.maxTables) {
        return settings.hourPicker.colors.busy;
      }
      if (hourBookings.length == settings.booking.maxTables - 1) {
        return settings.hourPicker.colors.warn;
      }
      return settings.hourPicker.colors.free;
    };
    
    const close = settings.hours.close;
    const open = settings.hours.open;
    const timeToPercent = (hour) => {      
      const hourSpan = 100 / (close - open);      
      return `${(hour - open) * hourSpan}%`;
    };

    
    const dayBookings = thisBooking.booked[date];
    console.log('date', date);
    console.log('dayBookings', dayBookings);
    if ( typeof dayBookings == 'undefined') {
      return `${settings.hourPicker.colors.free} 0% 100%`;
    }

    let currentColor = '';
    const colorDinamics = [];

    for (let hour = open; hour < close; hour += 0.5) {
      const hourColor = getHourColor(dayBookings[hour]);
      if (hourColor != currentColor) {              
        colorDinamics.push({        
          color: hourColor,
          startPoint: timeToPercent(hour),
          endPoint: timeToPercent(hour + 0.5)
        });
        currentColor = hourColor;
      }
      else {
        colorDinamics[colorDinamics.length - 1].endPoint = timeToPercent(hour + 0.5);
      }
    }

    return colorDinamics
      .map((item) => `${item.color} ${item.startPoint} ${item.endPoint}`)
      .join(', ');
  }

  initPreBooking() {
    const thisBooking = this;

    thisBooking.tablePreBooked = null;

    thisBooking.dom.floor.addEventListener('click', (event) => {
      const tableElement = event.target;
      let tableAvailable = !tableElement.classList.contains('booked');
      let tableId = tableElement.getAttribute(settings.booking.tableIdAttribute);
      // No action if table  is not available
      if (tableAvailable) {       
        if (isNaN(tableId) || tableId == null || tableId == thisBooking.tablePreBooked) {
          thisBooking.resetBooking();
        } else {
          tableId = parseInt(tableId);
          thisBooking.tablePreBooked = tableId;
          thisBooking.dom.tablePreBooked = tableElement;
          thisBooking.showPreBooked();       
        }         
      }
    });

    thisBooking.dom.btn.addEventListener('click', (event) => thisBooking.sendBooking(event));
  
  }
  resetBooking() {
    const thisBooking = this;
    thisBooking.tablePreBooked = null;
    this.showPreBooked();
  }

  showPreBooked() {
    const thisBooking = this;
    thisBooking.dom.tables.forEach((table) => {
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if (!isNaN(tableId)) {
        tableId = parseInt(tableId);
      }
      table.classList.toggle(classNames.booking.tablePreBooked, tableId === thisBooking.tablePreBooked);
      
    });
  }
  sendBooking(event) {
    event.preventDefault();    
    const thisBooking = this;

    const url = settings.db.url + '/' + settings.db.booking;
    const starters = [];
    thisBooking.dom.starters.forEach((checkbox) => {
      if (checkbox.checked) {
        starters.push(checkbox.value);
      }
    });

    const payload = {
      date: thisBooking.date,
      hour: thisBooking.hourPicker.value,
      table: thisBooking.tablePreBooked,
      duration: thisBooking.hoursAmountWidget.value,
      ppl: thisBooking.peopleAmountWidget.value,
      starters,
      phone: thisBooking.dom.phone.value,
      address: thisBooking.dom.address.value,
    };
    if (!payload.table) {
      alert('You must pick a table');
      return;
    }
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };
    fetch(url, options)
      .then((response) => response.json())
      .then((booking) => {        
        thisBooking.makeBooked(booking.date, booking.hour, booking.duration, booking.table);
        thisBooking.upDateDOM();
        thisBooking.upDateSliderStyle();
        thisBooking.resetBooking();
      });
  }
}

export default Booking;