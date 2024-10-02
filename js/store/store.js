export class Store {
  constructor(reducer, initialState) {
    this.reducer = reducer;
    this.state = initialState;
    this.listeners = [];
  }

  getState() {
    return this.state;
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  dispatch(action) {
    const newState = this.reducer(this.state, action);
    this.state = { ...this.state, ...newState };
    console.log(this.state)
    this.listeners.forEach(listener => listener());
  }
}

export function createStore(reducer, initialState) {
  return new Store(reducer, initialState);
}
