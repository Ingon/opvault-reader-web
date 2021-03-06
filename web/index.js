'use strict';

function titleOrName(title, name) {
  if (title && title.length > 0) {
    return title;
  }
  return name;
}

class VaultUnlock extends React.Component {
  constructor(props) {
    super(props);

    this.state = {value: '', error: ''};

    this.handlePasswordChange = this.handlePasswordChange.bind(this);
    this.handleUnlock = this.handleUnlock.bind(this);
  }

  render() {
    let path = React.createElement('span', {id: 'header-path'}, this.props.path);
    let header = React.createElement('div', {id: 'header'}, path);

    let pass = React.createElement('input', {
      type: 'password', 
      placeholder: 'Enter your password',
      value: this.state.value,
      onChange: this.handlePasswordChange,
    }, null);
    let btn = React.createElement('button', {onClick: this.handleUnlock}, 'Unlock');
    let err = React.createElement('div', null, this.state.error);
    let form = React.createElement('form', {id: 'vault-unlock-form'}, pass, btn, err);
    return React.createElement('div', {id: 'vault-unlock'}, header, form);
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

function toClipboard(text) {
  let area = document.getElementById('copy-area');
  area.style.display = 'inline';
  area.value = text;
  area.focus();
  area.select();

  try {
    var successful = document.execCommand('copy');
    var msg = successful ? 'successful' : 'unsuccessful';
    console.log('Copying text command was ' + msg);
  } catch (err) {
    console.log('Oops, unable to copy');
  }

  area.style.display = 'none';
}

class VaultField extends React.Component {
  render() {
    let displayValue = this.props.value;
    if (this.props.type === "P" || this.props.designation === "password" || this.props.kind === "concealed") {
      displayValue = "●●●●●●●●";
    }

    let name = React.createElement('div', {className: 'field-name'}, this.props.name);
    let value = React.createElement('div', {className: 'field-value'}, displayValue);
    let copy = React.createElement('button', {className: 'field-copy', onClick: () => toClipboard(this.props.value)}, 'copy');
    return React.createElement(React.Fragment, {}, name, value, copy);
  }
}

class VaultFields extends React.Component {
  render() {
    if (! this.props.fields) {
      return React.createElement('div');
    }

    let fields = this.props.fields.map(field => {
      return React.createElement(VaultField, {...{key: field.name}, ...field});
    });
    return React.createElement('div', {id: 'fields'}, fields);
  }
}

class VaultSectionFields extends React.Component {
  render() {
    if (! this.props.fields) {
      return React.createElement('div');
    }

    let fields = this.props.fields.map(field => {
      return React.createElement(VaultField, {...{key: field.name}, ...field});
    });
    return React.createElement('div', {className: 'section-fields'}, fields);
  }
}

class VaultSection extends React.Component {
  render() {
    let title = React.createElement('h4', {}, titleOrName(this.props.title, this.props.name));
    let fields = React.createElement(VaultSectionFields, {fields: this.props.fields});
    return React.createElement('div', {}, title, fields);
  }
}

class VaultSections extends React.Component {
  render() {
    if (! this.props.sections) {
      return React.createElement('div');
    }

    let sections = this.props.sections.map(section => {
      return React.createElement(VaultSection, {...{key: section.name}, ...section});
    });
    return React.createElement('div', {id: 'sections'}, sections);
  }
}

class VaultDetails extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  render() {
    let title = React.createElement('h2', {}, this.state.title);
    let fields = React.createElement(VaultFields, {fields: this.state.fields});
    let notes = React.createElement('div', {}, this.state.notes);
    let sections = React.createElement(VaultSections, {sections: this.state.sections});
    return React.createElement('div', {id: 'item-detail'}, title, fields, sections);
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

    this.state = { items: [], selected: "", search: "" };

    this.handleLock = this.handleLock.bind(this);
    this.handleSearchChange = this.handleSearchChange.bind(this);
    this.handleSelection = this.handleSelection.bind(this);
  }

  render() {
    let path = React.createElement('span', {id: 'header-path'}, this.props.path);
    let locker = React.createElement('button', {id: 'header-lock', onClick: this.handleLock}, 'Lock');
    let header = React.createElement('div', {id: 'header'}, path, locker);
    let items = React.createElement('ul', {id: 'item-list'},
      this.state.items.map(item => React.createElement(VaultItem, {
        key: item.id, 
        id: item.id, 
        title: item.title,
        selected: item.id === this.state.selected,
        handleSelection: this.handleSelection,
      }))
    );
    let itemSearch = React.createElement('input', {
      id: 'item-search',
      placeholder: 'Filter items...',
      value: this.state.search,
      onChange: this.handleSearchChange,
    });
    let vaultItems = React.createElement('div', { id: 'vault-items'}, itemSearch, items);
    let details = React.createElement(VaultDetails, {id: this.state.selected});
    return React.createElement('div', {id: 'vault-main'}, header, vaultItems, details);
  }

  componentDidMount() {
    fetch('api/items').
      then(resp => resp.json()).
      then(state => this.setState(state));
  }
  
  handleLock(event) {
    toClipboard(' ');
    fetch('api/lock').
      then(resp => resp.json()).
      then(data => {
        this.props.locked();
      });
  }

  handleSearchChange(event) {
    let search = event.target.value;

    this.setState({search: search});

    fetch('api/items?q=' + search).
      then(resp => resp.json()).
      then(state => this.setState({items: state.items || []}));

    event.preventDefault();
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
