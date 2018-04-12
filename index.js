import React from 'react';
import ReactDOM from 'react-dom';


import {ReportSelection} from './components/app';
import api from './dhis2API';

window.onload = function(){

    var dsService = new api.dataStoreService('XLReports');
    var ouService = new api.organisationUnitService();
    
    var Preports = dsService.getAllKeyValues();
    var PouGroups = ouService.getOUGroups("id,name");

    Promise.all([Preports,PouGroups]).then(function(values){
        
        ReactDOM.render(<ReportSelection data ={
            {
                reports : values[0],
                ouGroups : values[1]
            }
        } />, document.getElementById('form'));

    })

}

