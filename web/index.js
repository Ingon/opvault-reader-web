'use strict';

class VaultUnlock extends React.Component {
  constructor(props) {
    super(props);

    this.state = {value: '', error: ''};

    this.handlePasswordChange = this.handlePasswordChange.bind(this);
    this.handleUnlock = this.handleUnlock.bind(this);
  }

  render() {
    let path = React.createElement('span', {'id': 'header-path'}, this.props.path);
    let header = React.createElement('div', {'id': 'header'}, path);

    let pass = React.createElement('input', {
      type: 'password', 
      placeholder: 'Enter your password',
      value: this.state.value,
      onChange: this.handlePasswordChange,
    }, null);
    let btn = React.createElement('button', {onClick: this.handleUnlock}, 'Unlock');
    let err = React.createElement('div', null, this.state.error);
    let form = React.createElement('form', {'id': 'vault-unlock-form'}, pass, btn, err);
    return React.createElement('div', {'id': 'vault-unlock'}, header, form);
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
        if (data.error.length === 0) {
          this.props.unlocked();
        }
      });
    event.preventDefault();
  }
}

class VaultItem extends React.Component {
  constructor(props) {
    super(props);

    this.handleClick = this.handleClick.bind(this);
  }

  render() {
    return React.createElement('li', {
      'className': this.props.selected ? 'item-selected' : 'item', 
      onClick: this.handleClick,
    }, this.props.title)
  }

  handleClick() {
    this.props.handleSelection(this.props.id);
  }
}

class VaultDetails extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  render() {
    let title = React.createElement('h3', {}, this.state.title);
    let fieldsWrapper = React.createElement('div');
    if (this.state.fields) {
      let fields = this.state.fields.map(field => {
        let name = React.createElement('div', {className: 'field-name'}, field.name);
        let value = React.createElement('div', {className: 'field-value'}, field.value);
        return [name, value];
      });
      fieldsWrapper = React.createElement('div', {id: 'fields'}, fields);
    }
    return React.createElement('div', {'id': 'item-detail'}, title, fieldsWrapper);
  }

  componentDidUpdate() {
    if (this.props.id.length > 0 && this.props.id != this.state.id) {
      fetch('api/item?id=' + this.props.id).
        then(resp => resp.json()).
        then(item => this.setState(item));
    }
  }
}

class VaultMain extends React.Component {
  constructor(props) {
    super(props);

    this.state = { items: [], selected: "" };

    this.handleLock = this.handleLock.bind(this);
    this.handleSelection = this.handleSelection.bind(this);
  }

  render() {
    let path = React.createElement('span', {'id': 'header-path'}, this.props.path);
    let locker = React.createElement('button', {'id': 'header-lock', onClick: this.handleLock}, 'Lock');
    let header = React.createElement('div', {'id': 'header'}, path, locker);
    let items = React.createElement('ul', {'id': 'item-list'},
      this.state.items.map(item => React.createElement(VaultItem, {
        key: item.id, 
        id: item.id, 
        title: item.title,
        selected: item.id === this.state.selected,
        handleSelection: this.handleSelection,
      }))
    );
    let details = React.createElement(VaultDetails, {id: this.state.selected});
    return React.createElement('div', {'id': 'vault-main'}, header, items, details);
  }

  componentDidMount() {
    fetch('api/items').
      then(resp => resp.json()).
      then(state => this.setState(state));
  }
  
  handleLock(event) {
    fetch('api/lock').
      then(resp => resp.json()).
      then(data => {
        this.props.locked();
      });
  }

  handleSelection(itemId) {
    this.setState({ selected: itemId });
  }
}

class Vault extends React.Component {
  constructor(props) {
    super(props);

    this.state = { loading: true, locked: true, path: "Unknown" };

    this.refetchState = this.refetchState.bind(this);
  }

  render() {
    if (this.state.loading) {
      return React.createElement("div", {id: 'loading'}, "Loading...");
    }

    if (this.state.locked) {
      return React.createElement(VaultUnlock, {path: this.state.path, unlocked: this.refetchState});
    } else {
      return React.createElement(VaultMain, {path: this.state.path, locked: this.refetchState});
    }
  }

  componentDidMount() {
    this.refetchState();
  }

  refetchState() {
    this.setState({ loading: true });
    fetch('api/state').
      then(resp => resp.json()).
      then(state => this.setState(state)).
      then(() => this.setState({ loading: false }));
  }
}

const domContainer = document.querySelector('#react-root');
ReactDOM.render(React.createElement(Vault), domContainer);
