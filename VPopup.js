import Popup from 'ol-popup/src/ol-popup';

export default class VPopup {

    constructor() {

    }

    VPopupTableData(htmlString) {
        let headings = htmlString.substring(htmlString.indexOf("<th>"), htmlString.lastIndexOf("</th>") + 5);
        let data = htmlString.substring(htmlString.indexOf("<td>"), htmlString.lastIndexOf("</td>") + 5);
        let dataArray = data.split("</td>");
        let headingArray = headings.split("</th>");
        headingArray.pop();
        dataArray.pop();
        const columns = []
        const rows = []        

        for (let i = 0; i < dataArray.length; i++) {
            
            headingArray[i] = headingArray[i].replace("<th>", "");
            headingArray[i] = headingArray[i].replace("<th >", "");
            headingArray[i] = headingArray[i].trimStart();
            dataArray[i] = dataArray[i].replace("<td>", "");
            dataArray[i] = dataArray[i].trimStart();

            if(headingArray[i] == "longname" || headingArray[i] == "number" || headingArray[i] == "shortname" ) {
                var longname = headingArray.indexOf("longname")
                var number = headingArray.indexOf("number")
                var shortname = headingArray.indexOf("shortname")
                headingArray[longname] = "Building Name:";                
                headingArray[number] = "Building Number:";
                headingArray[shortname] = "Building Code:";        
                    
                columns.push(headingArray[i]);
                rows.push(dataArray[i]);
            }
        }
        
        let tableArray = [columns, rows];
        return tableArray;
    }

    popupTable(tableArray, coord, popup) {
        let headers = tableArray[0];
        let cells = tableArray[1];
        let table = document.createElement("TABLE");
        table.style.borderCollapse = "collapse";
        for (let i = 0; i < headers.length; i++) {
            let row = table.insertRow();
            let head = row.insertCell();
            head.style.padding = "2px";
            head.style.border = "thin solid black";
            head.style.backgroundColor = "#e6f4f6";
            head.style.borderSpacing = "0px";
            let htext = document.createTextNode(headers[i]);
            head.appendChild(htext);
            let cell = row.insertCell();
            cell.style.padding = "2px";
            cell.style.border = "thin solid black";
            cell.style.borderSpacing = "0px";
            cell.style.backgroundColor = "white";
            let ctext = document.createTextNode(cells[i]);
            cell.appendChild(ctext);
        }
        popup.container.style.padding = "5px";
        popup.show(coord, table);
    }
}

