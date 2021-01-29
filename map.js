import 'ol/ol.css';
import ol from 'ol';
import {Map, View} from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import TileWMS from 'ol/source/TileWMS';
import ZoomToExtent from 'ol/control/ZoomToExtent';
import {get as getProjection, getTransform} from 'ol/proj';
import {applyTransform} from 'ol/extent';
import {bbox as bboxStrategy} from 'ol/loadingstrategy';
import {register} from 'ol/proj/proj4';
import {toStringHDMS} from 'ol/coordinate';
import {toLonLat} from 'ol/proj';
import Overlay from 'ol/Overlay';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {Stroke, Style} from 'ol/style';
import Select from 'ol/interaction/Select';
import {WFS, GeoJSON} from 'ol/format';
import Interaction from 'ol/interaction/Interaction';
import {platformModifierKeyOnly} from 'ol/events/condition';
import AttributeTable from './attributetable';
import {DragBox} from 'ol/interaction';
import * as OLUtil from 'ol/util';
import Fill from 'ol/style/Fill';
import {
  equalTo as equalToFilter,
  like as likeFilter,
  and as andFilter
} from 'ol/format/filter';
import Popup from 'ol-popup/src/ol-popup';
import VPopup from "./vPopup";

//Add worldmap layer
var worldmap = new TileLayer({
  source: new OSM()
});

///WMS TileLayer
//Add university building map layer
var mapbuidlings = new TileLayer({
      source: new TileWMS({
        url: 'http://localhost:8080/geoserver/campusmaps/wms',
        params: {'LAYERS': 'campusmaps:buildings', 'TILED': true},
        serverType: 'geoserver',
        transition: 0
      })   
    });

//Add university sidewalks map layer
var mapsidewalks = new TileLayer({
      source: new TileWMS({
        url: 'http://localhost:8080/geoserver/campusmaps/wms',
        params: {'LAYERS': 'campusmaps:sidewalks', 'TILED': true},
        serverType: 'geoserver',
        transition: 0
      })   
    });

//Add university parkinglots map layer
var mapparkinglots = new TileLayer({
      source: new TileWMS({
        url: 'http://localhost:8080/geoserver/campusmaps/wms',
        params: {'LAYERS': 'campusmaps:parkinglots', 'TILED': true},
        serverType: 'geoserver',
        transition: 0
      })   
    });

//Add university building streets layer
var mapstreets = new TileLayer({
      source: new TileWMS({
        url: 'http://localhost:8080/geoserver/campusmaps/wms',
        params: {'LAYERS': 'campusmaps:streets', 'TILED': true},
        serverType: 'geoserver',
        transition: 0
      })   
    });

///GetFeature WFS Method
//Working code needs to change
var featureRequest = new WFS().writeGetFeature({
  srsName: 'EPSG:3857',
  featurePrefix: 'campusmaps',
  featureTypes: ['buildings'],
  outputFormat: 'application/json',
  filter: likeFilter('number', '2815')
});

//Create a empty vectorsource layer
let selection =  new VectorSource();

let vectorLayer = new VectorLayer({
    type: 'overlay',
    name: 'wfsSelection',
    source: selection,
    style: new Style({
        fill: new Fill({
          color: 'black',
          }),
        stroke: new Stroke({
            color: '#00ffe8',
            width: 1
        })
    })
});

fetch('http://localhost:8080/geoserver/campusmaps/wfs', {
  method: 'POST',
  body: new XMLSerializer().serializeToString(featureRequest),
})
  .then(function (response) {
    return response.json();
  })
  .then(function (json) {
    var features = new GeoJSON().readFeatures(json);

    //Add features to vector source layer
    selection.addFeatures(features);
    //map.getView().fit(selection.getExtent());
  });


///Extent Method
let searchBoxSource = new VectorSource();
let searchBox = new VectorLayer({
    type: 'overlay',
    name: 'searchBoxSelection',
    source: searchBoxSource,
    style: new Style({
        stroke: new Stroke({
            color: '#0051ff',
            width: 2
        })
    })
});

let dragBox = new DragBox({
    condition: platformModifierKeyOnly
});

//The drag box selects multiple states and returns a WFS layer
//A table with the feature data is displayed below the map
let extent; //Extent is declared globally because it also needs to be available for the drag box

function getWfsFeature(){
    let featURL = 'http://localhost:8080/geoserver/campusmaps/wfs?service=wfs&version=2.0.0' +
        '&request=GetFeature&typeNames=campusmaps:buildings&outputFormat=application/json&srsName=EPSG:3857&bbox=' + extent.join(',') + ',EPSG:3857';
    fetch(featURL).then(function(response){return response.json();}).then(function(json){
        console.log(json);
        let features = new GeoJSON().readFeatures(json);
        selection.addFeatures(features);
        if(selection.getFeatures().length > 0)
        {
            let feat = selection.getFeatures();
            let aTable = new AttributeTable();
            let table = aTable.makeTable(feat);
            let tcont = document.getElementById("table-container");
            tcont.appendChild(table);
            tcont.style.visibility = "visible";
        }
    })
}


console.log('Openlayers vesion',OLUtil.VERSION);


//Project features and map
var map = new Map({
  layers: [worldmap],
  target: 'map',
  view: new View({
    center: [-10773600.40, 5515108.10],
    zoom: 16
  })
});

map.addInteraction(dragBox);
dragBox.on('boxend', function(){
    extent = dragBox.getGeometry().getExtent();
    getWfsFeature();
}); 

console.log("map layers count: " + map.getLayers().getLength());

///Popup Template function definition
let popup = new Popup();
let vPopup = new VPopup();
map.addOverlay(popup);

map.on('click', function(evt) {
    let coord = evt.coordinate;
    let words = null;
    let featURL = mapbuidlings.getSource().getFeatureInfoUrl(coord, map.getView().getResolution(), 'EPSG:3857', {'INFO_FORMAT': 'text/html'});
    console.log(featURL);
    fetch(featURL).then(function (response){ return response.text();}).then(function(html) {
        if (html.includes("<th>")) {
            words = html.toString();
            let tableArray = vPopup.VPopupTableData(words);
            vPopup.popupTable(tableArray, coord, popup);
        }
        else
        {
            popup.setPosition(undefined);
        }
    });
});

