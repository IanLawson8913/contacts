document.addEventListener('DOMContentLoaded', function(event) {
  let Contact = {
    init: function(data) {
      this.id = String(data.id);
      this.full_name = data.full_name;
      this.phone_number = data.phone_number;
      this.email = data.email;
      this.tags = this.tagsToArray(data.tags);

      return this;
    },

    tagsToArray: function(tagData) {
      return (tagData === '' ? [] : tagData.split(','));
    },

    hasTag: function(tag) {
      return this.tags.indexOf(tag) !== -1;
    },

    hasTags: function(tags) {
      return tags.every(function(tag) {
        return this.tags.indexOf(tag) !== -1;
      }.bind(this));
    },
  };

  let ContactList = {
    list: [],
    tags: [],

    init: function(contacts) {
      contacts.forEach(function(contactData) {
        let contact = this.add(contactData);
        this.addTags(contact.tags);
      }.bind(this));

      return this;
    },

    add: function(data) {
      let contact = Object.create(Contact).init(data);

      this.addTags(contact.tags);
      this.list.push(contact);

      return contact;
    },

    get: function(id) {
      let matchIdx = this.indexOf(id);

      return this.list[matchIdx];
    },

    update: function(id, contactData) {
      let matchIdx = this.indexOf(id);
      let match = this.list[matchIdx];
      
      match.init(contactData);
    },

    delete: function(id) {
      let matchIdx = this.indexOf(id);

      this.list.splice(matchIdx, 1);
    },

    addTags: function(tags) {
      tags.forEach(function(tag) {
        if (this.tags.indexOf(tag) === -1) {
          this.tags.push(tag);
        }
      }.bind(this));
    },

    indexOf(id) {
      return this.list.findIndex(contact => contact.id === String(id));
    },

    search: function(searchVal) {
      let loweredSearch = searchVal.toLowerCase();

      return this.list.filter(function(contact) {
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
      this.list.sort(function(a, b) {
        if (a[option] < b[option]) {
          return -1;
        } else if (a[option] > b[option]) {
          return 1;
        }

        return 0;
      });
    },

    tagNameTaken(tagName) {
      return this.tags.indexOf(tagName) !== -1;
    },

    contactsWithTags(tags) {
      return this.list.filter(contact => {
        return contact.hasTags(tags);
      });
    },
  };

  let DisplayManager = {
    init: function() {
      this.containers = {
        home: document.getElementById('home-container'),
        add: document.getElementById('add-container'),
        edit: document.getElementById('edit-container'),
      };

      this.tags = document.getElementById('user-tags');

      this.templates = this.getTemplates();
      Handlebars.registerPartial('tagsPartial', this.templates["tags-spans"]);

      return this;
    },

    getTemplates: function() {
      let templates = {};
      let scripts = document.querySelectorAll('script[type="text/x-handlebars-template"]');

      scripts.forEach(({ id, innerHTML }) => templates[id] = Handlebars.compile(innerHTML) );

      return templates;
    },

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

    validateForm: function(form) {  
      let textInputs = form.querySelectorAll('input[type="text"]');
      let isTagForm = form.id === 'new-tag-form';

      textInputs.forEach(input => {
        if (input.validity) { this.processValidation(input, isTagForm) }
      });
    },

    processValidation: function(input) {
      let dt = input.parentElement.previousElementSibling;
      let desc = dt.textContent.toLowerCase();
      let article = (desc[0].match(/[aeiou]/) ? 'an' : 'a');
      let message;
      
      if (input.validity.valueMissing) {
        message = `Please enter ${article} ${desc}.`;
      } else if (input.validity.patternMismatch) {
        message = `Invalid ${desc}.`
      }

      this.displayValidationMessage(input, message);
    },

    displayValidationMessage(input, message='') {
      let messageP = input.closest('label').querySelector('p');
      let dt = input.closest('label').querySelector('dt');

      messageP.textContent = message;

      message ? dt.classList.add('invalid') : dt.classList.remove('invalid');
    },

    clearValidation(form) {
      let invalidElements = form.querySelectorAll('.invalid');
      let messages = form.querySelectorAll('.message');

      invalidElements.forEach(el => el.classList.remove('invalid'));
      messages.forEach(el => el.textContent = '');
    },

    displayEditForm(contact, tags) {
      let formTemplate = this.templates['form-template'];
      let checkboxTemplate = this.templates['tags-checkbox'];
      let chosenTags = contact.tags.slice();
      let data = Object.assign(contact, { tags: tags });

      // render form
      this.containers.edit.innerHTML = formTemplate(data);

      // select checkboxes fieldset and insert all possible tags
      let checkboxFieldset = document.getElementById('tags');
      checkboxFieldset.innHTML = checkboxTemplate(tags);

      // preselect tags that were previously chosen for this contact
      let checkboxes = this.containers.edit.querySelectorAll('input[type="checkbox"]');
      this.selectCheckboxes(checkboxes, chosenTags);
    },

    selectCheckboxes(checkboxes, tags) {
      checkboxes.forEach(function(option) {
        if (tags.indexOf(option.value) >= 0) {
          option.setAttribute('checked', 'checked');
        }
      });
    },

    displayTags(container, tags) {
      let tagsHTML = this.templates['tags-spans']( {tags: tags} );

      container.innerHTML = tagsHTML;
    },

    displayTagsCheckbox(tags) {
      let container = document.getElementById('tags');
      let checkboxHTML = this.templates['tags-checkbox']( {tags: tags} );

      container.innerHTML = checkboxHTML;
    },

    selectedTags() {
      let tags = Array.prototype.slice.call(this.tags.children);
      let selected = tags.filter(tag => tag.classList.contains('highlight'));

      return selected.map(tag => tag.textContent);
    },

    toggleHighlight(element) {
      element.classList.toggle('highlight');
    },

    highlightAll(tags) {
      tags.forEach(tag => {
        if (!this.isHighlighted(tag)) {
          this.toggleHighlight(tag);
        }
      });
    },

    isHighlighted(tag) {
      return tag.classList.contains('highlight');
    },

    allHighlighted(tags) {
      return tags.all(tag => this.isHighlighted(tag));
    },
  };

  let ContactManager = {
    init: function() {
      this.contacts = Object.create(ContactList);
      this.display = Object.create(DisplayManager);

      this.getContacts();
      this.attachListeners();
    },

    attachListeners() {
      let addBtn = document.getElementById('add-btn');
      let contactsContainer =  document.getElementById('contacts-container');
      let editContainer = document.getElementById('edit-container');
      let addForm = document.getElementById('add-form');
      let search = document.getElementById('search');
      let options = document.getElementById('options-btn');
      let sortBy = document.getElementById('sort-by-form');
      let newTag = document.getElementById('new-tag-btn');
      let newTagForm = document.getElementById('new-tag-form');

      document.addEventListener('click', this.handleTagSelect.bind(this));
      contactsContainer.addEventListener('click', this.handleEditNav.bind(this));
      addBtn.addEventListener('click', this.handleAddNav.bind(this));
      document.addEventListener('click', this.handleCancel.bind(this));
  
      addForm.addEventListener('submit', this.handleFormSubmit.bind(this));
      editContainer.addEventListener('submit', this.handleFormSubmit.bind(this));

      contactsContainer.addEventListener('click', this.handleDelete.bind(this));

      options.addEventListener('click', this.handleToggleOptions.bind(this));
      newTag.addEventListener('click', this.handleToggleTag.bind(this));
      newTagForm.addEventListener('submit', this.handleFormSubmit.bind(this));

      search.addEventListener('keyup', this.handleSearchKeyup.bind(this));
      sortBy.addEventListener('click', this.handleSortChange.bind(this));
    },

    getContacts() {
      let request = new XMLHttpRequest();
      request.open('GET', '/api/contacts/');
      request.responseType = 'json';

      request.addEventListener('load', function(event) {
        let headerP = document.getElementById('tags-header');
        let response = request.response;

        this.contacts.init(response);
        this.display.init();

        this.display.displayContacts(this.contacts.list);
        this.display.displayTags(this.display.tags, this.contacts.tags);
        this.display.displayTagsCheckbox(this.contacts.tags);
      }.bind(this));

      request.send();
    },

    attachInputListeners(form) {
      let inputs = form.querySelectorAll('input[type="text"]');

      inputs.forEach(function(input) {
        input.addEventListener('focus', this.handleAutofill.bind(this));
      }.bind(this));
    },

    handleAutofill(event) {
      let input = event.currentTarget;
      let fillValue = input.getAttribute('placeholder');

      input.addEventListener('keyup', function(event) {
        if (event.key === 'ArrowRight') {
          input.value = fillValue;
        }
      });
    },

    handleFormSubmit(event) {
      event.preventDefault();

      let form = event.target;
      let isInvalid = !form.checkValidity();

      if (isInvalid) {
        this.display.validateForm(form);
        return;
      }

      switch (form.id) {
        case 'add-form':
          this.submitAddForm(form);
          break;
        case 'edit-form':
          this.submitEditForm(form);
          break;
        case 'new-tag-form':
          this.submitTagForm(form);
          break;
      }
    },

    submitTagForm(form) {
      let input = form.querySelector('input');
      let tagName = input.value;

      this.display.validateForm(form);

      if (this.contacts.tagNameTaken(tagName)) {
        this.display.displayValidationMessage(input, 'Tag name taken');
        return;
      }

      this.contacts.tags.push(tagName);
      this.display.displayTagsCheckbox(this.contacts.tags);
      this.display.displayTags(this.display.tags, this.contacts.tags);
      this.display.clearValidation(form);
      form.reset();
    },

    submitAddForm(form) {
      let request = new XMLHttpRequest();
      let json = this.formToJSON(form);

      request.open(form.getAttribute('method'), '/api/contacts/');
      request.setRequestHeader('Content-Type', 'application/json');
      request.responseType = 'json';

      request.addEventListener('load', function(event) {
        this.contacts.add(request.response);
        this.display.displayContacts(this.contacts.list);
        this.display.displayTags(this.display.tags, this.contacts.tags);
        this.display.navigateTo('home');
      }.bind(this));

      request.send(json);
    },

    submitEditForm(form) {
      let id = form.dataset.id;
      let request = new XMLHttpRequest();
      let json = this.formToJSON(form, id);

      request.open('PUT', `/api/contacts/${id}`);
      request.setRequestHeader('Content-Type', 'application/json');
      request.responseType = 'json';

      request.addEventListener('load', function(event) {
        this.contacts.update(id, request.response);
        this.display.displayContacts(this.contacts.list);
        this.display.navigateTo('home');
      }.bind(this));

      request.send(json);
    },

    handleEdit(event) {
      let contact = event.currentTarget.response;

      this.displayForm(this.containers.edit, contact);
      this.navigateTo('edit');

      editForm = document.getElementById('edit-form');
      editForm.dataset.id = String(contact.id);
      editForm.addEventListener('submit', this.handleFormSubmit.bind(this));
    },

    handleCancel(event) {
      if (event.target.classList.contains('cancel-btn')) {
        let form = event.target.closest('form');

        form.reset();
        this.display.clearValidation(form);
        this.display.navigateTo('home');
      }
    },

    handleDelete(event) {
      let target = event.target;

      if (target.classList.contains('delete-btn')) {
        let request = new XMLHttpRequest();
        let id = target.dataset.id;
        let path = "/api/contacts/" + id;

        request.open('DELETE', path);

        request.addEventListener('load', function(event) {
          this.contacts.delete(id);
          this.display.displayContacts(this.contacts.list);
        }.bind(this));

        request.send();
      }
    },

    handleEditNav(event) {
      let target = event.target;

      if (target.classList.contains('edit-btn')) {
        let id = target.dataset.id;
        let contact = this.contacts.get(id);

        this.display.navigateTo('edit');
        this.display.displayEditForm(contact, this.contacts.tags);

        let editForm = document.getElementById('edit-form');

        this.attachInputListeners(editForm);
      }
    },

    handleAddNav(event) {
      this.display.navigateTo('add');
    },

    handleToggleOptions(event) {
      let options = document.getElementById('options');

      event.target.classList.toggle('clicked');
      this.display.toggle(options);
    },

    handleToggleTag(event) {
      let tagDiv = document.getElementById('new-tags-container');

      event.target.classList.toggle('clicked');
      this.display.toggle(tagDiv);
    },

    handleTagSelect(event) {
      let tag = event.target;
      let isTag = tag.classList.contains('tag');
      let selectedTags;
      let contacts;

      if (tag.nodeName !== 'SPAN' && !isTag) {
        return;
      }

      this.display.toggleHighlight(tag);

      selectedTags = this.display.selectedTags();
      contacts = this.contacts.contactsWithTags(selectedTags);

      this.display.displayContacts(contacts);
    },

    handleSortChange(event) {
      let isRadio = event.target.getAttribute('type') === 'radio';

      if (isRadio) {
        let option = event.target.value;
        this.contacts.sortContactsBy(option);
        this.display.displayContacts(this.contacts.list);
      }
    },

    handleSearchKeyup(event) {
      let val = event.currentTarget.value;
      let matched = this.contacts.search(val);

      this.display.displayContacts(matched);
    },

    formToJSON: function(form) {
      let textInputs = form.querySelectorAll('input');
      let checkboxes = form.querySelectorAll('input[type="checkbox"]');
      let data = {};
      let tags = [];

      data.id = parseInt(form.dataset.id, 10);

      textInputs.forEach(( {name, value} ) => { data[name] = value; });

      checkboxes = Array.prototype.slice.call(checkboxes);
      checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
          tags.push(checkbox.value);
        }
      });

      data.tags = tags.join(',');

      return JSON.stringify(data);
    },
  };

  let app = Object.create(ContactManager);
  app.init();
});
