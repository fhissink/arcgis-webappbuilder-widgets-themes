///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////

define([
    'dojo/_base/declare', 'jimu/BaseWidgetSetting', 'dijit/_WidgetsInTemplateMixin',

    'jimu/dijit/FeaturelayerChooserFromMap', 'jimu/dijit/Message',

    'dojo/on', 'dojo/_base/array', 'dojo/_base/lang',
],
  function (
    declare, BaseWidgetSetting, _WidgetsInTemplateMixin,

    LayerChooser, Message,

    on, array, lang) {
      return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {

          baseClass: 'esrinl-mechanic-locator-setting',

          postCreate: function () {
              this.inherited(arguments);

              this.initializeLayerChoosers();
          },

          startup: function () {
              this.inherited(arguments);
          },

          initializeLayerChoosers: function () {
              var args = {
                  createMapResponse: this.map.webMapResponse
              };

              this.mechanicLayerChooser = new LayerChooser(args);

              this.mechanicLayerChooser.tree.onLoadDeferred.then(lang.hitch(this, function () {
                  this.setConfig(this.mechanicLayerChooser, this.config.mechanicLayer)
              }));

              this.mechanicLayerChooser.placeAt(this.mechanicLayerChooserPlaceHolder);

              this.destinationLayerChooser = new LayerChooser(args);

              this.destinationLayerChooser.tree.onLoadDeferred.then(lang.hitch(this, function () {
                  this.setConfig(this.destinationLayerChooser, this.config.destinationLayer)
              }));

              this.destinationLayerChooser.placeAt(this.destinationLayerChooserPlaceHolder);
          },

          setConfig: function (layerChooser, layerId) {
              if (layerId)
                  this.setSelectedNode(layerChooser, layerId);
          },

          getConfig: function () {
              try {
                  this.config.mechanicLayer = this.getSelectedLayerId(this.mechanicLayerChooser, this.nls.mechanics);

                  this.config.destinationLayer = this.getSelectedLayerId(this.destinationLayerChooser, this.nls.destinations);

                  if (this.config.mechanicLayer == this.config.destinationLayer)
                      throw this.nls.identicalLayers
              } catch (err) {
                  new Message({
                      message: err
                  });
                  return false;
              }

              return this.config;
          },

          setSelectedNode: function (layerChooser, layerId) {
              var layerName = this.getSelectedLayerNameById(layerId);
              if (layerName) {
                  var nodeId = this.getNodeIdByName(layerChooser, layerName);
                  layerChooser.tree.selectItem(nodeId);
              }
          },

          getSelectedLayerId: function (layerChooser, name) {
              var items = layerChooser.getSelectedItems();
              if (items.length == 0) {
                  throw this.nls.noLayerSelected + name;
              }

              var layerId;
              array.some(this.map.itemInfo.itemData.operationalLayers, function (layer) {
                  if (layer.title == items[0].name) {
                      layerId = layer.id;
                      return false;
                  }
              });

              return layerId;
          },

          getSelectedLayerNameById: function (layerId) {
              var layerName;
              array.some(this.map.itemInfo.itemData.operationalLayers, function (layer) {
                  if (layer.id == layerId) {
                      layerName = layer.title;
                      return false;
                  }
              });

              return layerName;
          },

          getNodeIdByName: function (layerChooser, nodeName) {
              var allItems = layerChooser.tree.getAllItems();
              var nodeId;
              array.some(allItems, function (item) {
                  if (item.name == nodeName) {
                      nodeId = item.id;
                      return false;
                  }
              });

              return nodeId;
          }
      });
  });