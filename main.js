// ./main.js
// MapLibre GL JS の読み込み

import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// opacity control
import OpacityControl from 'maplibre-gl-opacity';
import 'maplibre-gl-opacity/dist/maplibre-gl-opacity.css';

// calculate distance between two points
import distance from '@turf/distance';

// GSI elevation tile
// import { useGsiTerrainSource } from 'maplibre-gl-gsi-terrain';

const map = new maplibregl.Map({
    container: 'map',
    zoom: 5,
    center: [138,37],
    minZoom: 5,
    maxZoom: 18,
    maxBounds: [122,20,154,50],
    style: {
        version: 8,
        sources: {
            osm: {
                type: 'raster',
                tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                maxzoom: 19,
                tileSize: 256,
                attribution:
                '&copy;<a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            },
            // hazard map
            hazard_flood:{
                type: 'raster',
                tiles: [
                    'https://disaportaldata.gsi.go.jp/raster/01_flood_l2_shinsuishin_data/{z}/{x}/{y}.png'
                ],
                minzoom: 2,
                maxzoom: 17,
                tileSize: 256,
                attribution:
                  '<a href="https://disaportal.gsi.go.jp/hazardmap/copyright/opendata.html">hazardmap portal site</a>',
            },
            //hazard jisuberi
            hazard_jisuberi:{
                type: 'raster',
                tiles: ['https://disaportaldata.gsi.go.jp/raster/05_jisuberikeikaikuiki/{z}/{x}/{y}.png'
                ],
                minzoom: 2,
                maxzoom: 17,
                tileSize: 256,
                attribution:
                  '<a href="https://disaportal.gsi.go.jp/hazardmap/copyright/opendata.html">hazardmap portal site</a>',
            },
          
            skhb: {
                type: 'vector',
                tiles: [
                    `${location.href.replace('/index.html','')}/skhb/{z}/{x}/{y}.pbf`,
                ],
                minzoom: 5,
                maxzoom: 8,
                attribution:
                  '<a href="https://www.gsi.go.jp/bousaitiri/hinanbasho.html" target="_blank">国土地理院：指定緊急避難場所</a>',
            },
 
            route: {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: [],
                },
            },

        },
        layers: [
            {
                id:'osm-layer',
                source: 'osm',
                type: 'raster',
            },
            // hazard map
            {
                id: 'hazard_flood-layer',
                source: 'hazard_flood',
                type: 'raster',
                paint: { 'raster-opacity': 0.7},
               layout: { visibility: 'none'},
            },
            {
                id: 'hazard_jisuberi-layer',
                source: 'hazard_jisuberi',
                type: 'raster',
                paint: { 'raster-opacity': 0.7},
                layout: { visibility: 'none'},
            },

            {
                id:'route-layer',
                source: 'route',
                type: 'line',
                paint: {
                    'line-color': '#33aaff',
                    'line-width': 4,
                },
            }, 


           {

                id: 'skhb-1-layer',
                source: 'skhb',
                'source-layer': 'skhb',
                type: 'circle',
                paint: {
                    'circle-color': '#6666CC',
                    'circle-radius':[
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        5,
                        2,
                        14,
                        6,
                    ],
                    'circle-stroke-width': 1,
                    'circle-stroke-color': '#ffffff',
                },
                filter: ['==',['get', 'disater1'],1],
                layout: {visibility: 'none'},
            },
            {
                id: 'skhb-2-layer',
                source: 'skhb',
                'source-layer': 'skhb',
                type: 'circle',
                paint: {
                    'circle-color': '#6666cc',
                    'circle-radius': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        5,
                        2,
                        14,
                        6,
                    ],
                    'circle-stroke-width': 1,
                    'circle-stroke-color': '#ffffff',
                },
                filter: ['==',['get','disaster2'],1],
                layout: { visibility: 'none'},
            },
            
        ],
    },
});

let userLocation = null; // hold latest user location

// geolocation control
const geolocationControl = new maplibregl.GeolocateControl({trackUserLocation: true, });
map.addControl(geolocationControl, 'bottom-right');
geolocationControl.on('geolocate', (e) => { userLocation =[e.coords.longitude,e.coords.latitude];

});

// place for refugee shown at present
 
const getCurrentSkhbLayerFilter = () => {
    const style = map.getStyle();
    const skhbLayers = style.layers.filter((layer) =>
        layer.id.startsWith('skhb'),
    );
    const visibleSkhbLayers = skhbLayers.filter(
        (layer) => layer.layout.visibility === 'visible',
    );
    return visibleSkhbLayers[0].filter;
};
//** 
// get nearest refugee camp from lat lon
const getNearestFeature = (longitude, latitude) => {
    const currentSkhbLayerFilter = getCurrentSkhbLayerFilter();
    const features = map.querySourceFeatures('skhb', {
        sourceLayer: 'skhb',
        filter: currentSkhbLayerFilter,
    });

    // find nearest map feature
    const nearestFeature = features.reduce((minDistFeature, feature) => {
        const dist = distance([longitude, latitude],feature.geometry.coordinates,);
        if (minDistFeature === null || minDistFeature.properties.dist > dist)
            return {
                ...feature,
                properties: {
                    ...feature.properties,
                    dist,
                },
            };
        return minDistFeature;
    }, null);
    return nearestFeature; 
};
//*/

// map on
map.on('load',() => {
    const opacity =new OpacityControl({
        baseLayers: {
            'hazard_flood-layer': 'flood hazard',
            'hazard_jisuberi-layer': '土砂災害警戒区域',        
        }, 
    });
    map.addControl(opacity, 'top-left');

    const opacitySkhb = new OpacityControl({
        baseLayers: {
            'skhb-1-layer': 'flood',
            'skhb-2-layer': '崖崩れ/土石流/地滑り',
        },
    });
    map.addControl(opacitySkhb, 'top-right');

    map.on('click', (e) => {
        const features = map.queryRenderedFeatures(e.point,{
            layers: [
                'skhb-1-layer',
                'skhb-2-layer',
            ],
        });
        if (features.length == 0) return; // no map features
        // when map feature exists
        const feature = features[0];
        const popup = new maplibregl.Popup()
        .setLngLat(feature.geometry.coordinates)
        .setHTML(
            `\
        <div style="font-weight:900; font-size: 1rem;">${
            feature.properties.name
        }</div>\      
        <div>${feature.properties.address}</div>\
        <div>${feature.properties.remarks ?? ''}</div>\
        <div>\
        <span${
            feature.properties.disater1 ? '' : ' style="color:#ccc;"'
        }>洪水</span>\
        <span${
            feature.properties.disaster2 ? '' : ' style="color:#ccc;"'
        }>崖崩れ/土石流/地滑り</span>\
        </div>`,
        )
        .addTo(map);
    });
    map.on('mousemove', (e) => {
    const features = map.queryRenderedFeatures(e.point, {
        layers: [
            'skhb-1-layer',
            'skhb-2-layer',
        ],
    });
    if (features.length >0) {
        map.getCanvas().style.cursor = 'pointer';
    } else {
        map.getCanvas().style.cursor = '';
    }
    });

    // calculate nearest refugee camp every time frame is refreshed
 //** 
    map.on('render',() => {
        if (geolocationControl._watchState === 'OFF') userLocation = null;
        if (map.getZoom() < 7 || userLocation === null) {
            map.getSource('route').setData({
                type: 'FeatureCollection',
                features: [],
            });
            return;
        } 
        
        const nearestFeature = getNearestFeature (userLocation[0], userLocation[1]);
        const routeFeature = {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: [
                    userLocation,
                    nearestFeature._geometry.coordinates,
                ],
            },
        };
        map.getSource('route').setData({
            type: 'FeatureCollection',
            features: [routeFeature],
        });

    });
/** 
    const gsiTerrainSource = useGsiTerrainSource(maplibregl.addProtocol);
    map.addSource('terrain', gsiTerrainSource);

    // shade-shadow map
    map.addLayer(
        {
            id: 'hillshade',
            source: 'terrain',
            type: 'hillshade',
            paint: {
                'hillshade-illumination-anchor':'map',
                'hillshade-exaggeration': 0.4,
            },
        },
        'skhb-1-layer',
    );
*/
/** 
    // 3D terrain
    map.addControl(
        new maplibregl.TerrainControl({
            source: 'terrain',
            exaggeration: 1,
        }),
    );
*/
});
