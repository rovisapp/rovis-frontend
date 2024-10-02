import { store } from "../store/init.js";

class StopListPaginate extends HTMLElement {
  constructor() {
    super();
    this.unsubscribe = null;
  }

  connectedCallback() {
    this.render();
    this.subscribe();
  }

  disconnectedCallback() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  bindEvents() {
    

    this.querySelectorAll('a').forEach(anchor => {
        anchor.addEventListener('click', (event)=> {
            store.dispatch({
                type: "UPDATED_SELECTEDSTOP",
                payload: {
                  value: event.target.getAttribute('data-idx'),
                },
              });
            //   console.log(store.state);
        });
       
    });
  }

  render() {
    
    const state = store.getState();
    const stopSelected = state.stopSelected; // Adjust according to where you get the selected stop value
    if (state.stops.length <= 0) {
      return;
    }
    console.log("rendering StopListPaginate");

    let poipaginationhtml = `
  <div style="display: flex; flex-wrap: wrap;" class="justify-content-center">
    <a style="padding:0.25rem" href="#" class="${
      stopSelected === "-1" ? "bg-primary text-white" : ""
    }" data-idx="-1">All</a>
  `;

    state.stops.forEach((eachstop, i) => {
      const isSelected = i === parseInt(stopSelected, 10); // Check if the index matches the selected value
      poipaginationhtml += `
    <a style="padding:0.25rem" href="#" class="${
      isSelected ? "bg-primary text-white" : ""
    }" data-idx="${i}">
      ${i + 1}
    </a>`;
    });

    poipaginationhtml += "</div>";
    this.innerHTML = poipaginationhtml;

    this.bindEvents();
  }

  subscribe() {
    this.unsubscribe = store.subscribe(() => this.render());
  }
}

customElements.define("stop-list-paginate", StopListPaginate);
