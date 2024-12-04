export class Store {
  constructor(reducer, initialState) {
    this.reducer = reducer;
    this.state = initialState;
    this.listeners = [];
  }

  getState() {
    return this.state;
  }

  // subscribe(listener) {
  //   this.listeners.push(listener);
  //   return () => {
  //     this.listeners = this.listeners.filter(l => l !== listener);
  //   };
  // }

  // dispatch(action) {
  //   const newState = this.reducer(this.state, action);
  //   this.state = { ...this.state, ...newState };
  //   console.log(this.state)
  //   this.listeners.forEach(listener => listener());
  // }

     // Add optional actionTypes parameter
     subscribe(listener, actionTypes = null) {
      // Store both the listener and its actionTypes filter
      const subscriberInfo = {
          callback: listener,
          actionTypes: actionTypes
      };
      
      this.listeners.push(subscriberInfo);
      
      return () => {
          this.listeners = this.listeners.filter(l => l.callback !== listener);
      };
  }

  dispatch(action) {
      const newState = this.reducer(this.state, action);
      this.state = { ...this.state, ...newState };
      console.log(this.state)
      // Notify listerers based on their action type filters If actionTypes filter was supplied by the subscriber.
      // Notify listeners for all action types, if no actionTypes filter was supplied by the subscriber.
      this.listeners.forEach(subscriber => {
          if (!subscriber.actionTypes || subscriber.actionTypes.includes(action.type)) {
              subscriber.callback();
          }
      });
  }
}

export function createStore(reducer, initialState) {
  return new Store(reducer, initialState);
}
