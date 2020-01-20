import React from 'react';
import ReactDOM from 'react-dom';
import constants from './constants';

import {SelectionPanel} from './components/selection-panel';
import {WatchPanel} from './components/watch-panel';

import {TreeComponent} from 'dhis2-ou-tree'
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
  /*  select.selected = function(callback){
        debugger
    }
    */  
    ReactDOM.render(<TreeComponent  onSelectCallback={select}/>, document.getElementById('treeComponent'));

    var apiWrapper = new api.wrapper();
    var ouService = new api.organisationUnitService();
    var peService = new api.periodService();
    
    var Pprogram = apiWrapper.getObj(`programs/${constants.program_sms_inbox}?fields=id,name,programStages[id,name,programStageDataElements[id,name,dataElement[id,name,valueType]]]`);

    var Puser = apiWrapper.getObj(`me`);
    var PuserGroups = apiWrapper.getObj(`userGroups?fields=id,name,code,users[id,name,phoneNumber]&paging=false`);
    var PoptionsIdentifiedLevels = apiWrapper.getObj(`optionSets/Tl4QLYO23Ur?fields=id,name,options[id,name,code]`)
    //var PouGroups = ouService.getOUGroups("id,name");

    Promise.all([Pprogram,Puser,PuserGroups,PoptionsIdentifiedLevels]).then(function(values){

        var program = values[0];

        ReactDOM.render(<WatchPanel data ={
            {
                program : values[0],
                me : values[1],
                userGroups: values[2].userGroups,
                identifiedLevelOptions : values[3].options
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

