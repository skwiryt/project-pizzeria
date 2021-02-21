//import { tns } from '../../node_modules/tiny-slider/src/tiny-slider';

class Carousel {
  constructor() {
    const thisCarousel = this;
    // thisCarousel.render(element);
    thisCarousel.initPlugin();
  }

  // render(element) {
  // save element ref to this obj
  // }

  initPlugin() {    
    // eslint-disable-next-line no-undef
    let slider = tns({
      container: '.tns-carousel',
      items: 1,
      slideBy: 1,
      autoplay: true,
      autoplayTimeout: 3000,
      autoplayPosition: 'bottom',
      navContainer: '.carousel__nav-container',      
      autoplayHoverPause: true,
      controls: false,
    });

    slider.play();
  }
}

export default Carousel;