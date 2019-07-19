document.addEventListener('DOMContentLoaded', function(event) {
  let contacts = {
    init: function() {
      this.containers = {
        home: document.getElementById('home-container'),
        add: document.getElementById('add-container'),
        edit: document.getElementById('edit-container'),
      };

      this.templates = this.getTemplates();
      this.contacts = null;

      this.displayForm(this.containers.add)
      this.refreshContacts();
      this.attachListeners();
    },

    attachListeners() {
      let contactsContainer =  document.getElementById('contacts-container');
      let addForm = document.getElementById('add-form');
      let search = document.getElementById('search');

      document.addEventListener('click', this.handleNav.bind(this));
      addForm.addEventListener('submit', this.handleFormSubmit.bind(this));
      contactsContainer.addEventListener('click', this.handleContactAlteration.bind(this));
      search.addEventListener('keyup', this.handleSearchKeyup.bind(this));
    },

    getContact(id) {
      let request = new XMLHttpRequest();
      request.open('GET', 'http://localhost:3000/api/contacts/' + String(id));
      request.responseType = 'json';

      request.addEventListener('load', function(event) { 
        this.contact = request.response;
      }.bind(this));

      request.send();
    },

    refreshContacts() {
      let request = new XMLHttpRequest();
      request.open('GET', 'http://localhost:3000/api/contacts/');
      request.responseType = 'json';

      request.addEventListener('load', this.handleGetContacts.bind(this));

      request.send();
    },

    handleSearchKeyup(event) {
      let val = event.currentTarget.value;
      let matched = this.search(val, this.contacts);

      this.displayContacts(matched);
    },

    handleNav(event) {
      event.preventDefault();

      if (event.target.nodeName !== 'BUTTON') {
        return;
      }

      let classList = event.target.classList;

      if (classList.contains('cancel-btn')) {
        this.navigateTo('home');
      } else if (classList.contains('add-btn')) {
        this.navigateTo('add');
      }
    },

    handleGetContacts(event) {
      let request = event.currentTarget;
      let response = request.response;

      this.contacts = this.convertTagsToArray(response);
      this.displayContacts(this.contacts);
    },

    handleContactAlteration(event) {
      let target = event.target;

      if (target.nodeName !== 'BUTTON') { return; }

      let isEditBtn = target.classList.contains('edit-btn');
      let isDeleteBtn = target.classList.contains('delete-btn');

      let request = new XMLHttpRequest();
      let id = target.dataset.id;
      let path = "http://localhost:3000/api/contacts/" + id;

      if (isEditBtn) {
        request.open('GET', path);
        request.responseType = "json";
        request.addEventListener('load', this.handleCreateEditForm.bind(this));
      } else if (isDeleteBtn) {
        request.open('DELETE', path);
        request.addEventListener('load', this.refreshContacts.bind(this));
      }

      request.send();
    },

    handleCreateEditForm(event) {
      let id = event.currentTarget.response.id;
      let request = new XMLHttpRequest();
      let editForm;

      request.open('GET', 'http://localhost:3000/api/contacts/' + String(id));
      request.responseType = 'json';

      request.addEventListener('load', function(event) { 
        this.contact = request.response;
        this.displayForm(this.containers.edit, this.contact);
        this.navigateTo('edit');

        editForm = document.getElementById('edit-form');
        editForm.dataset.id = String(id);
        editForm.addEventListener('submit', this.handleFormSubmit.bind(this));
      }.bind(this));

      request.send();
    },

    handleFormSubmit(event) {
      event.preventDefault();

      let form = event.currentTarget;
      let isInvalid = !form.checkValidity();
      let id = form.dataset.id || '';

      if (isInvalid) {
        this.validateForm(this.form);
        return;
      }

      let request = new XMLHttpRequest();
      let json = this.formToJSON(event.currentTarget, id);

      request.open(form.getAttribute('method'), 'http://localhost:3000/api/contacts/' + id);
      request.setRequestHeader('Content-Type', 'application/json');
      request.responseType = 'json';

      request.addEventListener('load', this.refreshGoHome.bind(this));

      request.send(json)
    },

    refreshGoHome: function(event) {
      this.refreshContacts();
      this.navigateTo('home');
    },

    // data processing

    convertTagsToArray: function(contacts) {
      return contacts.map(contact => {
        contact.tags = (contact.tags ? contact.tags.split(',') : []);

        return contact;
      });
    },

    formToJSON: function(form, id) {
      let textInputs = form.querySelectorAll('input');
      let tagSelect = form.querySelector('select');
      let tags = Array.prototype.slice.call(tagSelect.selectedOptions);
      let data = {};

      if (id) { data[id] = id; }

      textInputs.forEach(( {name, value} ) => { data[name] = value; });

      data['tags'] = tags.map(option => option.value).join(',');

      return JSON.stringify(data);
    },

    search: function(searchVal, contacts) {
      let loweredSearch = searchVal.toLowerCase();

      return contacts.filter(function(contact) {
        let emailParts = contact.email.split('@');
        let nameParts = contact.full_name.split(' ');
        let toCheck = emailParts.concat(nameParts);

        return toCheck.some(part => {
          let isMatch = part.toLowerCase().startsWith(loweredSearch);
          
          return isMatch;
        });    
      });
    },

    justDigits: function(phoneStr) {
      let chars = phoneStr.split('');
      let digits = chars.filter.filter(digit => !isNaN(digit)).join('');

      return digits;
    },

    // form validation

    validateForm: function() {  
      let inputs = this.containers.add.querySelectorAll('input');

      inputs.forEach(input => {
        if (input.validity) { this.processValidation(input) }
      });
    },

    processValidation: function(input) {
      let inputName = input.parentElement.previousElementSibling.textContent.toLowerCase();
      let message = '';
      
      if (input.validity.valueMissing) {
        message = `Please enter a ${inputName}.`;
      } else if (input.validity.patternMismatch) {
        message = `Invalid ${inputName}.`
      }

      this.displayValidationMessage(input, message);
    },

    // display

    navigateTo: function(destination) {
      let containerPairs = Object.entries(this.containers);

      for (let [description, div] of containerPairs) {
        description === destination ? div.classList.remove('hidden') : div.classList.add('hidden');
      }
    },

    getTemplates: function() {
      let templates = {};
      let scripts = document.querySelectorAll('script[type="text/x-handlebars-template"]');

      scripts.forEach(({ id, innerHTML }) => templates[id] = Handlebars.compile(innerHTML) );

      return templates;
    },

    displayContacts: function(contacts) {
      let contactsDiv = document.getElementById('contacts-container');
      let contactsTemplate = this.templates['contacts-template'];

      contactsDiv.innerHTML = contactsTemplate({ contacts: contacts });
    },

    displayValidationMessage(input, message) {
      let messageP = input.nextElementSibling;
      let dt = input.closest('label').querySelector('dt');

      messageP.textContent = message;

      if (message) {
        messageP.style.display = 'inline-block';
        dt.classList.add('invalid');
      } else {
        messageP.style.display = 'none';
        dt.classList.remove('invalid');
      }
    },

    displayForm(container, contact) {
      let formTemplate = this.templates['form-template'];
      let templateData = {};

      if (contact) {
        templateData.form_id = 'edit-form';
        templateData.title = 'Edit';
        templateData.method = 'PUT';
        Object.assign(templateData, contact);
      } else {
        templateData.form_id = 'add-form';
        templateData.title = 'Add';
        templateData.method = 'POST';
      }

      container.innerHTML = formTemplate(templateData);
    },
  }

  let app = Object.create(contacts);
  app.init();
});



  // let add = document.getElementById('add-form');
  // let contactsTemplate = Handlebars.compile(document.getElementById('contacts-template').innerHTML);

  // function validateEmptyInput(input) {
    // let inputName = input.getAttribute('name');
    // let messageP = input.nextElementSibling;
    // let dt = input.closest('label').querySelector('dt');
    
    // if (input.validity.valueMissing) {
    //   messageP.textContent = `Please enter the ${inputName}.`; 
    //   messageP.style.display = 'inline-block';
    //   dt.classList.add('invalid');
    // } else {
    //   messageP.style.display = 'none';
    //   dt.classList.remove('invalid');
    // }
  // };

  // function validateForm(form) {
  //   let inputs = add.querySelectorAll('input');

  //   inputs.forEach(input => {
  //     if (input.validity) { validateEmptyInput(input) };
  //   });
  // };

  // function formToJson(form) {
    // var textInputs = form.querySelectorAll('input');
    // var tagSelect = form.querySelector('select');
    // var tags = Array.prototype.slice.call(tagSelect.selectedOptions);
    // var data = {};

    // textInputs.forEach(( {name, value} ) => { data[name] = value; });

    // data['tags'] = tags.map(option => option.value).join(',');

    // return JSON.stringify(data);
  // };

  // function handleFormSubmit(event) {
  //   event.preventDefault();

  //   let form = event.currentTarget;
  //   validateForm(form);

  //   if (form.checkValidity()) {
  //     let request = new XMLHttpRequest();
  //     let json = formToJson(event.currentTarget);

  //     request.open(form.method, 'http://localhost:3000/api/contacts/');
  //     request.setRequestHeader('Content-Type', 'application/json');
  //     request.responseType = 'json';

  //     request.addEventListener('load', function(event) {
  //       var response = request.response;
  //       response.tags = response.tags.split(',');

  //       // console.log(response);
  //     });

  //     request.send(json);
  //   }
  // };