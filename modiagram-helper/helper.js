// Standardwerte für das Diagramm
let orbital_width = 0.8;
let orbital_distance = 0.2;
let column_width = 3;

let compact = false;
let energy_scale = false;

let disable_mathjax = false;

let dark_mode = false;



var preview = '';
var minX = 100;
var maxX = -100;
var minY = 100;
var maxY = -100;

let cache = {};

function switchTheme() {
    dark_mode = !dark_mode;
    const themeLink = document.getElementById('theme-link');
    if (dark_mode) {
        themeLink.href = './css/style-dark.css';
        return;
    }
    themeLink.href = './css/style-light.css';
    return;
}

const onchange = 'evaluateIt();';

function addInputArea(name) {
    const titles = {
        left: 'atom orbitals: ',
        middle: 'molecular orbitals: ',
        right: 'atom orbitals: '
    };
    const div = document.createElement('div');
    div.className = 'input-area';
    div.innerHTML = `
            <table class="nice_box" id="orbitals_${name}">
                <h3>${titles[name]}<input type="text" id="column_label_${name}" onchange="${onchange}" value=""></h3>
                <tr>
                    <th>$h\\nu$</th>
                    <th>$\\Gamma$</th>
                    <th>$g_i$</th>
                    <th>$\\upharpoonleft\\downharpoonright $</th>
                    <th>label</th>
                </tr>
            </table>
            <button class="add_orbital" onclick="addOrbital('`+ name + `', 0, 'a1', 1, 0, '');${onchange}">+</button>`;
    document.getElementById('dreispalten').appendChild(div);
}

function addOrbital(placement, initialenergy, initialsymmetry, initialdegeneration, initialelectrons, initiallabel) {
    const div = document.createElement('tr');
    div.className = 'orbitals_data_' + placement;
    div.innerHTML = `<td><input type="number" step="0.1" class="energy" onchange="${onchange}" value="${initialenergy}"></td>
            <td><input type="text" step="0.1" class="symmetry" onchange="${onchange}" value="${initialsymmetry}"></td>
            <td><input type="number" min="1" step="1" class="degeneration" onchange="${onchange}" value="${initialdegeneration}"></td>
            <td><input type="number" min="0" step="1" class="electrons" onchange="${onchange}" value="${initialelectrons}"></td>
            <td><input type="text" class="label" onchange="${onchange}" value="${initiallabel}"></td>
            <button class="remove_orbital" onclick="this.parentElement.remove();${onchange}">x</button>
        `;

    document.getElementById('orbitals_' + placement).append(div);

}
var values_left = [];
var values_middle = [];
var values_right = [];

function evaluateIt() {
    let code = "";

    code += '\t\\initdiagram\n';
    code += `\t\\def\\columndistance{${column_width}}\n`;
    code += `\t\\def\\diagrammode{${(compact ? 'compact' : 'normal')}}\n`;


    var commands = [];
    preview = '';
    minX = 100;
    maxX = -100;
    minY = 100;
    maxY = -100;

    values_left = extractDataFromGUI('left');
    var elecs_left = returnElecLatexSyntax(values_left);
    values_middle = extractDataFromGUI('middle');
    var elecs_middle = returnElecLatexSyntax(values_middle);
    values_right = extractDataFromGUI('right');
    var elecs_right = returnElecLatexSyntax(values_right);

    var symmetrygroups = [];
    // ----
    function addsymmetry(obj) {
        obj.forEach(row => {
            // symmetriegruppen können auch durch komma getrennt werden, z.B. für LGOs
            var subset = row[1].split(",");
            subset.forEach(e => {
                if (!symmetrygroups.includes(e)) {
                    symmetrygroups.push(e);
                }
            });
        });
    }
    addsymmetry(values_left);
    addsymmetry(values_middle);
    addsymmetry(values_right);

    function getPreviewLabelHTMLElement(text, xpos, ypos) {
        function getImageURL(latex) {
            const formulaContainer = MathJax.tex2svg(latex);
            const svgElement = formulaContainer.querySelector("svg");

            // 1. SVG zu einem String machen und Base64 kodieren
            const svgData = new XMLSerializer().serializeToString(svgElement);
            const svgBase64 = btoa(unescape(encodeURIComponent(svgData)));
            const dataUrl = "data:image/svg+xml;base64," + svgBase64;

            return { url: dataUrl, w: parseFloat(svgElement.getAttribute("width")), h: parseFloat(svgElement.getAttribute("height")) };
        }
        const trick = text.split('$');
        if (!disable_mathjax && trick.length > 2) {
            const g = getImageURL(trick[1]);
            return `<image href="${g.url}" x="${xpos + orbital_width / 2 - g.w / 2}" y="${ypos - g.h * 0.2 - 1.1}" width="${g.w}" height="${g.h}"/>`;
        }
        return preview += `<text class="orbital_label" x="${xpos + orbital_width / 2}" y="${ypos - 0.3}">${text}</text>`;
    }

    function drawOrbital(list, elecs, side) {
        function drawPreview(energy, electrons, side, names) {
            function getElectronSVG(x, y, type) {
                mode = 'normal';
                h = 0.5; // Höhe des Pfeils
                w = h / 5;//0.1; // Breite der Pfeilspitze

                if (compact) {
                    mode = 'compact';
                    h = orbital_distance;
                    w = h / 5;
                }

                let html = "";

                if (type === 'up' || type === 'pair') {
                    // Spin Up (links im Orbital-Slot)
                    const xPos = x + orbital_width / 3.0;
                    html += `
            <line class="electron_${mode}" x1="${xPos}" y1="${+y - h / 2}" x2="${xPos}" y2="${+y + h / 2}" />
            <line class="electron_${mode}" x1="${xPos}" y1="${+y + h / 2}" x2="${xPos - w}" y2="${+y + h / 4}" />
            <line class="electron_${mode}" x1="${xPos}" y1="${+y + h / 2}" x2="${xPos + w}" y2="${+y + h / 4}" />
        `;
                }

                if (type === 'down' || type === 'pair') {
                    // Spin Down (rechts im Orbital-Slot)
                    const xPos = x + orbital_width / 1.5;
                    html += `
            <line class="electron_${mode}" x1="${xPos}" y1="${+y + h / 2}" x2="${xPos}" y2="${+y - h / 2}" />
            <line class="electron_${mode}" x1="${xPos}" y1="${+y - h / 2}" x2="${xPos + w}" y2="${+y - h / 4}" />
            <line class="electron_${mode}" x1="${xPos}" y1="${+y - h / 2}" x2="${xPos - w}" y2="${+y - h / 4}" />
        `;
                }
                return html;
            }
            if (side === 'left') {
                x = 0;
            } else if (side === 'middle') {
                x = (column_width + orbital_width);
            } else {
                x = (column_width + orbital_width) * 2;
            }
            y = energy;
            const elektronen = electrons.split(",");
            const entartung = elektronen.length;
            const namesArray = names.split(",");
            for (let single = 0; single < entartung; single++) {

                if (compact) {
                    xpos = x;
                    ypos = y - ((orbital_distance) * (entartung - 1)) / 2 + (single) * (orbital_distance);
                } else {
                    xpos = x - ((orbital_width + orbital_distance) * (entartung - 1)) / 2 + (single) * (orbital_width + orbital_distance);
                    ypos = y;
                }

                preview += `<line class="orbital_line" x1="${xpos}" y1="${+ypos}" x2="${xpos + orbital_width}" y2="${ypos}"/>`;
                preview += getElectronSVG(xpos, ypos, elektronen[single].split("/")[1]);
                // add label
                if (compact && (single === 0)) {

                    // preview += `<text class="orbital_label" x="${xpos + orbital_width / 2}" y="${ypos - 0.3}">${namesArray[0]}</text>`;

                    // const trick = namesArray[single].split('$');
                    // if (!disable_mathjax && trick.length > 2) {
                    //     const g = getImageURL(trick[1]);
                    //     preview += `<image href="${g.url}" x="${xpos + orbital_width / 2 - g.w / 2}" y="${ypos - g.h * 0.2 - 1.1}" width="${g.w}" height="${g.h}"/>`;
                    // } else {
                    //     preview += `<text class="orbital_label" x="${xpos + orbital_width / 2}" y="${ypos - 0.3}">${namesArray[single]}</text>`;
                    // }
                    preview += getPreviewLabelHTMLElement(namesArray[single], xpos, ypos);

                } else if (!compact && (single < namesArray.length)) {
                    // const trick = namesArray[single].split('$');
                    // if (!disable_mathjax && trick.length > 2) {
                    //     const g = getImageURL(trick[1]);
                    //     preview += `<image href="${g.url}" x="${xpos + orbital_width / 2 - g.w / 2}" y="${ypos - g.h * 0.2 - 1.1}" width="${g.w}" height="${g.h}"/>`;
                    // } else {
                    //     preview += `<text class="orbital_label" x="${xpos + orbital_width / 2}" y="${ypos - 0.3}">${namesArray[single]}</text>`;
                    // }
                    preview += getPreviewLabelHTMLElement(namesArray[single], xpos, ypos);
                }

                minX = Math.min(minX, xpos);
                maxX = Math.max(maxX, xpos + orbital_width);
                minY = Math.min(minY, ypos);
                maxY = Math.max(maxY, ypos);
            }

        }

        for (let i = 0; i < list.length; i++) {
            commands.push('\\degenerate{' + list[i][0] + '}{' + elecs[i] + '}{' + side + '}');
            drawPreview(list[i][0], elecs[i], side, list[i][4]);
        }

    }
    function drawConnection(e1, deg1, e2, deg2, side) {
        if (side === 'left') {
            x = 0;
        } else {
            x = (column_width + orbital_width);
        }
        if (compact) {
            deg1 = 1;
            deg2 = 1;
        }
        x1 = x + (orbital_width / 2 + (orbital_width * deg1 + orbital_distance * (deg1 - 1)) / 2);
        x2 = x + ((orbital_width + column_width) + orbital_width / 2 - (orbital_width * deg2 + orbital_distance * (deg2 - 1)) / 2);

        preview += `<line class="orbital_connection_line" x1="${x1}" y1="${e1}" x2="${x2}" y2="${e2}"/>`;

    }

    drawOrbital(values_left, elecs_left, 'left');
    drawOrbital(values_middle, elecs_middle, 'middle');
    drawOrbital(values_right, elecs_right, 'right');
    if (energy_scale) {
        preview += `<line class="energy_scale_line" x1="${minX - 0.5}" y1="${minY - 0.5}" x2="${minX - 0.5}" y2="${maxY + 0.5}" />
            <line class="energy_scale_tip" x1="${minX - 0.5}" y1="${maxY + 0.5}" x2="${minX - 0.5 - 0.1}" y2="${maxY + 0.5 - 0.1}" />
            <line class="energy_scale_tip" x1="${minX - 0.5}" y1="${maxY + 0.5}" x2="${minX - 0.5 + 0.1}" y2="${maxY + 0.5 - 0.1}" />
            <text class="orbital_label" x="${minX - 0.5 - 0.3}" y="${maxY + 0.3}">E</text>`;
    }

    symmetrygroups.forEach(group => {
        if (group === ',') { return; }
        // code += group + "\n";
        values_left.forEach(orbital_left => {
            if (orbital_left[1].includes(group)) {
                // wenn das orbital in der symmetriegruppe drin ist
                values_middle.forEach(orbital_middle => {
                    if (orbital_middle[1].includes(group)) {
                        // wenn das orbital in der symmetriegruppe drin ist
                        commands.push('\\connectorbital{' + orbital_left[0] + '}{' + orbital_left[2] + '}{' + orbital_middle[0] + '}{' + orbital_middle[2] + '}{left}');
                        drawConnection(orbital_left[0], orbital_left[2], orbital_middle[0], orbital_middle[2], 'left');
                        // values_right.forEach(orbital_right => {
                        //     if (orbital_right[1].includes(group)) {
                        //         // wenn das orbital in der symmetriegruppe drin ist
                        //         commands.push('\\connectorbital{' + orbital_middle[0] + '}{' + orbital_middle[2] + '}{' + orbital_right[0] + '}{' + orbital_right[2] + '}{right}');
                        //     }
                        // });
                    }
                });
            }
        });
        values_middle.forEach(orbital_middle => {
            if (orbital_middle[1].includes(group)) {
                // wenn das orbital in der symmetriegruppe drin ist

                values_right.forEach(orbital_right => {
                    if (orbital_right[1].includes(group)) {
                        // wenn das orbital in der symmetriegruppe drin ist
                        commands.push('\\connectorbital{' + orbital_middle[0] + '}{' + orbital_middle[2] + '}{' + orbital_right[0] + '}{' + orbital_right[2] + '}{right}');
                        drawConnection(orbital_middle[0], orbital_middle[2], orbital_right[0], orbital_right[2], 'right');
                    }
                });
            }
        });

    });


    commands = removeDuplicates(commands);

    commands.forEach(c => {
        code += c + "\n";
    });


    {// labels have to be set here!! otherwise minY... are not set properly as they are calculated during orbital drawing!!
        const textL = document.getElementById('column_label_left').value.trim();
        const textM = document.getElementById('column_label_middle').value.trim();
        const textR = document.getElementById('column_label_right').value.trim();
        if (textL.length > 0 || textM.length > 0 || textR.length > 0) {
            code += `\t\\addlabel{${textL},${textM},${textR}}{0}\n`;
            preview += getPreviewLabelHTMLElement(textL, 0, minY - 0.7);
            preview += getPreviewLabelHTMLElement(textM, (column_width + orbital_width), minY - 0.7);
            preview += getPreviewLabelHTMLElement(textR, (column_width + orbital_width) * 2, minY - 0.7);
        }
    }


    if (energy_scale) {
        code += '\t\\addenergyscale{0}\n';
    }

    // alle latex macros werden übergeben
    document.getElementById('output').value = code;

    updatePreview();

    saveCheck();
}

function extractDataFromGUI(placement) {
    var obj = document.querySelectorAll('.orbitals_data_' + placement);
    var values = [];

    obj.forEach(row => {
        const x = row.querySelector('.energy').value;
        const z = row.querySelector('.symmetry').value.replaceAll(" ", "");
        const y = row.querySelector('.degeneration').value;
        const pop = row.querySelector('.electrons').value;
        const label = row.querySelector('.label').value;

        values.push([x, z, y, pop, label]);
    });
    return values;
}

function extractGUIFromData(data) {
    function addOrbitals(d, side) {
        d.forEach(l => {
            // console.log('->' + side + l[0] + l[1] + l[2] + l[3] + l[4]);
            addOrbital(side, l[0], l[1], l[2], l[3], l[4]);
        });
    }
    addOrbitals(data.left, 'left');
    addOrbitals(data.middle, 'middle');
    addOrbitals(data.right, 'right');

    document.getElementById('compact').checked = data.compact;
    compact = data.compact;
    document.getElementById('add_energy_scale').checked = data.energy_scale;
    energy_scale = data.energy_scale;

    document.getElementById('column_label_left').value = data.column_label_left;
    document.getElementById('column_label_middle').value = data.column_label_middle;
    document.getElementById('column_label_right').value = data.column_label_right;
}


function returnElecLatexSyntax(obj) {
    let electronsyntax = [];
    obj.forEach(orbital => {
        const entartung = orbital[2];
        let str = '';
        let i = 0;
        for (let i = 0; i < +entartung; i++) {

            let names = orbital[4].split(",");
            if ((names.length > 1) && (i < names.length)) {
                str += names[i];
            } else {
                if (i == 0) { str += orbital[4]; }
            }
            str += '/';
            if (+orbital[3] > (+entartung + i)) {
                str += 'pair';
            } else if (+orbital[3] > i) {
                str += 'up';
            } else {
                str += 'empty';
            }
            if (i < entartung - 1) { str += ','; }
        }


        electronsyntax.push(str);
    });
    return electronsyntax;
}

function removeDuplicates(obj) {
    var newobj = [];
    obj.forEach(c => {
        if (!newobj.includes(c)) {
            newobj.push(c);
        }
    });
    return newobj;
}

function getCurrentData() {
    let newarray = {
        'left': Array.from(values_left),
        'middle': Array.from(values_middle),
        'right': Array.from(values_right),
        'compact': compact,
        'energy_scale': energy_scale,
        'column_label_left': document.getElementById('column_label_left').value,
        'column_label_middle': document.getElementById('column_label_middle').value,
        'column_label_right': document.getElementById('column_label_right').value
    };
    return newarray;
}
function getEmptyData() {
    let newarray = {
        'left': [],
        'middle': [],
        'right': [],
        'compact': false,
        'energy_scale': false,
        'column_label_left': '',
        'column_label_middle': '',
        'column_label_right': ''
    };
    return newarray;
}
function updatePreview() {
    const svg = document.getElementById('mo-preview');
    const rand_width = 1;
    const rand_height = 1;
    svg.setAttribute('viewBox', `${minX - rand_width} ${minY - rand_height} ${maxX - minX + 2 * rand_width} ${maxY - minY + 2 * rand_height}`);
    svg.innerHTML = preview;
}

function exportProject() {
    alldata = {};//{
    alldata[document.getElementById('file_name_save').value] = getCurrentData();

    const dataStr = JSON.stringify(alldata, null, 2);

    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = document.getElementById('file_name_save').value + ".json";
    link.click();
    URL.revokeObjectURL(url); // Speicher wieder freigeben
}
function loadProject(jsondata) {
    extractGUIFromData(JSON.parse(jsondata));
}



//-------------------------------------------------------------------------------------------------
// beim start der seite wird das hier immer ausgeführt:

document.getElementById('compact').addEventListener('change', function () {
    compact = this.checked;
    evaluateIt();
});
document.getElementById('add_energy_scale').addEventListener('change', function () {
    energy_scale = this.checked;
    evaluateIt();
});
document.getElementById('disable_mathjax').addEventListener('change', function () {
    disable_mathjax = this.checked;
    evaluateIt();
});

document.getElementById('file-upload').addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const importedData = JSON.parse(e.target.result);

            Object.keys(importedData).forEach(key => {
                // hier muss noch das separate speichern gemacht werden, und auch das abfragen nach dem überschreiben!!!
                changeProject(key, importedData[key]);
                document.getElementById('project-selector').value = 'null';
            });

            alert("Successfully loaded new diagram!");

        } catch (err) {
            alert("Error: Malfunction during JSON parse.");
        }
    };
    reader.readAsText(file);
    document.getElementById('file-upload').value = "";
});

function saveToCache() {
    // Wir wandeln das JS-Objekt in einen Text-String um

    const jsonString = JSON.stringify(cache, null, 2);


    // const jsonString = JSON.stringify(cache, null, 2);
    // console.log('saving json ', jsonString);
    localStorage.setItem('mo_diagram_db', jsonString);
}

// 2. Laden (Lesen)
function loadFromCache() {
    const jsonString = localStorage.getItem('mo_diagram_db');

    if (!jsonString) {
        console.log('kein json');
        return;
    }

    cache = JSON.parse(jsonString);

    const selector = document.getElementById('project-selector');

    document.querySelectorAll('.projects_dropdown').forEach(i => {
        i.remove();
    });
    Object.keys(cache).forEach(name => {
        console.log('Loading from cache: ' + name);
        const option = document.createElement('option');
        option.value = name;      // Der interne Wert (Key)
        option.textContent = name; // Der Text, den der User sieht
        option.className = 'projects_dropdown'
        selector.appendChild(option);
    });

}

function switchProject() {
    selected = document.getElementById('project-selector').value;

    changeProject(selected, cache[selected]);
}

function changeProject(name, data) {
    document.querySelectorAll('.input-area').forEach(i => {
        i.remove();
    });
    document.getElementById('file_name_save').value = name;
    addInputArea('left');
    addInputArea('middle');
    addInputArea('right');
    extractGUIFromData(data);
    evaluateIt();
    if (MathJax) {
        MathJax.typeset();
    }
}

function saveProject() {
    name = document.getElementById('file_name_save').value;

    cache[name] = getCurrentData();
    // console.log('vorher: ', cache[name]);
    saveToCache();
    // console.log('storage: ' + localStorage.getItem('mo_diagram_db'));
    loadFromCache();
    changeProject(name, cache[name]);
    document.getElementById('project-selector').value = name;
}

function saveCheck() {
    try {
        if (JSON.stringify(getCurrentData()) === JSON.stringify(cache[document.getElementById('file_name_save').value])) {
            document.getElementById('unsaved_notifier').textContent = '';
            return true;
        }
    } catch (error) {
    }
    document.getElementById('unsaved_notifier').textContent = 'unsaved changes';
    return false;
}


// Direkt ein erstes Feld anzeigen
// addOrbital();
addInputArea('left');
addInputArea('middle');
addInputArea('right');
addOrbital('left', 4, 'a1', 2, 1, 'gfys');
addOrbital('left', 5, 'a2', 1, 0, 'fck');
loadFromCache();




evaluateIt();
document.getElementById('unsaved_notifier').textContent = '';