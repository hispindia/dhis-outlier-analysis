import React,{propTypes} from 'react';

export function ReportSelection(props){

    var instance = Object.create(React.Component.prototype);
    instance.props = props;
    instance.render = render;

    var keyToPeriodTypeMap = props.data.reports.reduce((map,obj) =>{
        map[obj.key] = obj;
        return map;
    },{});
    

    var state = {
        selectedReport : null,
        selectedOUGroup : null,
        selectedOU : null,
        periodList : []
        
    };
    
    
    return instance;
    
    function handleSubmit(e){

    }

    function getReportOptions(reports){

        var options = [];
        
        reports.forEach(function(report){
            options.push(<option key = {report.key}  value={report.key} >{report.name}</option>);
        });
        
        return options;
        
    }

    function onReportChange(e){

        function getPeriods(periodType){

            switch(periodType){
            case "Monthly" :
                debugger
                return  getMonthlyPeriods();
                default :
                return  getMonthlyPeriods();
                
                
            }

            function getMonthlyPeriods(){

                var periods = [];
                var MONTH_NAMES=new Array('January','February','March','April','May','June','July','August','September','October','November','December');

                var today = new Date();
                var currentYear = today.getFullYear();
                var currentMonth = today.getMonth();
                debugger
                for (var i=currentYear;i>=1990;i--){

                    while(currentMonth!=0){
                        var monthStr = ""
                        if (currentMonth <10){
                            monthStr = "0";
                        }
                        periods.push(
                            {
                                id:currentYear+monthStr+currentMonth,
                                name : MONTH_NAMES[currentMonth]+currentYear

                            }
                        );

                        currentMonth = (currentMonth+1)%12;
                    }
                }
                   
                return periods;
            }
        };
        getPeriods(keyToPeriodTypeMap[e.target.selectedOptions[0].value].period)
    }
    
    function getPeriodOptions(){

        
    }

    
    function render(){
        return (
                < form onSubmit={handleSubmit}>
                <table>
                <tbody>
                <tr>
                <td> Select Report </td><td><select onChange={onReportChange} id="report">{getReportOptions(props.data.reports)}</select></td>   
                </tr>
                <tr>
                <td> Select Start Period  </td><td><select id="report">{getPeriodOptions()}</select></td>
                </tr>
                
                <tr>
                <td> Select End Period  </td><td><select id="report">{getPeriodOptions()}</select></td>
                </tr>
                
                <tr>
                <td> Selected Facility  </td><td><label disabled>{state.currentSelection}</label></td>
                </tr>
                
                <tr>
                <td> Select Org Unit Group  </td><td></td>
                </tr>
                
                <tr>
                <td> Select Aggregation Mode </td><td></td>
                </tr>
                
                </tbody>                
                </table>
                <input type="submit" value="Get Report"></input>
                </form>
        )
    }
    
}

