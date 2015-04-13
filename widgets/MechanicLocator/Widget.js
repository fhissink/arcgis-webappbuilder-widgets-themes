define(['dojo/_base/declare', 'dojo/on', 'dojo/_base/array', 'dojo/_base/lang', 'dojo/dom-construct',

        'jimu/BaseWidget', 'jimu/PanelManager',

        'dijit/form/Select', 'dijit/form/MultiSelect',

        'esri/Color', 'esri/lang', 'esri/tasks/NATypes', 'esri/graphic', 'esri/tasks/DataFile', 'esri/tasks/FeatureSet', 'esri/layers/GraphicsLayer', 'esri/symbols/SimpleLineSymbol', 'esri/renderers/SimpleRenderer', 'esri/tasks/ClosestFacilityTask', 'esri/tasks/ClosestFacilityParameters'],
function (declare, on, array, lang, domConstruct,

        BaseWidget, PanelManager,

        Select, MultiSelect,

        Color, esriLang, NATypes, Graphic, DataFile, FeatureSet, GraphicsLayer, SimpleLineSymbol, SimpleRenderer, ClosestFacilityTask, ClosestFacilityParameters) {
    //To create a widget, you need to derive from BaseWidget.
    return declare([BaseWidget], {
        baseClass: 'esrinl-mechanic-locator',

        postCreate: function () {
            this.inherited(arguments);

            this.addRouteGraphicsLayerToMap();

            console.log('MechanicLocator::postCreate');
        },

        onClose: function () {
            this.clearValues();
        },

        btnSelectClickHandler: function () {
            this.clearValues();

            this.map.setInfoWindowOnClick(false);

            this.toggleSelectMessage(this.nls.selectMessage, 'block');

            this.destinationLayer = this.map.getLayer(this.config.destinationLayer);

            this.handle = on.once(this.destinationLayer, 'click', lang.hitch(this, this.layerClickHandler))

            this.own(this.handle);
        },

        layerClickHandler: function (evt) {
            this.toggleSelectMessage(this.nls.loading, 'block');

            var params = this.getClosestFacilityParams(evt.graphic);

            var closestFacilityTask = new ClosestFacilityTask(this.config.closestFacilityTask);

            closestFacilityTask.solve(params, lang.hitch(this, this.calculateRoutes));
        },

        btnDisplayRouteClickHandler: function () {
            var selectedRoute;

            this.map.graphics.clear();
            var routeName = dijit.byId("availableRoutesSelect").get('value')[0];

            array.some(this.routesByName, lang.hitch(this, function (route) {
                if (route.name == routeName) {
                    selectedRoute = route;
                }
            }));

            var highlightSymbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0, 255, 255], 0.25), 4.5);
            var highlightGraphic = new Graphic(selectedRoute.geometry, highlightSymbol);

            this.map.graphics.add(highlightGraphic);

            this.routeDescription.innerHTML = esriLang.substitute(selectedRoute.attributes, "${*}");
        },

        addRouteGraphicsLayerToMap: function () {
            this.routeGraphicLayer = new GraphicsLayer();

            var routePolylineSymbol = new SimpleLineSymbol(
                  SimpleLineSymbol.STYLE_SOLID,
                  new Color([200, 0, 0]),
                  4.0
                );
            var routeRenderer = new SimpleRenderer(routePolylineSymbol);

            this.routeGraphicLayer.setRenderer(routeRenderer);

            this.map.addLayer(this.routeGraphicLayer);
        },

        calculateRoutes: function (solveResult) {
            if (solveResult.messages.length > 0) {
                array.forEach(solveResult.messages, function (message) {
                    console.log("closestFacilityTask::solve", message.description)
                });
            }

            this.routesByName = [];

            var selectPlaceHolder = dojo.byId('selectPlaceHolder');

            var select = domConstruct.create("select");
            selectPlaceHolder.appendChild(select);

            array.forEach(solveResult.routes, lang.hitch(this, function (route, index) {
                var routeName = route.attributes.Name;

                var option = domConstruct.create('option');
                var distance = Math.round(route.attributes.Total_Kilometers, -2);
                option.innerHTML = routeName + ' (' + distance + ' km)';
                option.value = routeName;
                select.appendChild(option);

                //build an array of route info
                var attr = array.map(solveResult.directions[index].features, function (feature) {
                    return feature.attributes.text;
                });

                this.routesByName.push({ name: routeName, attributes: attr, geometry: route.geometry })

                route.setAttributes(attr);

                this.routeGraphicLayer.add(route);
            }));

            var multiSelect = new MultiSelect({ id: 'availableRoutesSelect', multiple: false }, select);

            this.results.style.display = 'block';

            this.toggleSelectMessage('', 'none');

            this.map.setInfoWindowOnClick(true);
        },

        getClosestFacilityParams: function (graphic) {
            var nrofResults = dojo.byId("mechanicSelect").value;

            var params = new ClosestFacilityParameters();
            params.impedenceAttribute = "Meters";
            params.defaultCutoff = 100.0;
            params.returnIncidents = false;
            params.returnRoutes = true;
            params.returnDirections = true;
            params.defaultTargetFacilityCount = nrofResults
            params.travelDirection = NATypes.TravelDirection.FROM_FACILITY;

            this.mechanicLayer = this.map.getLayer(this.config.mechanicLayer);

            var facilities = new FeatureSet();
            facilities.features = this.mechanicLayer.graphics;
            params.facilities = facilities;

            var features = [];
            var incidents = new FeatureSet();

            features.push(graphic);
            incidents.features = features;

            params.incidents = incidents;

            return params;
        },

        toggleSelectMessage: function (message, display) {
            //show the select message
            this.selectMessage.style.display = display;
            this.selectMessage.innerHTML = message;
        },

        clearValues: function () {
            //clear existing highlighted routes
            this.map.graphics.clear();

            //clear existing routes
            this.routeGraphicLayer.clear();

            //hide resultscontainer
            this.results.style.display = 'none';

            //destroy resultsdijit
            if (dijit.byId('availableRoutesSelect'))
                dijit.byId('availableRoutesSelect').destroy();

            if (this.handle) {
                this.handle.remove();
                this.handle = null;
            }

            //clear the routetext
            this.routeDescription.innerHTML = this.nls.selectRoute;
        }
    });

});
