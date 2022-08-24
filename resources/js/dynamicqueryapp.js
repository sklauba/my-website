//=========================================================
// dynamicqueryapp.js
// Copyright 2021, Tommy Dato, all rights reserved
//=========================================================

/***
 * Maybe go towards an object oriented approach on a future refactor
 */
class DynamicQuery {
    constructor(fields, keys, srcdb, tgtdb, srctbl, tgttbl) {
        this.fields = fields;
        this.keys = keys;
        this.srcdb = srcdb;
        this.tgtdb = tgtdb;
        this.srctbl = srctbl;
        this.tgttbl = tgttbl;
        this.viewName = '';
        this.trimmedview = '';
        this.upsert = '';
        this.update = '';
        this.insertonly = '';
        this.delete = '';
    }

}
//=========================================================
// globals
//=========================================================
var gFieldMap;
var gKeyMap;
var gSrcdb;
var gTgtdb;
var gSrctbl;
var gTgttbl;
var gViewName;
var gLoadTbl;
var gUseTbl;
var gViewDb;
var gFilterView;

//=========================================================
// button presses
//=========================================================

function useScriptOrTable(event) {
    if (event.value === "table") {
        gUseTbl = true;
    } else {
        gUseTbl = false;
    }

}
function submitSelection() {
    if (checkForm() != 0) {
        alert("All fields must be fileld out, in order to submit!");
        return;
    } else {
        var fieldMap = parseFieldTable();
        gKeyMap = getSelectedKeys();
        var viewDDL = generateView(gFilterView, gFieldMap, gKeyMap, gViewDb, gSrcdb, gSrctbl);
        setElementValueById('viewddl', viewDDL);
        setElementValueById('stgtblddl', generateStgDDL(gSrcdb, gSrctbl, gFieldMap));
        var upsert = generateUpsert(fieldMap, gKeyMap, gSrcdb, gTgtdb, gSrctbl, gTgttbl, gViewName);
        setElementValueById('upsertsql', upsert);
        var update = generateUpdate(fieldMap, gKeyMap, gSrcdb, gTgtdb, gSrctbl, gTgttbl, gViewName);
        setElementValueById('updatesql', update);
        var insertOnly = generateInsertOnly(gFieldMap, gKeyMap, gSrcdb, gTgtdb, gSrctbl, gTgttbl, gViewName);
        setElementValueById('insertonlysql', insertOnly);
    }
}

function parseButton() {
    if (checkForm() != 0) {
        alert("All fields must be filled out, in order to parse!");
        return;
    } else {
        var inputText = document.getElementById("fields").value;
        var text = inputText.trim();
        var fieldMap = getFields(text);
        /**
         * This method has been commented out after the input change for keys
         * When the typing of the keys is desired, this can be turned back on
         */
        //var keyMap = mapKeys(fieldMap, getKeys());
        var keyMap = new Map();
        //console.log(keyMap);
        //var keyMap = getKey(fieldMap);
        var srcdb = "etlworkdb";
        var tgtdb = "aedwdb";
        
        
        var tgttblarr = inputText.split(" ");
        var tgttble = tgttblarr[2].split(".").pop();
        //alert(tgttble);
        var srctbl = tgttble + "_stg";
        var viewDb = 'etlviewsdb';
        viewDb = getViewDb(viewDb, tgtdb);
        //var viewName = srctbl+'_v';
        populateFieldTable(fieldMap, keyMap);
        //sendAlert("Data Parsed into selection table\nPlease verify field/key selection and continue to 'submit selection' to view results.");
        // var viewDDL = generateView(fieldMap, srcdb,srctbl);
        // setElementValueById('viewddl', viewDDL);
        // globalKeyMap = keyMap;
        // globalFieldMap = fieldMap;
        passGlobals(fieldMap, keyMap, srcdb, tgtdb, srctbl, tgttble, viewDb);
        submitSelection();
    }

}

function getViewDb(viewdbIn, tgtdb) {
    var viewdb = viewdbIn;
    if (tgtdb.toLowerCase().includes('_nonprod')) {
        viewdb += '_nonprod';
    }
    return viewdb;
}
function copyResults(valueIn) {
    var copyText = undefined;
    switch(valueIn) {
        case 1:
            copyText = document.getElementById("viewddl");
            break;
        case 2:
            copyText = document.getElementById("stgtblddl");
            break;
        case 3:
            copyText = document.getElementById("upsertsql");
            break;
        case 4:
            copyText = document.getElementById("updatesql");
            break;
        case 5:
            copyText = document.getElementById("insertonlysql");
            break;
        case 6:
            copyText = document.getElementById("deletesql");
            break;
    }
    copyText.select();
    copyText.setSelectionRange(0, 99999); /* For mobile devices */
    /* Copy the text inside the text field */
    navigator.clipboard.writeText(copyText.value);
}


function selectAllFields() {
    var selectAllBox = document.getElementById('selectAll');
    var allCB = document.querySelectorAll("input[id='checkbox1']");
    //console.log(selectAllBox.checked);
    if (selectAllBox.checked == true) {
        // it has been checked
        allCB.forEach(element => element.checked = true);
    } else {
        // unchecked
        allCB.forEach(element => element.checked = false);
    }
}

function checkSelectionBoxes() {
    var selectAllBox = document.getElementById('selectAll');
    var fieldTable = document.getElementById('fTable');
    var rows = fieldTable.getElementsByTagName('tr');
    var verifyBool = true;
    for ( var i = 1; i < rows.length; i++) {
        var cols = rows[i].getElementsByTagName('td');
        //console.log(cols);
        var tempBool = cols[0].getElementsByTagName('input')[0].checked;
        verifyBool  = verifyBool && tempBool;
    }
    //console.log(verifyBool);
    selectAllBox.checked = verifyBool;
}


//=========================================================
// Utility
//=========================================================


function getSelectedKeys() {
    var selectedKeyMap = new Map();
    var fieldTable = document.getElementById('fTable');
    var rows = fieldTable.getElementsByTagName('tr');
    for ( var i = 1; i < rows.length; i++) {
        var cols = rows[i].getElementsByTagName('td');
        //console.log(cols);
        var keyCheckBox = cols[3].getElementsByTagName('input')[0];
        if (keyCheckBox.checked) {
            var field = cols[1].innerHTML;
            var type = cols[2].innerHTML;
            selectedKeyMap.set(field, type);
        } else {
            continue;
        }
    }
    return selectedKeyMap;
}

function parseFieldTable() {
    var newFieldMap = new Map();
    var fieldTable = document.getElementById('fTable');
    var rows = fieldTable.getElementsByTagName('tr');
    for ( var i = 1; i < rows.length; i++) {
        var cols = rows[i].getElementsByTagName('td');
        //console.log(cols);
        var checkbox1 = cols[0].getElementsByTagName('input')[0];
        if (checkbox1.checked) {
            //console.log("THATSA SPICY MEAT-A-BALL")
            var field = cols[1].innerHTML;
            var type = cols[2].innerHTML;
            newFieldMap.set(field, type);
        } else {
            continue;
        }
    }
    //console.log(newFieldMap);
    return newFieldMap;
}


function populateFieldTable(fieldMap, keyMap){
    // build the html for the table into array
    var tableHTML = [];
    for (let [field, type] of fieldMap) {

        var fieldName = field;
        var dataType = type;
        var isKey = '';

        if (keyMap.has(field)) {
            isKey = 'checked';
        }

        var stringTemplate =
`<tr>
<td>
    <span class="custom-checkbox">
        <input type="checkbox" id="checkbox1" name="options[]" value="1" onclick="checkSelectionBoxes()"checked>
        <label for="checkbox1"></label>
    </span>
</td>
<td>${fieldName}</td>
<td>${dataType}</td>
<td>
    <span class="custom-checkbox">
        <input type="checkbox" id="checkboxkey" name="options[]" value="1" ${isKey}>
        <label for="checkboxkey"></label>
    </span>
</td>

</tr>`;
        tableHTML.push(stringTemplate);

    }
    document.getElementById("fieldtable").innerHTML = tableHTML.join('\n');
}



function getFields(textIn) {
    var arr = splitFieldsArr(textIn);

    arr = arrToLower(arr);
    var text = arrToNewLineString(arr);
    //text = replaceTDFields(text);
    arr = text.split('\n');
    var map = splitFieldsMap(arr);
    return map;
}

function cleanKeyInput(text) {
    var cleanText = text.trim();
    const reComma = new RegExp(",", "gim");
    var result = cleanText.replaceAll(reComma, ' ');
    var keyValue = result.split(' ');
    return keyValue[0];
}

function getKey(map) {
    var field = cleanKeyInput(document.getElementById('keys').value);
    var keyMap = new Map();
    if (map.has(field)) {
        keyMap.set(field, map.get(field));
    }
    return keyMap;
}
function mapKeys(fieldMap, keyArr) {
    var keyMap = new Map();
    var arrayLength = keyArr.length;
    for (var i = 0; i < arrayLength; i++) {
        if (fieldMap.has(keyArr[i])) {
            keyMap.set(keyArr[i], fieldMap.get(keyArr[i]));
        }
    }
    //console.log(keyMap);
    return keyMap;
}


function getKeyCompare(keyMap) {
    var keyCompArray = [];
    for (let [field, type] of keyMap.entries()) {
        if (type == 'string') {
            keyCompArray.push("trim\(a."+field+"\)=trim\(b."+field+"\)");
        } else {
            keyCompArray.push("a."+field+"=b."+field);
        }
    }
    //console.log(keyCompArray);
    return keyCompArray;
}

function getPartitionByKeys(alias, keyMap) {
    var pKeys = [];
    for (let [field, type] of keyMap.entries()) {
        if (type == 'string') {
            pKeys.push(`trim(${alias}.${field})`);
        } else {
            pKeys.push(`${alias}.${field}`);
        }
    }
    //console.log(pKeys);
    return pKeys;
}

function getKeys() {
    //console.log("getKeys here");
    var keyText = document.getElementById("keys").value;
    var cleantext = keyText.trim();
    cleantext = cleantext.replaceAll(' ', '');
    var indexOfComma = keyText.indexOf(",");
    var splitArr = [];
    if (indexOfComma != -1) {
        // more than one key
        splitArr = cleantext.toLowerCase().split(',');
    } else if (keyText == undefined) {
        return -1;
    } else {
        splitArr.push(cleantext);
    }
    return splitArr;
}

function selectViewType(event) {
    if (event.checked === true) {
        gFilterView = true;
    } else {
        gFilterView = false;
    }
}
function generateView(filtered, map, keymap, viewdb, db, tbl) {
    var viewString = '';
    if (filtered) {
        viewString = generateViewFilterDupesDDL(map, keymap, viewdb, db, tbl);
    } else {
        viewString = generateViewDDL(map, viewdb, db, tbl);
    }
    return viewString;
}
function generateViewDDL(map, viewdb, db, tbl) {
    const header_template = `CREATE VIEW ${viewdb}.${tbl}_v AS SELECT`;
    //const timestamp_template = `cast(unix_timestamp(${field}, "yyyy-MM-dd HH:mm:ss") as timestamp) ${field}`
    const footer_template = `FROM ${db}.${tbl};`
    var viewArr = [];
    var fieldArr = [];
    viewArr.push(header_template);
    for (let [key, value] of  map.entries()) {
        //console.log( key + ' ' + value);
        var field = key;
        if (value == 'timestamp') {
            fieldArr.push(`cast(unix_timestamp(${field}, "MM/dd/yyyy HH:mm:ss") as timestamp) ${field}`);
        } else {
            fieldArr.push(field);
        }
    }
    viewArr.push(fieldArr.join(',\n'));
    viewArr.push(footer_template);
    return viewArr.join('\n');
}
function generateViewFilterDupesDDL(map, keymap, viewdb, db, tbl) {
    var viewArr = [];
    var bFieldArr = [];
    var fieldArr = [];
    var pKeys = getPartitionByKeys('a', keymap);

    for (let [key, value] of  map.entries()) {
        //console.log( key + ' ' + value);
        var field = key;
        bFieldArr.push(`b.${field}`);
        if (value == 'timestamp') {
            fieldArr.push(`cast(unix_timestamp(${field}, "MM/dd/yyyy HH:mm:ss") as timestamp) ${field}`);
        } else {
            fieldArr.push(field);
        }
    }

    return getFilteredViewTemplate(bFieldArr.join(',\n'), fieldArr.join(',\n'), pKeys.join(',\n'), viewdb, db, tbl);
}

function getFilteredViewTemplate(bFields, aFields, pKeys, viewdb, db, tbl) {
    var template=`CREATE VIEW ${viewdb}.${tbl}_v AS SELECT
${bFields}
FROM (
SELECT
${aFields},
ROW_NUMBER() OVER (PARTITION BY
${pKeys}
ORDER BY a.replicated_datetime) as RNK
FROM ${db}.${tbl} a) b
WHERE b.RNK=1;
`;
    return template;
}



function sendAlert(message) {
    alert(message);
}

function passGlobals(fieldMap, keyMap, srcdb, tgtdb, srctbl, tgttbl, viewDb) {
    gFieldMap = fieldMap;
    gKeyMap = keyMap;
    gSrcdb = srcdb;
    gTgtdb = tgtdb;
    gSrctbl = srctbl;
    gTgttbl = tgttbl;
    gViewName = srctbl+'_v';
    gLoadTbl = tgttbl+'_load';
    gViewDb = viewDb;
}

function splitFieldsArr(text) {
    //console.log("splitFields");
    //console.log(text);

    var cleanText = cleanFieldsInput(text);
    //const regex1 = new RegExp("\\w+\\s+varchar?\\W+(\\w+)(\\(\\w+\\))?(, (\\w+)(\\(\\w+\\))?)*\\)|\\w+\\s*string|\\w+\\s*char?\\W+(\\w+)(\\(\\w+\\))?(, (\\w+)(\\(\\w+\\))?)*\\)|\\w+\\s+integer|\\w+\\s+smallint|\\w+\\s+tinyint|\\w+\\s+bigint|\\w+\\s*byteint|\\w+\\s+int,|\\w+\\s+int\n|\\w+\\s*timestamp|\\w+\\s+decimal?\\W+(\\w+)(\\(\\w+\\))?,\\s*\\d+\\W", "gim");
    const regex1 = new RegExp("\\w+\\s+varchar?\\W+(\\w+)(\\(\\w+\\))?(, (\\w+)(\\(\\w+\\))?)*\\)|\\w+\\s*string|\\w+\\s*char?\\W+(\\w+)(\\(\\w+\\))?(, (\\w+)(\\(\\w+\\))?)*\\)|\\w+\\s+integer|\\w+\\s+smallint|\\w+\\s+tinyint|\\w+\\s+bigint|\\w+\\s*byteint|(\\w+\\s+int?)|\\w+\\s*timestamp|\\w+\\s+decimal?\\W+(\\w+)(\\(\\w+\\))?,\\s*\\d+\\W", "gim");

    const regexNewLine = new RegExp("\n");
    var arr = [];
    arr = cleanText.match(regex1);
    arr[arr.length-1] = arr[arr.length-1].replace(regexNewLine, '');

    //console.log(arr);
    return arr;
}


function splitFieldsMap(arr) {

    var currentString;
    var indexOfSpace;
    var key;
    var value;
    var fieldMap = new Map();
    arr.forEach(function (item, index) {
        currentString = item;
        indexOfSpace = currentString.indexOf(" ");
        key = currentString.substr(0, indexOfSpace);
        value = currentString.substr(indexOfSpace + 1);

        fieldMap.set(key, value);
        //console.log(key, value);
    });
    // map.forEach(logMapElements);
    //newArr.forEach(element => console.log(element));
    return fieldMap;
}

function replaceTDFields(text)
{
    //console.log("replaceTDFields");
    // store parameter in local variable
    var result = text;

    // find and replace varchar(N) with STRING
    //console.log("regexVarChar");
    const regexVarChar = new RegExp("\\svarchar?\\W+(\\w+)(\\(\\w+\\))?(, (\\w+)(\\(\\w+\\))?)*\\)", "gim");
    result = result.replaceAll(regexVarChar, ' string');

    // find and replace char(N) with STRING
    //console.log("regexChar");
    const regexChar = new RegExp("\\schar?\\W+(\\w+)(\\(\\w+\\))?(, (\\w+)(\\(\\w+\\))?)*\\)", "gim");
    result = result.replaceAll(regexChar, ' string');

    // find and replace integer with INT
    //console.log("regexInt");
    // const regexInt = new RegExp("\\sinteger", "gim");
    // result = result.replaceAll(regexInt, ' int');

    // find and replace DATE with TIMESTAMP
    //console.log("regexDate");
    const regexDate = new RegExp("\\sdate", "gim");
    result = result.replaceAll(regexDate, ' timestamp');

    // find and replace smallint with SMALLINT
    //console.log("regexSmallInt");
    const regexSmallInt = RegExp("\\ssmallint", "gim");
    result = result.replace(regexSmallInt, ' smallint');

    // find and replace bigint with BIGINT
    //console.log("regexBigInt");
    const regexBigInt = RegExp("\\sbigint", "gim");
    result = result.replace(regexBigInt, ' bigint');

    // find and replace decimal with DECIMAL
    //console.log("regexDecimal");
    const regexDecimal = RegExp("\\sdecimal", "gim");
    result = result.replace(regexDecimal, ' decimal');

    // find and replace byteint with tinyint
    //console.log("regexDecimal");
    // const regexByteInt= RegExp("\\sbyteint", "gim");
    // result = result.replace(regexByteInt, ' tinyint');


    return result;
}

function arrToLower(arr) {
    //console.log("arrToLower");
    return arr.map(function(x){return x.toLowerCase(); })
}

function arrToNewLineString(arr) {
    //console.log("arrToNewLineString");

    return arr.join('\n');

}
function trimString(text) {
    return text.trim();
}


//=========================================================
// Get document elements by ID
//=========================================================

function getSourceDB() {
    return document.getElementById("srcdb").value;
}

function getTargetDB() {
    return document.getElementById("tgtdb").value;
}

function getSourceTBL() {
    return document.getElementById("srctbl").value;
}

function getTargetTBL() {
    return document.getElementById("tgttbl").value;
}

//=========================================================
// Clean up
//=========================================================
function cleanFieldsInput(text) {
    var cleanText = text.trim();
    const reBTick = new RegExp("`", "gim");
    var result = cleanText.replaceAll(reBTick, '');
    return result;
}
function clearGlobals() {
    gFieldMap = undefined;
    gKeyMap = undefined;
    gSrcdb = undefined;
    gTgtdb = undefined;
    gSrctbl = undefined;
    gTgttbl = undefined;
    gViewName = undefined;
}

function clearInput() {
    document.getElementById("inputform").reset();
    clearGlobals();
    resetFieldTable();
}

function clearResults() {
    document.getElementById("resultform").reset();
}

function resetFieldTable() {
    document.getElementById("fieldtable").innerHTML =
`<tr>
    <td>
        <span class="custom-checkbox">
            <input type="checkbox" id="checkbox1" name="options[]" value="1" checked>
            <label for="checkbox1"></label>
        </span>
    </td>
    <td>fieldName</td>
    <td>type</td>
    <td>
        <span class="custom-checkbox">
            <input type="checkbox" id="checkboxkey" name="options[]" value="1">
            <label for="checheckboxkeykbox1"></label>
        </span>
    </td>
</tr>`
}

//=========================================================
// Validation and Error handling
//=========================================================
function checkForm() {

    var fields = document.getElementById("fields").value.length;
    //var keys = document.getElementById("keys").value.length;
    //var scripttype = document.getElementById("scripttype").value;
    var srcdb = document.getElementById("srcdb").value.length;
    var tgtdb = document.getElementById("tgtdb").value.length;
    var srctbl = document.getElementById("srctbl").value.length;
    var tgttbl = document.getElementById("tgttbl").value.length;
    // console.log(fields);
    // console.log(keys);
    // console.log(scripttype);
    // console.log(srcdb);
    // console.log(tgtdb);
    // console.log(srctbl);
    // console.log(tgttbl);
    //scripttype < 1 ||
    if (fields < 2) {
        return -1;
    }

    return 0;
}
function setElementValueById(element, value) {
    document.getElementById(element).value = value;
}

//=========================================================
// Scripts
//=========================================================

function generateUpsert(fieldMap, keyMap, srcdb, tgtdb, srctbl, tgttbl, viewname) {
    var selectAllStatus = document.getElementById("selectAll").checked;
    var upsert = undefined;
    if (selectAllStatus) {
        upsert = generateFullUpsert(gFieldMap, keyMap, srcdb, tgtdb, srctbl, tgttbl, viewname);
    } else {
        upsert = generateCustomUpsert(fieldMap, keyMap, srcdb, tgtdb, srctbl, tgttbl, viewname);
    }
    return upsert;
}
function generateFullUpsert(fieldMap, keyMap, srcdb, tgtdb, srctbl, tgttbl, viewname) {
    var aFields = [];
    var bFields = [];
    var allFields = [];
    var joinKeys = getKeyCompare(keyMap);

    for (let field of fieldMap.keys()) {
        aFields.push('a.'+field);
        bFields.push('b.'+field);
        allFields.push(field);
    }
    var akeynulls = [];
    //var bkeynulls = [];

    for (let field of gKeyMap.keys()) {
        akeynulls.push('a.'+field+' is null');
        //bkeynulls.push('b.'+field+' is null');
    }
    var upsertFullString = undefined;
    if (gUseTbl) {
        upsertFullString = getFullUpsertTemplate(aFields.join(',\n'), bFields.join(',\n'), allFields.join(',\n'), akeynulls[0], joinKeys.join('\nand '), srcdb, tgtdb, srctbl, tgttbl, gLoadTbl, srctbl, srcdb);
    } else {
        upsertFullString = getFullUpsertTemplate(aFields.join(',\n'), bFields.join(',\n'), allFields.join(',\n'), akeynulls[0], joinKeys.join('\nand '), srcdb, tgtdb, srctbl, tgttbl, gLoadTbl, viewname, gViewDb);
    }
    //console.log(upsertString);
    return upsertFullString;
}

/*function getFullUpsertTemplateNoDuplicates(aFields, bFields, cFields, allFields, akeynulls, pKeys, keycomp, srcdb, tgtdb, srctbl, tgttbl, loadtbl, viewname, viewdb) {
    var template =`refresh ${tgtdb}.${tgttbl};
refresh ${srcdb}.${srctbl};
refresh ${tgtdb}.${loadtbl};

INSERT OVERWRITE TABLE ${tgtdb}.${loadtbl}
(
${allFields}
)

select
${cFields}
from ( select
${aFields}
ROW_NUMBER() OVER (PARTITION BY
${pKeys}
ORDER BY a.replicated_datetime
) AS RNK
from ${viewdb}.${viewname} a) c
where c.RNK=1
UNION ALL
select
${bFields}
from ${tgtdb}.${tgttbl} b
left join ${viewdb}.${viewname} a
on
${keycomp}
where
${akeynulls};
`;
return template;
}*/

function getFullUpsertTemplate(aFields, bFields, allFields, akeynulls, keycomp, srcdb, tgtdb, srctbl, tgttbl, loadtbl, viewname, viewdb) {
        var template =`refresh ${tgtdb}.${tgttbl};
refresh ${srcdb}.${srctbl};
refresh ${tgtdb}.${loadtbl};

INSERT OVERWRITE TABLE ${tgtdb}.${loadtbl}
(
${allFields}
)

select
${aFields}
from ${viewdb}.${viewname} a
UNION ALL
select
${bFields}
from ${tgtdb}.${tgttbl} b
left join ${viewdb}.${viewname} a
on
${keycomp}
where
${akeynulls};
`;
    return template;
}

function generateCustomUpsert(fieldMap, keyMap, srcdb, tgtdb, srctbl, tgttbl, viewname) {
    var aFields = [];
    var bFields = [];
    var allFields = [];
    var joinKeys = getKeyCompare(keyMap);
    for (let field of gFieldMap.keys()) {
        aFields.push('a.'+field);
        bFields.push('b.'+field);
        allFields.push(field);
    }
    var akeynulls = [];
    var bkeynulls = [];

    for (let field of gKeyMap.keys()) {
        akeynulls.push('a.'+field+' is null');
        bkeynulls.push('b.'+field+' is null');
    }
    let chosenFields = [];
    for (let field of gFieldMap.keys()) {
        if (fieldMap.has(field)) {
            chosenFields.push('a.'+field)
        } else {
            chosenFields.push('b.'+field);
        }
    }
    var upsertString = undefined;
    if (gUseTbl) {
        upsertString = getCustomUpsertTemplate(chosenFields.join(',\n'), aFields.join(',\n'), bFields.join(',\n'), allFields.join(',\n'), akeynulls[0], bkeynulls[0], joinKeys.join('\nand '), srcdb, tgtdb, srctbl, tgttbl, gLoadTbl, srctbl, srcdb);
    } else {
        upsertString = getCustomUpsertTemplate(chosenFields.join(',\n'), aFields.join(',\n'), bFields.join(',\n'), allFields.join(',\n'), akeynulls[0], bkeynulls[0], joinKeys.join('\nand '), srcdb, tgtdb, srctbl, tgttbl, gLoadTbl, viewname, gViewDb);
    }

    //console.log(upsertString);
    return upsertString;
}



function getCustomUpsertTemplate(chosenFields, aFields, bFields, allFields, akeynulls, bkeynulls,keycomp, srcdb, tgtdb, srctbl, tgttbl, loadtbl, viewname, viewdb){
    var template =`refresh ${tgtdb}.${tgttbl};
refresh ${srcdb}.${srctbl};
refresh ${tgtdb}.${loadtbl};

INSERT OVERWRITE TABLE ${tgtdb}.${loadtbl}
(
${allFields}
)

select
${aFields}
from ${viewdb}.${viewname} a
left join ${tgtdb}.${tgttbl} b
on
${keycomp}
where
${bkeynulls}
UNION ALL
select
${chosenFields}
from ${viewdb}.${viewname} a
join ${tgtdb}.${tgttbl} b
on
${keycomp}
UNION ALL
select
${bFields}
from ${viewdb}.${viewname} a
right join ${tgtdb}.${tgttbl} b
on
${keycomp}
where
${akeynulls};
`;
    return template;
}

function generateUpdate(fieldMap, keyMap, srcdb, tgtdb, srctbl, tgttbl, viewname){
    var aFields = [];
    var bFields = [];
    var allFields = [];
    var joinKeys = getKeyCompare(keyMap);
    for (let field of gFieldMap.keys()) {
        aFields.push('a.'+field);
        bFields.push('b.'+field);
        allFields.push(field);
    }
    var akeynulls = [];
    var bkeynulls = [];

    for (let field of gKeyMap.keys()) {
        akeynulls.push('a.'+field+' is null');
        bkeynulls.push('b.'+field+' is null');
    }
    let chosenFields = [];
    for (let field of gFieldMap.keys()) {
        if (fieldMap.has(field)) {
            chosenFields.push('a.'+field)
        } else {
            chosenFields.push('b.'+field);
        }
    }
    var updateString = undefined;
    if (gUseTbl) {
        updateString = getUpdateTemplate(chosenFields.join(',\n'), allFields.join(',\n'), aFields.join(',\n'), bFields.join(',\n'), akeynulls[0], bkeynulls[0], joinKeys.join('\nand '), srcdb, tgtdb, srctbl, tgttbl, gLoadTbl, srctbl, srcdb);
    } else {
        updateString = getUpdateTemplate(chosenFields.join(',\n'), allFields.join(',\n'), aFields.join(',\n'), bFields.join(',\n'), akeynulls[0], bkeynulls[0], joinKeys.join('\nand '), srcdb, tgtdb, srctbl, tgttbl, gLoadTbl, viewname, gViewDb);
    }
    //console.log(upsertString);
    return updateString;
}
function getUpdateTemplate(chosenFields, allFields, aFields, bFields, akeynulls, bkeynulls,keycomp, srcdb, tgtdb, srctbl, tgttbl,loadtbl, viewname, viewdb){
    var template =`refresh ${tgtdb}.${tgttbl};
refresh ${srcdb}.${srctbl};
refresh ${tgtdb}.${loadtbl};

INSERT OVERWRITE TABLE ${tgtdb}.${loadtbl}
(
${allFields}
)

select
${chosenFields}
from ${viewdb}.${viewname} a
join ${tgtdb}.${tgttbl} b
on
${keycomp}
UNION ALL
select
${bFields}
from ${viewdb}.${viewname} a
right join ${tgtdb}.${tgttbl} b
on
${keycomp}
where
${akeynulls};
`;
    return template;
}

function generateInsertOnly(fieldMap, keyMap, srcdb, tgtdb, srctbl, tgttbl, viewname){
    var aFields = [];
    var bFields = [];
    var allFields = [];
    var joinKeys = getKeyCompare(keyMap);
    for (let field of fieldMap.keys()) {
        aFields.push('a.'+field);
        bFields.push('b.'+field);
        allFields.push(field);
    }
    var akeynulls = [];
    var bkeynulls = [];

    for (let field of gKeyMap.keys()) {
        akeynulls.push('a.'+field+' is null');
        bkeynulls.push('b.'+field+' is null');
    }
    var insertOnlyString = undefined;
    if (gUseTbl) {
        insertOnlyString = getInsertOnlyTemplate(allFields.join(',\n'), aFields.join(',\n'), bFields.join(',\n'), akeynulls[0], bkeynulls[0], joinKeys.join('\nand '), srcdb, tgtdb, srctbl, tgttbl, gLoadTbl, srctbl, srcdb);
    } else {
        insertOnlyString = getInsertOnlyTemplate(allFields.join(',\n'), aFields.join(',\n'), bFields.join(',\n'), akeynulls[0], bkeynulls[0], joinKeys.join('\nand '), srcdb, tgtdb, srctbl, tgttbl, gLoadTbl, viewname, gViewDb);

    }
    //console.log(upsertString);
    return insertOnlyString;
}
function getInsertOnlyTemplate(allFields, aFields, bFields, akeynulls, bkeynulls,keycomp, srcdb, tgtdb, srctbl, tgttbl, loadtbl, viewname, viewdb){
    var template=`refresh ${tgtdb}.${tgttbl};
refresh ${srcdb}.${srctbl};
refresh ${tgtdb}.${loadtbl};

INSERT OVERWRITE TABLE ${tgtdb}.${loadtbl}
(
${allFields}
)

select
${aFields}
from
${viewdb}.${viewname} a
left join ${tgtdb}.${tgttbl} b
on
${keycomp}
where
${bkeynulls}
UNION ALL
select
${bFields}
from ${tgtdb}.${tgttbl} b;
`;
    return template
}
// !TODO: FIX THIS
function generateDelete(fieldMap, keyMap, srcdb, tgtdb, srctbl, tgttbl){
    var aFields = [];
    var bFields = [];
    var joinKeys = getKeyCompare(keyMap);
    for (let field of gFieldMap.keys()) {
        aFields.push('a.'+field);
        bFields.push('b.'+field);
    }
    var akeynulls = [];
    var bkeynulls = [];

    for (let field of gKeyMap.keys()) {
        akeynulls.push('a.'+field+' is null');
        bkeynulls.push('b.'+field+' is null');
    }

    var insertOnlyString = getUpdateTemplate(aFields.join(',\n'), bFields.join(',\n'), akeynulls[0], bkeynulls[0], joinKeys.join('\nand '), srcdb, tgtdb, srctbl, tgttbl);
    //console.log(upsertString);
    return insertOnlyString;
}
// !TODO: FIX THIS
function getInsertDelete(aDeleteFields, bDeleteFields, aFields, bFields, akeynulls, bkeynulls,keycomp, srcdb, tgtdb, srctbl, tgttbl){
/*select
all
from main
where delete fields from main NOT IN
select delete fields from view*/
    var template = `select
${bFields}
where
${bDeleteFields}
NOT IN (
select
${aDeleteFields}
)`;
}


function generateStgDDL(srcdb, srctbl, fieldMap) {
    var fields = []
    for (let [field, type] of fieldMap.entries()) {
        if (type.toLowerCase() === 'timestamp') {
            fields.push(`${field} string`);
        } else {
            fields.push(`${field} ${type}`);
        }
    }
    return getStgDDLTemplate(srcdb, srctbl, fields.join(',\n'));
}
function getStgDDLTemplate(srcdb, srctbl, fields) {
    var template =`CREATE TABLE ${srcdb}.${srctbl} (
${fields}) STORED AS PARQUET;`;
    return template;
}