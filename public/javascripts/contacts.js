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
      this.searchOptions = document.getElementById('options');

      this.displayForm(this.containers.add);
      this.getContacts();
      this.attachListeners();
    },

    attachListeners() {
      let contactsContainer =  document.getElementById('contacts-container');
      let addForm = document.getElementById('add-form');
      let search = document.getElementById('search');
      let options = document.getElementById('options-btn');
      let sortBy = this.searchOptions.querySelector('#sort-by-form');
      let searchOptions = this.searchOptions.querySelector('#search-form');

      addForm.addEventListener('submit', this.handleFormSubmit.bind(this));
      options.addEventListener('click', this.handleToggleOptions.bind(this));
      document.addEventListener('click', this.handleNav.bind(this));
      contactsContainer.addEventListener('click', this.handleContactAlteration.bind(this));

      search.addEventListener('keyup', this.handleSearchKeyup.bind(this));
      sortBy.addEventListener('click', this.handleSortChange.bind(this));
    },

    getContacts() {
      let request = new XMLHttpRequest();
      request.open('GET', 'http://localhost:3000/api/contacts/');
      request.responseType = 'json';

      request.addEventListener('load', this.handleRefresh.bind(this));

      request.send();
    },

    submitForm(form) {
      let id = form.dataset.id || '';
      let request = new XMLHttpRequest();
      let json = this.formToJSON(form, id);

      request.open(form.getAttribute('method'), 'http://localhost:3000/api/contacts/' + id);
      request.setRequestHeader('Content-Type', 'application/json');
      request.responseType = 'json';

      request.addEventListener('load', function(event) {
        this.getContacts();
      }.bind(this));

      request.send(json);
    },

    handleRefresh(event) {
      let request = event.currentTarget;
      let response = request.response;

      this.contacts = this.convertTagsToArray(response);

      this.displayContacts(this.contacts);
      this.navigateTo('home');
    },

    handleEdit(event) {
      let contact = event.currentTarget.response;

      this.displayForm(this.containers.edit, contact);
      this.navigateTo('edit');

      editForm = document.getElementById('edit-form');
      editForm.dataset.id = String(contact.id);
      editForm.addEventListener('submit', this.handleFormSubmit.bind(this));
    },

    handleDelete(event) {
      this.getContacts();
    },

    handleNav(event) {
      let target = event.target;
      let type = target.getAttribute('type');

      if (target.nodeName !== 'BUTTON') { return; }

      let classList = event.target.classList;

      if (classList.contains('cancel-btn')) {
        let form = target.closest('form');

        form.reset();
        this.clearValidation(form);
        this.navigateTo('home');
      } else if (classList.contains('add-btn')) {
        this.navigateTo('add');
      }
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
        request.addEventListener('load', this.handleEdit.bind(this));
      } else if (isDeleteBtn) {
        request.open('DELETE', path);
        request.addEventListener('load', this.handleDelete.bind(this));
      }

      request.send();
    },

    handleFormSubmit(event) {
      event.preventDefault();

      let form = event.currentTarget;
      let isInvalid = !form.checkValidity();

      if (isInvalid) {
        this.validateForm(form);
        return;
      }

      this.submitForm(form);
    },

    handleToggleOptions(event) {
      this.toggle(this.searchOptions);
    },

    handleSortChange(event) {
      let isRadio = event.target.getAttribute('type') === 'radio';

      if (isRadio) {
        let option = event.target.value;
        this.sortContactsBy(option);
        this.displayContacts(this.contacts);
      }
    },

    handleSearchKeyup(event) {
      let val = event.currentTarget.value;
      let matched = this.search(val, this.contacts);

      this.displayContacts(matched);
    },

    // misc

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

    sortContactsBy: function(option) {
      this.contacts.sort(function(a, b) {
        if (a[option] < b[option]) {
          return -1;
        } else if (a[option] > b[option]) {
          return 1;
        }

        return 0;
      });
    },

    justDigits: function(phoneStr) {
      let chars = phoneStr.split('');
      let digits = chars.filter.filter(digit => !isNaN(digit)).join('');

      return digits;
    },

    getTemplates: function() {
      let templates = {};
      let scripts = document.querySelectorAll('script[type="text/x-handlebars-template"]');

      scripts.forEach(({ id, innerHTML }) => templates[id] = Handlebars.compile(innerHTML) );

      return templates;
    },

    // form validation

    validateForm: function(form) {  
      let inputs = form.querySelectorAll('input');

      inputs.forEach(input => {
        if (input.validity) { this.processValidation(input) }
      });
    },

    processValidation: function(input) {
      let dt = input.parentElement.previousElementSibling
      let desc = dt.textContent.toLowerCase();
      let message = '';
      
      if (input.validity.valueMissing) {
        message = `Please enter a ${desc}.`;
      } else if (input.validity.patternMismatch) {
        message = `Invalid ${desc}.`
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

    toggle: function(element) {
      let classList = element.classList;
      let isHidden = element.classList.contains('hidden');

      isHidden ? classList.remove('hidden') : classList.add('hidden');
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

    clearValidation(form) {
      let invalidElements = form.querySelectorAll('.invalid');
      let messages = form.querySelectorAll('.message');

      invalidElements.forEach(el => el.classList.remove('invalid'));
      messages.forEach(el => el.textContent = '');
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
