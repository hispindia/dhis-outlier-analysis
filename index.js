import React from 'react';
import ReactDOM from 'react-dom';


import {ReportSelection} from './components/app';
import {TreeComponent} from './lib/ous'
import api from './dhis2API';

window.onload = function(){


    var select = {}
    select.selected = function(callback){
        debugger
    }
  
    
    ReactDOM.render(<TreeComponent  onSelectCallback={select}/>, document.getElementById('treeComponent'));

   
  
    var dsService = new api.dataStoreService('XLReports');
    var ouService = new api.organisationUnitService();
    var peService = new api.periodService();
    
    var Preports = dsService.getAllKeyValues();
    var PouGroups = ouService.getOUGroups("id,name");

    Promise.all([Preports,PouGroups]).then(function(values){
        
        ReactDOM.render(<ReportSelection data ={
            {
                reports : values[0],
                ouGroups : values[1].organisationUnitGroups
            }
        }  services = {
            {
                peService : peService,
                ouSelectCallback :select

            }
        }/>, document.getElementById('form'));

    })

}

