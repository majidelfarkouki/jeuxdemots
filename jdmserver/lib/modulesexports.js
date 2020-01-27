let iconv = require("iconv-lite");
var express = require("express");
var request = require("request");
var cheerio = require("cheerio");
var mkdirp = require("mkdirp");
var https = require('https');
var cors = require("cors");
var fs = require("fs");
var MongoClient = require("mongodb").MongoClient;

let term_cache_directorypath, infos_filepath, definitions_filepath, relationships_types_filepath, incoming_relationships_filepath, outgoing_relationships_filepath;
let cache_directory = process.env.CACHE_DIRECTORY.replace('~', require('os').homedir());

function loadTerm(term_searched, callback) {

    term_searched = term_searched.replace(/:/g, '_');

    // Access paths to the cache and to the definition file
    term_cache_directorypath = cache_directory + '/' + getDirectory(term_searched) + '/' + term_searched;
    infos_filepath = cache_directory + '/' + getDirectory(term_searched) + '/' + term_searched + '/infos.json';
    definitions_filepath = cache_directory + '/' + getDirectory(term_searched) + '/' + term_searched + '/definitons.json';
    relationships_types_filepath = cache_directory + '/' + getDirectory(term_searched) + '/' + term_searched + '/types.json';
    outgoing_relationships_filepath = cache_directory + '/' + getDirectory(term_searched) + '/' + term_searched + '/outgoings.json';
    incoming_relationships_filepath = cache_directory + '/' + getDirectory(term_searched) + '/' + term_searched + '/incomings.json';

    fs.exists(infos_filepath, function (exists) {
        if (!exists) {

            url_term = term_searched.replace(/\s/g, '+');
            url_term = escape(url_term);

            url = "http://www.jeuxdemots.org/rezo-dump.php?gotermsubmit=Chercher&gotermrel=" + url_term + "&rel=&output=onlyxml";
            process.stdout.write('\nURL searched: ' + url + '\n\n');

            getRemoteDumpTerm(url, function (error) {
                if (error) return callback(error);
                else return callback(null);
            });
        } else {
            return callback(null);
        }
    });
}

function getTermInfos(term_searched, callback) {

    term_cache_directorypath = cache_directory + '/' + getDirectory(term_searched) + '/' + term_searched;
    infos_filepath = cache_directory + '/' + getDirectory(term_searched) + '/' + term_searched + '/infos.json';

    fs.exists(term_cache_directorypath, function (exists) {
        if (!exists) {
            return callback('Error : ' + infos_filepath + ' n\'existe pas!', null);
        } else {
            var infos_json = require(infos_filepath);
            return callback(null, JSON.stringify(infos_json));
        }
    });
}

function getTermDefinitions(term_searched, callback) {

    term_cache_directorypath = cache_directory + '/' + getDirectory(term_searched) + '/' + term_searched;
    definitions_filepath = cache_directory + '/' + getDirectory(term_searched) + '/' + term_searched + '/definitons.json';

    fs.exists(definitions_filepath, function (exists) {
        if (!exists) {
            return callback(null, JSON.stringify([{
                def: 'Aucune définition'
            }]));
        } else {
            var definitions_json = require(definitions_filepath);
            return callback(null, JSON.stringify(definitions_json));
        }
    });
}

function getTermRelationshipsTypes(term_searched, callback) {

    term_cache_directorypath = cache_directory + '/' + getDirectory(term_searched) + '/' + term_searched;
    relationships_types_filepath = cache_directory + '/' + getDirectory(term_searched) + '/' + term_searched + '/types.json';

    fs.exists(relationships_types_filepath, function (exists) {
        if (!exists) {
            return callback(null, JSON.stringify([{
                id: 0,
                name: '',
                description: ''
            }]));
        } else {
            var relationships_types_json = require(relationships_types_filepath);
            return callback(null, JSON.stringify(relationships_types_json));
        }
    });
}


function getTermIncomingsRelationships(term_searched, callback) {

    term_cache_directorypath = cache_directory + '/' + getDirectory(term_searched) + '/' + term_searched;
    incoming_relationships_filepath = cache_directory + '/' + getDirectory(term_searched) + '/' + term_searched + '/incomings.json';

    fs.exists(incoming_relationships_filepath, function (exists) {
        if (!exists) {
            return callback(null, JSON.stringify([{
                term: 'Aucune relation entrante',
                weight: 0,
                type: null
            }]));
        } else {
            var incomings_json = require(incoming_relationships_filepath);
            return callback(null, JSON.stringify(incomings_json));
        }
    });
}


function getTermOutgoingsRelationships(term_searched, callback) {

    term_cache_directorypath = cache_directory + '/' + getDirectory(term_searched) + '/' + term_searched;
    outgoings_relationships_filepath = cache_directory + '/' + getDirectory(term_searched) + '/' + term_searched + '/outgoings.json';

    fs.exists(outgoings_relationships_filepath, function (exists) {
        if (!exists) {
            return callback(null, JSON.stringify([{
                term: 'Aucune relation sortante',
                weight: 0,
                type: null
            }]));
        } else {
            var outgoings_json = require(outgoings_relationships_filepath);
            return callback(null, JSON.stringify(outgoings_json));
        }
    });
}


/**
 * get the DUMP page from the jeuxdemots.org server then parse it and create the cache files
 */
function getRemoteDumpTerm(url, callback) {
    options = {
        uri: url,
        encoding: null
    };
    request(options, function (err, resp, html) {
        if (!err) {
            var body = iconv.decode(html, "ISO-8859-1");

            // Creation of tags to delimit parts of the recovered file to facilitate browsing
            body = body.replace("// les types de noeuds (Nodes Types) : nt;ntid;'ntname'", "<types_noeuds>");
            body = body.replace("// les noeuds/termes (Entries) : e;eid;'name';type;w;'formated name' ", "</types_noeuds><entrees>");
            body = body.replace("// les types de relations (Relation Types) : rt;rtid;'trname';'trgpname';'rthelp' ", "</entrees><types_relations>");
            body = body.replace("// les relations sortantes : r;rid;node1;node2;type;w ", "</types_relations><sortants>");
            body = body.replace("// les relations entrantes : r;rid;node1;node2;type;w ", "</sortants><entrants>");
            body = body.replace("// END", "</entrants>");
            $ = cheerio.load(body, {
                decodeEntities: false
            });

            error = $(".jdm-warning").html();
            if (error) {
                return callback("Le terme n'existe pas");
            } else {
                mkdirp(term_cache_directorypath, (err) => {
                    if (err) return callback(err);
                    else {
                        // Retrieving definitions
                        def_list = [];
                        definitions = $('def').html();
                        if (definitions) {
                            definitions = definitions.replace(/\n(\d\.\s)/g, '#@#');
                            def_list = definitions.split('#@#');
                            if (def_list.length > 0) {
                                if(def_list.length === 1)
                                    def_list[0] = def_list[0].replace(/\n<br>\n/, '');
                                definitions = [];
                                def_list.forEach(element => {
                                    definitions.push({
                                        def: element
                                    });
                                });
                                if (def_list.length > 1)
                                    definitions.shift();
                            } else {
                                definitions = [{
                                    def: 'Aucune définition'
                                }];
                            }
                        } else {
                            definitions = [{
                                def: 'Aucune définition'
                            }];
                        }
                        saveInCache(definitions_filepath, definitions, (err, data) => {
                            if (err) return callback(err);
                            else console.log(data);
                        });

                        // Retrieving related terms (entries)
                        entries = [];
                        var termes = $('entrees').html();
                        if (termes) {
                            entries_list = termes.split(/\n/);
                            entries_list.shift();
                            entries_list.shift();
                            infos = entries_list.shift();
                            entries_list.pop();
                            entries_list.pop();
                            entries_list.forEach((value, index) => {
                                // Construction de l'objet JSON contenant les entrées/termes entries[id_terme] = terme
                                elements = value.split(';');
                                if (elements[2]) {
                                    if (elements.length === 5) {
                                        elements[2] = elements[2].replace(/^'/g, "");
                                        elements[2] = elements[2].replace(/'$/g, "");
                                        entries[elements[1]] = elements[2];
                                    } else {
                                        // Cas où le terme formaté est présent, on l'utilise car plus explicite
                                        elements[2] = elements[2].replace(/^'/g, "");
                                        elements[2] = elements[2].replace(/'$/g, "");
                                        entries[elements[1]] = elements[5];
                                    }
                                }
                            });
                        }

                        // infos
                        if (termes) {
                            infos = infos.split(';');
                            mot = infos[2];
                            poids = infos[4];
                            identifiant = infos[1];
                            content = {
                                word: mot,
                                id: identifiant,
                                weight: poids
                            };
                        } else {
                            content = {
                                word: term,
                                id: 0,
                                weight: 0
                            };
                        }
                        saveInCache(infos_filepath, content, (err, data) => {
                            if (err) return callback(err);
                            else console.log(data);
                        });

                        // Retrieving relationship types
                        relationships_types = [];
                        relationships_types_json = [];
                        var types_relations = $('types_relations').html();
                        if (types_relations) {
                            relationships_types_list = types_relations.split(/\n/);
                            relationships_types_list.shift();
                            relationships_types_list.shift();
                            relationships_types_list.pop();
                            relationships_types_list.pop();
                            relationships_types_list.forEach((value, index) => {
                                elements = value.split(';');
                                if (elements[2]) {
                                    elements[2] = elements[2].replace(/^'/g, "");
                                    elements[2] = elements[2].replace(/'$/g, "");
                                    if (elements.length === 4)
                                        relationships_types_json.push({
                                            id: elements[1],
                                            name: elements[2],
                                            description: elements[3]
                                        });
                                    else
                                        relationships_types_json.push({
                                            id: elements[1],
                                            name: elements[2],
                                            description: elements[4]
                                        });
                                    relationships_types[elements[1]] = elements[2];
                                }
                            });
                        }
                        saveInCache(relationships_types_filepath, relationships_types_json, (err, data) => {
                            if (err) return callback(err);
                            else console.log(data);
                        });

                        // Retrieving outgoing relationships            
                        outgoings = [];
                        var sortants = $('sortants').html();
                        if (sortants) {
                            outgoings_list = sortants.split(/\n/);
                            outgoings_list.shift();
                            outgoings_list.shift();
                            outgoings_list.pop();
                            outgoings_list.pop();
                            outgoings_list.forEach((value, index) => {
                                elements = value.split(';');
                                if (elements[2]) {
                                    // Noeud 2
                                    if (elements[2] !== identifiant) {
                                        elements[2] = elements[2].replace(/^'/g, "");
                                        elements[2] = elements[2].replace(/'$/g, "");
                                        outgoings.push({
                                            id: elements[1],
                                            type: relationships_types[elements[4]],
                                            weight: elements[5],
                                            term: entries[elements[2]]
                                        });
                                    } else {
                                        // Noeud 1
                                        elements[3] = elements[3].replace(/^'/g, "");
                                        elements[3] = elements[3].replace(/'$/g, "");
                                        outgoings.push({
                                            id: elements[1],
                                            type: relationships_types[elements[4]],
                                            weight: elements[5],
                                            term: entries[elements[3]]
                                        });
                                    }
                                }
                            });
                        } else {
                            outgoings = [{
                                id: 0,
                                type: '',
                                weight: 0,
                                term: 'Aucune relation sortante'
                            }];
                        }
                        saveInCache(outgoing_relationships_filepath, outgoings, (err, data) => {
                            if (err) return callback(err);
                            else console.log(data);
                        });

                        // Retrieving incoming relationships           
                        incomings = [];
                        var entrants = $('entrants').html();
                        if (entrants) {
                            incomings_list = entrants.split(/\n/);
                            incomings_list.shift();
                            incomings_list.shift();
                            incomings_list.pop();
                            incomings_list.pop();
                            incomings_list.forEach((value, index) => {
                                elements = value.split(';');
                                if (elements[2]) {
                                    // Noeud 2
                                    if (elements[2] !== identifiant) {
                                        elements[2] = elements[2].replace(/^'/g, "");
                                        elements[2] = elements[2].replace(/'$/g, "");
                                        incomings.push({
                                            id: elements[1],
                                            type: relationships_types[elements[4]],
                                            weight: elements[5],
                                            term: entries[elements[2]]
                                        });
                                    } else {
                                        // Noeud 1
                                        elements[3] = elements[3].replace(/^'/g, "");
                                        elements[3] = elements[3].replace(/'$/g, "");
                                        incomings.push({
                                            id: elements[1],
                                            type: relationships_types[elements[4]],
                                            weight: elements[5],
                                            term: entries[elements[3]]
                                        });
                                    }
                                }
                            });
                        } else {
                            incomings = [{
                                id: 0,
                                type: '',
                                weight: 0,
                                term: 'Aucune relation entrante'
                            }];
                        }
                        saveInCache(incoming_relationships_filepath, incomings, (err, data) => {
                            if (err) return callback(err);
                            else {
                                console.log(data);
                                return callback(null);
                            }
                        });
                    }
                });
            }


        }
    });
}

/**
 * Save past content to a json file
 */
function saveInCache(filepath, content, callback) {
    fs.writeFile(filepath, JSON.stringify(content), 'UTF-8', (err) => {
        if (err) return callback(err, null);
        else {
            process.stdout.write(filepath + ' saved');
            return callback(null, filepath + ' saved');
        }
    });
}

function getAutoCompl(characters, callback) {
    MongoClient.connect(process.env.MONGO_DB_URL, function (error, client) {
        if (error) {
            console.error(error);
            return;
        }

        var collection = 'words_';
        var first_character = characters.charAt(0).toLowerCase();

        if (first_character === 'a' || first_character === 'à' || first_character === 'â') {
            collection += 'a';
        } else if (first_character === 'e' || first_character === 'é' || first_character === 'è' || first_character === 'ê' || first_character === 'ë') {
            collection += 'e';
        } else if (first_character === 'i' || first_character === 'î' || first_character === 'ï') {
            collection += 'i';
        } else if (first_character === 'o' || first_character === 'ô' || first_character === 'ö') {
            collection += 'o';
        } else if (first_character === 'u' || first_character === 'û' || first_character === 'ù' || first_character === 'ü') {
            collection += 'u';
        } else {
            collection += first_character;
        }

        var re = new RegExp("\^" + characters);
        terms = client.db('jdm').collection(collection).find({
            word: re
        }).sort({
            weight: -1
        }).limit(5).toArray((err, docs) => {
            return callback(docs);
        });
    });
}

/**
 * Returns the letter of the directory where the term cache must be
 */
function getDirectory(term) {
    var fstChar = term.charAt(0).toLowerCase();

    if (fstChar === 'a' || fstChar === 'à' || fstChar === 'â') {
        return 'a';
    } else if (fstChar === 'e' || fstChar === 'é' || fstChar === 'è' || fstChar === 'ê' || fstChar === 'ë') {
        return 'e';
    } else if (fstChar === 'i' || fstChar === 'î' || fstChar === 'ï') {
        return 'i';
    } else if (fstChar === 'o' || fstChar === 'ô' || fstChar === 'ö') {
        return 'o';
    } else if (fstChar === 'u' || fstChar === 'û' || fstChar === 'ù' || fstChar === 'ü') {
        return 'u';
    } else if (fstChar === '_' || fstChar === '=') {
        return 'special';
    } else {
        return fstChar;
    }
}

module.exports.getAutoCompl = getAutoCompl;
module.exports.loadTerm = loadTerm;
module.exports.getTermInfos = getTermInfos;
module.exports.getTermDefinitions = getTermDefinitions;
module.exports.getTermRelationshipsTypes = getTermRelationshipsTypes;
module.exports.getTermIncomingsRelationships = getTermIncomingsRelationships;
module.exports.getTermOutgoingsRelationships = getTermOutgoingsRelationships;