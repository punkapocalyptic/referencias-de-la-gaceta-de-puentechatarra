/* ==========================================================================
    UTILIDADES
    ========================================================================== */




/* Extensiones
   ========================================================================== */


/**
 * Eliminación de los hijos del elemento HTML.
 */
HTMLElement.prototype.removeChildren = function() {
    while (this.firstChild) {
        this.removeChild(this.firstChild);
    }
};


/**
 * Devuelve un NodeList construido desde el texto.
 */
(function(parser) {
    String.prototype.parseHTML = function(selector) {
        return parser.parseFromString(this, 'text/html').querySelectorAll(selector || 'body > *');
    }
})(new DOMParser());


/**
 * Simulación básica del `String.Format` de `.NET`.
 */
String.prototype.format = function() {
    return Array.prototype.slice.call(arguments).reduce((accumulator, currentValue, currentIndex) => accumulator.replaceAll(`{${currentIndex}}`, currentValue), this);
};


/**
 * Devuelve la cadena de identificador con formato Camel.
 * 
 * @credits
 * https://www.experts-exchange.com/questions/26495619/Javascript-with-Regular-Expression-to-extract-string-and-convert-to-camel-case.html
 */
String.prototype.id2CamelCase = function() {
    return this.replace("_theme_", "-").replace("_section_", "-").replace("template-", "").split('-').reduce((words, word, index) => {
        if (index > 0) {
            if (word.length > 1) {
                words.push(word.charAt(0).toUpperCase() + word.substring(1).toLowerCase());
            }
            else if (word.length > 0) {
                words.push(word.toUpperCase());
            }
        }
        else if (word.length > 0) {
            words.push(word.toLowerCase());
        }

        return words;
    }, []).join('');
};


/**
 * Devuelve la `clave` de un texto.
 * - Minúsculas
 * - Normalización (sustitución de caracteres especiales)
 * - Sustitución de espacios por `-`
 * - Eliminación de resto de caracteres especiales que no hayan sido sustituidos en el proceso de normalización
 */
String.prototype.parseId = function() {
    var str = this;
    // http://dense13.com/blog/2009/05/03/converting-string-to-slug-javascript/
    str = str.replace(/^\s+|\s+$/g, ''); // trim
    str = str.toLowerCase();
    
    // remove accents, swap ñ for n, etc
    var from = "àáäâèéëêìíïîòóöôùúüûñç·/_,:;";
    var to   = "aaaaeeeeiiiioooouuuunc------";
    for (var i=0, l=from.length ; i<l ; i++) {
        str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
    }

    str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
        .replace(/\s+/g, '-') // collapse whitespace and replace by -
        .replace(/-+/g, '-'); // collapse dashes

    return str;
};



/**
 * Reemplazo de todas las coincidencias.
 *
 * @credits
 * https://stackoverflow.com/questions/1144783/how-to-replace-all-occurrences-of-a-string-in-javascript
 *
 * @param {string} search Cadena buscada
 * @param {string} replacement Cadena de reemplazo
 */
String.prototype.replaceAll = function(search, replacement) {
    return this.replace(new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), 'g'), replacement); // $& means the whole matched string;
};




/* Utilidades
   ========================================================================== */


/**
 * Prepara el contenido para el resaltado y activación de elementos.
 *
 * @param {HTMLElement} container
 */
const activateContent = container => {
    let context = container;

    while (!context.classList.contains("panel")) {
        context = context.parentNode;
    }

    container.content.querySelectorAll('*').forEach(item => {
        if (item.tagName.toLowerCase().indexOf("punka-") === 0) {
            let id = item.dataset.id || item.textContent.parseId(),
                type = item.tagName.toLowerCase().replaceAll("punka-", "");
            if (id === context.dataset.id && type === context.dataset.type) {
                item.insertAdjacentHTML("beforebegin", `<strong>${item.textContent}</strong>`);
            }
            else {
                item.insertAdjacentHTML("beforebegin", `<mark data-id="${id}" data-type="${type}">${item.textContent}</mark>`);
                item.previousSibling.addEventListener('click', function() {
                    ui.panel.create(ui.panel.template.panelProfile, { id: this.dataset.id, type: this.dataset.type });
                });
            }
            item.parentNode.removeChild(item);
        }
    });
};


/**
 * Add an element in asociative Array.
 * @param {string} key 
 * @param {string} value 
 * @param {object} array 
 */
const addElement = (key, value, array) => {
    array[key] = value;
    return array;
};


/**
 * Asignar la función a los elementos ante un evento.
 * 
 * @param {NodeList} nodes 
 * @param {string} event 
 * @param {Function} callback 
 */
const addEventListeners = function(nodes, event, callback) {
    nodes.forEach(node => node.addEventListener(event, callback));
};


/**
 * Feed data linked from the gazette
 * @param {string} id 
 * @param {string} type 
 * @param {object} gazette 
 * @param {object} data 
 */
const feed = function(id, type, gazette, data) {
    /**
     * Add the element of section if the element is finded.
     * @param {object} source 
     * @param {string} section 
     * @param {object} config 
     */
    const add = (source, section, config) => {
        if (contains(source)) {
            if (!data[section]) {
                data[section] = [config];
            }
            else if (data[section].indexOf(config) === -1) {
                data[section].push(config);
            }
        }
    };


    /**
     * Element is in source
     * @param {object} source
     * @returns {boolean}
     */
    const contains = (source) => !!Array.prototype.slice.call(getTexts(source, ui.lang).parseHTML(`punka-${type}`)).find(candidate => id === (candidate.dataset.id || candidate.textContent.parseId()));
    
    for (let section in gazette.sections) {
        if (Array.isArray(gazette.sections[section])) {
            gazette.sections[section].forEach((item, index) => {
                add(item, section, { "gazette": gazette, "number": index });
            });
        }
        else {            
            add(gazette.sections[section], section, { "gazette": gazette });
        }
    }
};


/**
 * Obtención del valor de un parámetro de la URL.
 *
 * @param {string} param
 */
const getParameter = function(param) {
    let parameter = location.search.substring(1).split('&').find(parameter => parameter.substring(0, '=') === param);

    if (parameter) {
        parameter = parameter.substring((param + '=').length);
    }

    return parameter;
};


/**
 * Fullname gazette.
 * @param {object} gazette 
 * @return {string}
 */
const fullname = (gazette) => (gazette.year ? `${i18n[ui.lang].gazette.year} ${gazette.year} ` : '') + (gazette.name ? `${i18n[ui.lang].gazette.number} ${gazette.name}` : (ui.lang === "es" ? i18n[ui.lang].gazette.number : '#') + gazette.id);


/**
 * Extract all texts in the same language.
 * @param {object} source 
 * @param {string} lang 
 * @returns {string} All texts together
 */
const getTexts = function(source, lang) {
    let texts = "";
    // found
    if (source[lang]) {
        return source[lang];
    }
    // search in children
    for (let property in source) {
        texts += getTexts(source[property], lang);
    }

    return texts;
};


/**
 * Import template.
 * 
 * @credits
 * https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template
 * https://www.w3schools.com/TagS/tag_template.asp
 * 
 * @param {object} template
 * @param {string}
 * @returns {object}
 */
const importNode = (template, selector) => document.importNode(template.content, true).querySelector(selector);