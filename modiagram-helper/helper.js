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
        document.getElementById('theme_switch').textContent = '\u2600';
        return;
    }
    themeLink.href = './css/style-light.css';
    document.getElementById('theme_switch').textContent = '\u263D';
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
                    <th title="Energy (position on energy scale -> 1cm/unit)">$h\\nu$</th>
                    <th title="Symmetry Group (Irreducible Representation)">$\\Gamma$</th>
                    <th title="Degeneration (number of orbitals having same energy)">$g_i$</th>
                    <th title="Electrons">$\\upharpoonleft\\downharpoonright $</th>
                    <th title="Label, set the alignment with the arrow button">label</th>
                </tr>
            </table>
            <button class="add_orbital" onclick="addOrbital('`+ name + `', 0, 'a1', 1, 0, '','',0);${onchange}">+</button>`;
    document.getElementById('dreispalten').appendChild(div);
}

function expandLabel(checked) {
    var obj = document.querySelectorAll('.label');
    obj.forEach(d => {
        if (checked) {
            d.removeAttribute("hidden");
        } else {
            d.setAttribute("hidden", "hidden");
        }
    });
}

function addOrbital(placement, initialenergy, initialsymmetry, initialdegeneration, initialelectrons, initiallabel, initialindlabel, initiallabelposition) {
    let align = typeof initiallabelposition === 'undefined' ? 0 : Number(initiallabelposition);
    const div = document.createElement('tr');
    div.className = 'orbitals_data_' + placement;
    div.innerHTML = `<td><input type="number" step="0.1" class="energy" onchange="${onchange}" value="${initialenergy}"></td>
            <td><input type="text" step="0.1" class="symmetry" onchange="${onchange}" value="${initialsymmetry}"></td>
            <td><input type="number" min="1" step="1" class="degeneration" onchange="${onchange}" value="${initialdegeneration}"></td>
            <td><input type="number" min="0" step="1" class="electrons" onchange="${onchange}" value="${initialelectrons}"></td>
            <td>
            <input type="text" title="individual labels (separate by komma for degenerated orbitals)" class="ilabel" onchange="${onchange}" value="${initialindlabel}">
            <button class="label_alignment" value="${align}" onclick="

            let currentVal = parseInt(this.value);
            let nextVal = (currentVal + 1) % 4;
            this.value = nextVal;
            let content =['🡓','🡐','🡑','🡒'];
            this.textContent = content[nextVal];
            ${onchange}
            ">${['🡓', '🡐', '🡑', '🡒'][align]}</button><br>
            <input type="text" class="label" onchange="${onchange}" value="${initiallabel}" hidden>
            </td>
            <button class="remove_orbital" onclick="this.parentElement.remove();${onchange}">x</button>
        `;

    document.getElementById('orbitals_' + placement).append(div);

}
var values_left = [];
var values_middle = [];
var values_right = [];
var symmetrygroups = [];

function evaluateIt() {
    let code = "";
    preview = '';
    let ind1 = '';
    let ind2 = '\t';
    if (document.getElementById('make_figure').checked) {
        ind1 = '\t';
        ind2 = '\t\t';
        code += '\\begin{figure}\n';
        if (document.getElementById('figure-centered').checked)
            code += ind1 + '\\centering\n';
    }

    code += ind1 + '\\begin{mohelper}\n';
    code += ind2 + `\\def\\columndistance{${column_width}}\n`;
    code += ind2 + `\\def\\diagrammode{${(compact ? 'compact' : 'normal')}}\n`;


    var commands = [];
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

    symmetrygroups = [];
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

    function getPreviewLabelHTMLElement(text, xpos, ypos, align) {
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
            switch (align) {
                case 1://links
                    console.log(g.w / 2);
                    return `<image href="${g.url}" x="${xpos + orbital_width / 2 - g.w / 2 - g.w * 0.1}" y="${ypos - g.h / 2}" width="${g.w}" height="${g.h}"/>`;
                case 2:
                    return `<image href="${g.url}" x="${xpos + orbital_width / 2 - g.w / 2}" y="${ypos - g.h * 0.2}" width="${g.w}" height="${g.h}"/>`;
                case 3:
                    return `<image href="${g.url}" x="${xpos + orbital_width / 2 - g.w / 2 + g.w * 0.1}" y="${ypos - g.h / 2}" width="${g.w}" height="${g.h}"/>`;
            }
            return `<image href="${g.url}" x="${xpos + orbital_width / 2 - g.w / 2}" y="${ypos - g.h * 0.2 - 1.1}" width="${g.w}" height="${g.h}"/>`;
        }
        return `<text class="orbital_label" style="text-anchor: ${['middle', 'end', 'middle', 'start'][align]};" x="${xpos + orbital_width / 2}" y="${ypos - (align === 0 ? 0.3 : (align === 2 ? -0.6 : -0.1))}">${text}</text>`;
    }

    function drawOrbital(list, elecs, side) {
        function drawPreview(energy, electrons, side, names, indlabel, indlabelposition) {
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
            y = Number(energy);
            const elektronen = electrons.split(",");
            const entartung = elektronen.length;
            const namesArray = names.split(",");


            let ilabel_x = x;
            let ilabel_y = y;
            // console.log("Energy ist:", y, typeof y);
            // console.log('===');
            switch (indlabelposition) {
                case 1:
                    if (compact) {
                        ilabel_x -= (orbital_width + orbital_distance) / 2;
                        break;
                    }
                    ilabel_x -= (entartung * (orbital_width + orbital_distance)) / 2;
                    break;
                case 2:
                    break;
                case 3:
                    if (compact) {
                        ilabel_x += (orbital_width + orbital_distance) / 2;
                        break;
                    }
                    ilabel_x += (entartung * (orbital_width + orbital_distance)) / 2;
                    break;
            }

            preview += getPreviewLabelHTMLElement(indlabel, ilabel_x, ilabel_y, indlabelposition);


            for (let single = 0; single < entartung; single++) {

                if (compact) {
                    xpos = x;
                    ypos = y - ((orbital_distance) * (entartung - 1)) / 2 + (single) * (orbital_distance);
                } else {
                    xpos = x - ((orbital_width + orbital_distance) * (entartung - 1)) / 2 + (single) * (orbital_width + orbital_distance);
                    ypos = y;
                }

                preview += `<line class="orbital_line" x1="${xpos}" y1="${+ypos}" x2="${xpos + orbital_width}" y2="${ypos}"/>`;
                preview += getElectronSVG(xpos, ypos, elektronen[single]);
                // add label
                if (compact && (single === 0)) {
                    preview += getPreviewLabelHTMLElement(namesArray[single], xpos, ypos, 0);

                } else if (!compact && (single < namesArray.length)) {
                    preview += getPreviewLabelHTMLElement(namesArray[single], xpos, ypos, 0);
                }

                minX = Math.min(minX, xpos);
                maxX = Math.max(maxX, xpos + orbital_width);
                minY = Math.min(minY, ypos);
                maxY = Math.max(maxY, ypos);
            }

        }
        commands.push(ind2 + '\\fragment{');
        for (let i = 0; i < list.length; i++) {
            commands.push(ind2 + '\t\\addOrbital{energy=' + list[i][0] + ',sym={' + list[i][1] + '}' + (elecs[i].length > 0 ? ',config={' + elecs[i] + '}' : '') + (list[i][4].length > 0 ? ',labels={' + list[i][4] + '}' : '') + (list[i][5].trim().length > 0 ? ',label=' + list[i][5].trim() + ',labelposition=' + ['bottom', 'left', 'up', 'right'][list[i][6]] : '') + '}');
            drawPreview(list[i][0], elecs[i], side, list[i][4], list[i][5], list[i][6]);
        }
        const clabel = document.getElementById('column_label_' + side).value.trim();

        if (clabel.length > 0) {
            commands.push(ind2 + `\t\\addLabel{${clabel}}{0}`);
        }

        commands.push(ind2 + '}');
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
                        // commands.push(ind2 + '\\connectorbital{' + orbital_left[0] + '}{' + orbital_left[2] + '}{' + orbital_middle[0] + '}{' + orbital_middle[2] + '}{left}');
                        drawConnection(orbital_left[0], orbital_left[2], orbital_middle[0], orbital_middle[2], 'left');
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
                        // commands.push(ind2 + '\\connectorbital{' + orbital_middle[0] + '}{' + orbital_middle[2] + '}{' + orbital_right[0] + '}{' + orbital_right[2] + '}{right}');
                        drawConnection(orbital_middle[0], orbital_middle[2], orbital_right[0], orbital_right[2], 'right');
                    }
                });
            }
        });

    });


    // commands = removeDuplicates(commands); nicht mehr gebraucht, auf keinen fall entkommentieren!

    commands.forEach(c => {
        code += c + "\n";
    });


    {// labels have to be set here!! otherwise minY... are not set properly as they are calculated during orbital drawing!!
        const textL = document.getElementById('column_label_left').value.trim();
        const textM = document.getElementById('column_label_middle').value.trim();
        const textR = document.getElementById('column_label_right').value.trim();
        if (textL.length > 0 || textM.length > 0 || textR.length > 0) {
            // code += ind2 + `\\addlabel{${textL},${textM},${textR}}{0}\n`;
            preview += getPreviewLabelHTMLElement(textL, 0, minY - 0.7, 0);
            preview += getPreviewLabelHTMLElement(textM, (column_width + orbital_width), minY - 0.7, 0);
            preview += getPreviewLabelHTMLElement(textR, (column_width + orbital_width) * 2, minY - 0.7, 0);
            minY = Math.min(minY, minY - 0.7);
        }
    }


    if (energy_scale) {
        code += ind2 + '\\addEnergyScale{0}\n';
    }
    code += ind1 + '\\end{mohelper}\n';

    if (document.getElementById('make_figure').checked) {
        const ref = document.getElementById('figure-reference').value;
        const caption = document.getElementById('figure-caption').value;
        if (caption.length > 0)
            code += ind1 + `\\caption{${caption}}\n`;
        if (ref.length > 0)
            code += ind1 + `\\label{${ref}}\n`;
        code += '\\end{figure}\n';
    }

    // alle latex macros werden übergeben
    document.getElementById('output').value = code;

    updatePreview();

    saveCheck();
}

function calculateMOs() {
    symmetrygroups.forEach(group => {
        if (group === ',') { return; }

        let overlapping = values_right.filter(function (element) {
            return element[1].includes(group);
        });
        overlapping = overlapping.concat(values_left.filter(function (element) {
            return element[1].includes(group);
        })).sort((x, y) => x[0] - y[0]);

        // console.log(overlapping);

        switch (overlapping.length) {
            case 0:
                break;
            case 1:
                addOrbital('middle', overlapping[0][0], group, overlapping[0][2], overlapping[0][3], '', '', 0);
                break;
            case 2:
                const average = (Number(overlapping[0][0]) + Number(overlapping[1][0])) / 2;
                const h12 = average * 0.8 * 1.75;// / ((+overlapping[0][2] + +overlapping[1][2]) / 2);
                console.log((+overlapping[0][2] + +overlapping[1][2]) / 2);
                const wurzel = Math.sqrt((average * average) + (h12 * h12));
                const e1 = average - wurzel;
                const e2 = average + wurzel;

                const n_e = Math.min(+overlapping[0][3], +overlapping[0][2] * 2) + Math.min(+overlapping[1][3], +overlapping[1][2] * 2);//electrons
                addOrbital('middle', e1, group, Math.min(overlapping[0][2], overlapping[1][2]), Math.min(n_e, overlapping[0][2] * 2), '', '', 0);
                addOrbital('middle', e2, group, Math.min(overlapping[0][2], overlapping[1][2]), Math.max(0, n_e - overlapping[0][2] * 2), '', '', 0);
                break;
            default:
                break;
        }
        // values_right.forEach(orbital_right => {
        //     if (orbital_right[1].includes(group)) {
        //         // wenn das orbital in der symmetriegruppe drin ist
        //         const average = (Number(orbital_left[0]) + Number(orbital_right[0])) / 2;
        //         const h12 = average * 0.8 * 1.75;
        //         const wurzel = Math.sqrt((average * average) + (h12 * h12));
        //         const e1 = average + wurzel;
        //         const e2 = average - wurzel;
        //         addOrbital('middle', e1, group, 1, 0, '');
        //         addOrbital('middle', e2, group, 1, 0, '');
        //     }
        // });


        // values_left.forEach(orbital_left => {
        //     if (orbital_left[1].includes(group)) {
        //         // wenn das orbital in der symmetriegruppe drin ist
        //         values_right.forEach(orbital_right => {
        //             if (orbital_right[1].includes(group)) {
        //                 // wenn das orbital in der symmetriegruppe drin ist
        //                 const average = (Number(orbital_left[0]) + Number(orbital_right[0])) / 2;
        //                 const h12 = average * 0.8 * 1.75;
        //                 const wurzel = Math.sqrt((average * average) + (h12 * h12));
        //                 const e1 = average + wurzel;
        //                 const e2 = average - wurzel;
        //                 addOrbital('middle', e1, group, 1, 0, '');
        //                 addOrbital('middle', e2, group, 1, 0, '');
        //             }
        //         });
        //     }
        // });

    });
    evaluateIt();
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
        const ilabel = row.querySelector('.ilabel').value;
        const ilabel_align = row.querySelector('.label_alignment').value;

        values.push([x, z, y, pop, label, ilabel, Number(ilabel_align)]);
    });
    return values;
}

function extractGUIFromData(data) {
    function addOrbitals(d, side) {
        d.forEach(l => {
            // console.log('->' + side + l[0] + l[1] + l[2] + l[3] + l[4]);
            addOrbital(side, l[0], l[1], l[2], l[3], l[4], l[5], l[6]);
        });
    }
    addOrbitals(data.left, 'left');
    addOrbitals(data.middle, 'middle');
    addOrbitals(data.right, 'right');

    document.getElementById('compact').checked = data.compact;
    compact = data.compact;
    document.getElementById('add_energy_scale').checked = data.energy_scale;
    energy_scale = data.energy_scale;
    document.getElementById('column_width').value = Number(data.column_width);
    column_width = data.column_width;

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

            // let names = orbital[4].split(",");
            // if ((names.length > 1) && (i < names.length)) {
            //     str += names[i];
            // } else {
            //     if (i == 0) { str += orbital[4]; }
            // }
            // str += '/';
            if (+orbital[3] > (+entartung + i)) {
                str += 'pair';
            } else if (+orbital[3] > i) {
                str += 'up';
            } else {
                // str += '';
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
        'column_width': column_width,
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
        'column_width': 3,
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


    if (window.MathJax && MathJax.typesetClear) {
        MathJax.typesetClear([svg]);
    }
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
    cache = {};
    let load = JSON.parse(jsonString);

    const selector = document.getElementById('project-selector');

    document.querySelectorAll('.projects_dropdown').forEach(i => {
        i.remove();
    });
    Object.keys(load).forEach(name => {
        console.log('Loading from cache: ' + name);
        const option = document.createElement('option');
        option.value = name;      // Der interne Wert (Key)
        option.textContent = name; // Der Text, den der User sieht
        option.className = 'projects_dropdown'
        selector.appendChild(option);

        cache[name] = getEmptyData();
        Object.keys(load[name]).forEach(e => {
            cache[name][e] = load[name][e];
        });
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
    let name = document.getElementById('file_name_save').value;

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

function copyToClipboard() {
    navigator.clipboard.writeText(document.getElementById('output').value)
        .then(() => console.log('Copied latex output to clipboard'))
        .catch(err => console.error('Failed to copy: ', err));
}

addInputArea('left');
addInputArea('middle');
addInputArea('right');
addOrbital('left', 0, 'a1', 1, 1, '1s', '', 0);
addOrbital('right', 0, 'a1', 1, 1, '1s', '', 0);
addOrbital('middle', -2, 'a1', 1, 2, '', '', 0);
addOrbital('middle', 2, 'a1', 1, 0, '', '', 0);
loadFromCache();




evaluateIt();
document.getElementById('unsaved_notifier').textContent = '';