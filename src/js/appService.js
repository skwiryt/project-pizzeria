const appService = {
  signalChanged: (element) => {
    element.classList.toggle('just-changed');
    setTimeout(() => element.classList.toggle('just-changed'), 40);
  },  
};
export default appService;