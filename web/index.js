'use strict';

class VaultUnlock extends React.Component {
  constructor(props) {
    super(props);

    this.state = {value: '', error: ''};

    this.handlePasswordChange = this.handlePasswordChange.bind(this);
    this.handleUnlock = this.handleUnlock.bind(this);
  }

  render() {
    let path = React.createElement('div', null, this.props.path);
    let pass = React.createElement('input', {
      type: 'password', 
      value: this.state.value,
      onChange: this.handlePasswordChange,
    }, null);
    let btn = React.createElement('button', {onClick: this.handleUnlock}, 'Unlock');
    let err = React.createElement('div', null, this.state.error);
    return React.createElement('div', {}, path, pass, btn, err);
  }

  handlePasswordChange(event) {
    this.setState({value: event.target.value});
  }

  handleUnlock(event) {
    var body = JSON.stringify({password: this.state.value});
    fetch('api/unlock', {method: 'post', body: body}).
      then(resp => resp.json()).
      then(data => {
        this.setState({error: data.error});
        console.log(data);
      });
  }
}

class VaultQuery extends React.Component {
  constructor(props) {
    super(props);
    this.state = { items: []};
  }

  render() {
    return React.createElement('ul', { },
      this.state.items.map(item => React.createElement('li', {}, item.title))
    );
  }

  componentDidMount() {
    fetch('api/items').
      then(resp => resp.json()).
      then(state => this.setState(state));
  }
}

class Vault extends React.Component {
  constructor(props) {
    super(props);
    this.state = { locked: true, path: "Unknown" };
  }

  render() {
    if (this.state.locked) {
      return React.createElement(VaultUnlock, {path: this.state.path});
    } else {
      return React.createElement(VaultQuery);
    }
  }

  componentDidMount() {
    fetch('api/state').
      then(resp => resp.json()).
      then(state => this.setState(state));
  }
}

const domContainer = document.querySelector('#react-root');
ReactDOM.render(React.createElement(Vault), domContainer);
