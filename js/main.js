'use strict';

const ui = {
    "container": document.querySelector('.main'),
    /**
     * Main containers
     */
    "data": [],
    /**
     * Panel
     */
    "panel": {
        "template": (() => Array.prototype.slice.call(document.querySelectorAll("template")).reduce((templates, template) => addElement(template.id.id2CamelCase(), template, templates), {}))(),
        /**
         * Create an element from a `template`
         * @param {template} template
         * @param {object} dataset
         * @param {object} [container]
         */
        "create": (template, dataset, container) => {
            let closeButton,
                element = importNode(template, `.${template.id.substring('template-'.length)}`),
                shortcuts = {
                    content: ".{0}__content",
                    header: ".{0}__name"
                },
                templatePanelIndexId = ui.panel.template.panelIndex.id.id2CamelCase();

            container = container || ui.container;

            // dataset
            for (var property in dataset || {}) {
                element.dataset[property] = dataset[property];
            }

            // shortcuts
            for (var shortcut in shortcuts) {
                let candidate = element.querySelector(shortcuts[shortcut].format(element.classList[0]));

                if (candidate) {
                    if (!element.shortcuts) {
                        element.shortcuts = {};
                    }
                    element[shortcut] = candidate;
                    element.shortcuts[shortcut] = element[shortcut];
                }
            }

            // append DOM
            container.appendChild(element);

            // behaviours: item in index panel
            if (container.parentNode.dataset.type === 'index') {
                element.addEventListener('click', () => ui.panel.create(ui.panel.template.panelIndex, { id: element.dataset.id, type: element.dataset.id }));
            }
            else if (element.parentNode.parentNode.className.split(' ').find(item => templatePanelIndexId === item.id2CamelCase())) {
                element.addEventListener('click', () => ui.panel.create(ui.panel.template.panelProfile, { id: element.dataset.id, type: element.dataset.type }));
            }

            // behaviours: name elements to its gazette
            if (element.dataset.type === "gazette" && "section" in element.dataset) {
                element.header.addEventListener('click', () => ui.panel.create(ui.panel.template.panelProfile, { id: element.dataset.id, type: element.dataset.type }));   
            }

            // behaviours: close button
            closeButton = element.querySelector('.panel__close');
            if (closeButton) {
                if (!dataset.id) { // The index panel don't have close button
                    closeButton.parentNode.removeChild(closeButton);
                }
                else {
                    let footer = document.querySelector(".footer"),
                        closeAll = footer.querySelector(".footer .panel__close");

                    // close all panels
                    if (!closeAll) {
                        closeAll = closeButton.cloneNode(true);
                        closeAll.addEventListener('click', () => ui.container.querySelectorAll('.panel__close').forEach(button => button.click()));
                        footer.appendChild(closeAll);
                    }

                    // close the panel
                    closeButton.addEventListener('click', () => {
                        element.parentNode.removeChild(element);
                        if (document.querySelectorAll('.panel__close').length === 1) {
                            footer.removeChild(closeAll);
                        }
                    });
                }
            }

            // update data
            ui.panel.update(element);

            return element;
        },
        "update": (container) => {
            var structure = container.className.split(' ').find(itemClass => ui.panel.template[itemClass.id2CamelCase()]).id2CamelCase();

            // Clean content
            if (container.shortcuts) {
                for (let shortcut in container.shortcuts) {
                    container[shortcut].removeChildren()   
                }
            }
            else {
                container.removeChildren();
            }

            // Fill content
            switch (structure) {
                case ui.panel.template.listItem.id.id2CamelCase():
                    if (container.dataset.type === 'index') {
                        container.appendChild(document.createTextNode(i18n[ui.lang].type[container.dataset.id]));
                    }
                    else {
                        let element = ui.data[container.dataset.type].find(item => item.id == container.dataset.id);
                        
                        if (element.type === 'gazette') {
                            element = fullname(element);
                        }
                        else {
                            element = element.name[ui.lang] || (lang => `<span lang="${lang}">${element.name[lang]}</span>`)(ui.lang === 'en' ? 'es' : 'en');
                        }
                        container.insertAdjacentHTML("beforeend", element);
                    }
                    break;

                case ui.panel.template.listItemItem.id.id2CamelCase():
                    if (container.dataset.type === "gazette") {
                        let content = '',
                            gazette = ui.data.gazette.find(gazette => gazette.id === parseInt(container.dataset.id, 10));

                        container.header.appendChild(document.createTextNode(`${i18n[ui.lang].gazettes} ${fullname(gazette)}`));

                        // content
                        switch (container.dataset.section) {
                            case "classyfrieds":
                                content = gazette.sections[container.dataset.section][container.dataset.number];
                                content = '<blockquote class="item__message">{0}</blockquote><cite class="item__author">{1}</cite>'.format(content.message[ui.lang], content.reference[ui.lang]);
                                break;

                            case "daryl's letters":
                            case "monthly news":
                            case "perl":
                            case "recipe":
                            case "think green":
                            case "tip":
                                content = gazette.sections[container.dataset.section][ui.lang];
                                break;

                            case "david juanes' legend":
                                content = gazette.sections[container.dataset.section];
                                content = '<h5 class="item__chapter">{0} {1}</h5><blockquote class="item__message">{2}</blockquote><cite class="item__author">{3}</cite>'.format(i18n[ui.lang].translation.chapter, content.chapter + (content.title && ': ' + content.title[ui.lang] || ''), content.content[ui.lang], content.author[ui.lang]);
                                break;

                            default:
                                content = gazette.sections[container.dataset.section][container.dataset.number][ui.lang];
                        }

                        if (content) {
                            container.content.insertAdjacentHTML("beforeend", content);
                        }
                    }
                    break;

                case ui.panel.template.panelIndex.id.id2CamelCase():
                    container.shortcuts.header.appendChild(document.createTextNode(i18n[ui.lang].type[container.dataset.type]));
                    
                    // content
                    if (container.dataset.id) {
                        if (container.dataset.id === "gazette") {
                            ui.data[container.dataset.type].sort((a, b) => b.id - a.id).forEach(item => ui.panel.create(ui.panel.template.listItem, { id: item.id, type: item.type }, container.content));
                        }
                        else {
                            ui.data[container.dataset.type].sort((a, b) => (a.name[ui.lang] || '').parseId().localeCompare((b.name[ui.lang] || '').parseId())).forEach(item => ui.panel.create(ui.panel.template.listItem, { id: item.id, type: item.type }, container.content));
                        }
                    }
                    else {
                        Object.keys(ui.data).sort((a, b) => (i18n[ui.lang].type[a] || '').toLowerCase().localeCompare((i18n[ui.lang].type[b] || '').toLowerCase())).forEach(item => ui.panel.create(ui.panel.template.listItem, { id: item, type: container.dataset.type }, container.content));
                    }
                    break;

                case ui.panel.template.panelProfile.id.id2CamelCase():
                    let content = {},
                        element = ui.data[container.dataset.type].find(o => o.id == container.dataset.id),
                        name;
                    
                    // name
                    if (element.type === "gazette") {
                        name = `${i18n[ui.lang].gazettes} ${fullname(element)}`;
                    }
                    else {
                        name = element.name[ui.lang] || (lang => `<span lang="${lang}">${element.name[lang]}</span>`)(ui.lang === 'en' ? 'es' : 'en');
                    }
                    // url
                    if (element.url) {
                        let url = element.url[ui.lang];
                        if (['//', 'ht'].indexOf(url.substring(0, 2)) === -1) {
                            url = i18n[element.type === "gazette" ? "es" : ui.lang].url.web + url;
                        }
                        name = `<a class="panel__name-link" href="${url}" target="${element.id} ${ui.lang}">${name}</a>`;
                    }

                    container.header.insertAdjacentHTML("beforeend", name);

                    // content
                    if (container.dataset.type === "gazette") {
                        Object.keys(element.sections).sort((a, b) => i18n[ui.lang].sections[a].toLowerCase().localeCompare(i18n[ui.lang].sections[b])).forEach(section => {
                            let list = ui.panel.create(ui.panel.template.regionItemList, { id: section, type: "gazette" }, container.content);

                            if (Array.isArray(element.sections[section])) {
                                element.sections[section].forEach((item, index) => ui.panel.create(ui.panel.template.listItemItem, { id: element.id, number: index, "section": section, type: "gazette" }, list.content));    
                            }
                            else {
                                ui.panel.create(ui.panel.template.listItemItem, { id: element.id, "section": section, type: "gazette" }, list.content);    
                            }
                        });
                    }
                    else {
                        if (element.description) {
                            container.content.insertAdjacentHTML('beforeend', element.description[ui.lang]);
                        }

                        ui.data.gazette.sort((a, b) => a.id - b.id).forEach(gazette => {
                            feed(container.dataset.id, container.dataset.type, gazette, content);
                        });

                        Object.keys(content).sort((a, b) => i18n[ui.lang].sections[a].toLowerCase().localeCompare(i18n[ui.lang].sections[b])).forEach(section => {
                            let list = ui.panel.create(ui.panel.template.regionItemList, { id: section, type: "gazette" }, container.content);

                            content[section].forEach(item => ui.panel.create(ui.panel.template.listItemItem, "number" in item ? { id: item.gazette.id, number: item.number, "section": section, type: "gazette" } : { id: item.gazette.id, "section": section, type: "gazette" }, list.content));
                        });
                    }
                    break;

                case ui.panel.template.regionItemList.id.id2CamelCase():
                    if (container.dataset.type === "gazette") {
                        container.header.insertAdjacentHTML("beforeend", i18n[ui.lang].sections[container.dataset.id]);
                    }
                    break;
            }

            if (container.content) {
                activateContent(container);
            }
        }
    },
    /**
     * Add element of a type.
     * @param {object} obj 
     */
    "add": function(obj) {
        if (obj.type === 'gazette') {
            // gazette url
            obj.url = Object.keys(i18n).reduce((url, lang) => addElement(lang, (lang === "en" ? "/" : "") + i18n[lang].gazette.url.format(obj.name || obj.id), url), {});
        }

        if (!this.data.hasOwnProperty(obj.type)) { // create
            this.data[obj.type] = [obj];
            // metadata
            this.data[obj.type].id = obj.type;
            this.data[obj.type].name = Object.keys(i18n).reduce((name, lang) => addElement(lang, i18n[lang].type[obj.type], name), {});
            this.data[obj.type].type = "index";
        }
        else { // update
            let item = this.data[obj.type].find(o => o.id === obj.id);
            if (item) {
                let lang = Object.keys(obj.name)[0]; // first property
                if (Object.keys(item.name).indexOf(lang) === -1) {
                    item.name[lang] = obj.name[lang];
                }
            }
            else {
                this.data[obj.type].push(obj);
            }
        }

        if (obj.type === "gazette") {
            // update data
            for (let lang in i18n) {
                // Search elements linked
                Array.prototype.slice.call(getTexts(obj.sections, lang).parseHTML('*')).filter(tag => tag.tagName.toLowerCase().indexOf('punka') === 0).forEach(function(item) {
                    let element = {
                        "id": item.dataset.id || item.textContent.parseId(),
                        "name": {},
                        "type": item.tagName.toLowerCase().substring(item.tagName.indexOf('-') + 1)
                    };
                    /**
                     * Se asegura de que la primera letra del nombre esté en mayúsculas.
                     * 
                     * @credits
                     * http://www.corelangs.com/js/string/cap.html
                     */
                    element.name[this] = item.dataset.name || item.textContent.replace(/^[a-z]/, str => str.toUpperCase());
                    
                    ui.add(element);
                }.bind(lang));
            }
        }
    },
    /**
     * Initialize UI.
     */
    "init": function() {
        source.forEach(this.add.bind(this)); // Feed content
        this.lang = getParameter('l'); // Set language of the content
    },
    /**
     * Show data
     */
    "render": function() {
        this.panel.create(this.panel.template.panelIndex, { type: "index" }); // Create the index
        this.render = this.update; // Only the first time is render
    },
    /**
     * Show updated data
     */
    "update": function() {
        document.querySelectorAll('.panel').forEach(this.panel.update);
    }
};

// Language UI
;
(function(lang) {
    let footerLink = document.querySelector('.footer__link');
    let headerLink = document.querySelector('.header__link');
    let languages = document.querySelector('.languages');

    Object.defineProperty(ui, 'lang', {
        get: function() { return lang; },
        set: function (value) { 
            lang = value === 'en' ? 'en' : 'es';
            
            document.documentElement.lang = lang;
            document.title = i18n[lang].title;
            
            // update languages nav
            languages.removeChildren();
            Object.keys(i18n).forEach(lang => {
                let isCurrent = lang === this.lang;
                let clone = importNode(document.querySelector(`#template-language_theme_${isCurrent ? 'current' : 'trigger'}`), 'li');
                let item = clone.querySelector('.language__item');
                item.appendChild(document.createTextNode(i18n[lang].name));
                if (!isCurrent) {
                    item.lang = lang;
                    item.addEventListener('click', () => ui.lang = lang);
                }
                languages.appendChild(clone);
            });

            // update links
            headerLink.href = i18n[lang].url.web;
            footerLink.href = ['web', 'gazettes'].reduce((previous, current) => previous + i18n[lang].url[current], '');
            footerLink.textContent = i18n[lang].gazettes;

            this.render();
        }
    });
})(document.documentElement.lang);

ui.init();