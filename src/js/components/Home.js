import {templates} from '../settings.js';
import Carousel from './Carousel.js';

class Home {
  constructor(wrapper) {
    const thisHome = this;
    thisHome.dom = {};
    thisHome.dom.wrapper = wrapper; 
    thisHome.renderPage();
    thisHome.initCarousel();
  }

  renderPage() {
    const thisHome = this;
    const generatedHtml = templates.homePage();
    // console.log('generated Html', generatedHtml);
    thisHome.dom.wrapper.innerHTML = generatedHtml;
  }
  initCarousel() {
    const thisHome = this;
    thisHome.carousel = new Carousel();
  }
}

export default Home;