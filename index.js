import React from 'react';
import ReactDOM from 'react-dom';


import {SelectionPanel} from './components/selection-panel';
import {TreeComponent} from './lib/ous'
import api from 'dhis2api';


window.onload = function(){
/* Menu Bar */
    try {
        if ('Dhis2HeaderBar' in window) {
            Dhis2HeaderBar.initHeaderBar(document.querySelector('#header'), '../../../api', { noLoadingIndicator: true });
        }
    } catch (e) {
        if ('console' in window) {
            console.error(e);
        }
    }
    
/********/


    var select = {}
    select.selected = function(callback){
        debugger
    }
      
    ReactDOM.render(<TreeComponent  onSelectCallback={select}/>, document.getElementById('treeComponent'));

    var apiWrapper = new api.wrapper();
    var ouService = new api.organisationUnitService();
    var peService = new api.periodService();
    
    var Pds = apiWrapper.getObj("dataSets?fields=id,name,attributeValues[*]&paging=false&filter=attributeValues.attribute.id:eq:ONsFokn0mpz&filter=attributeValues.value:eq:true");
    var PouGroups = ouService.getOUGroups("id,name");

    Promise.all([Pds,PouGroups]).then(function(values){

        var ds = values[0].dataSets;

        ds = ds.reduce(function(list,obj){
            for (var key in obj.attributeValues){
                var av = obj.attributeValues[key];

                if (av.attribute.id == 'ONsFokn0mpz'){
                    if (av.value == 'true'){
                        list.push(obj);
                    }
                }
            }
            
            return list;
        },[]);
        
        ReactDOM.render(<SelectionPanel data ={
            {
                dataSets : ds,
                ouGroups : values[1].organisationUnitGroups
            }
        }  services = {
            {
                peService : peService,
                ouSelectCallback :select

            }
        }/>, document.getElementById('form'));

    }).catch(reason => {
        // TODO
        ReactDOM.render(<div>No reports exist.</div>,document.getElementById('form'))
    });

}

