function progressiveReportService(){

    this.getRowDataCellValueList =  function(dataset,ouGroupDecocToObjMap,totalsMap,startCol,startRow,endRow){

        var colNo = getNumber(startCol);
        var pivotWiseDataset = dataset.reduce((map,obj)=>{
            if (!map[obj.pivot]){
                map[obj.pivot] = [];
                map[obj.pivot].push(obj)
            }else{
                map[obj.pivot].push(obj);
            }
            return map;
        },[])

        var ouGroupDecocToDataMap = dataset.reduce((map,obj) => {            
            map[obj.pivot+"-"+obj.ougroup+"-"+obj.decoc] = obj
            return map;
        },[])
        
        var cellValueList = [];
        var rowTotalMap = []
        for (var key in pivotWiseDataset){
            
            var list = pivotWiseDataset[key];
            if (list.length==0){debugger}
            var pivot = list[0].pivot;
            
            cellValueList.push({
                cell : getLetter(colNo) + startRow,
                value : list[0].pivotname,
                style : [{
                    key : "bold",
                    value :"true"
                }]
            })

            
            list.forEach((obj) => {                
                var decocObj = ouGroupDecocToObjMap[obj.ougroup+"-"+obj.decoc];
                if(!decocObj){return}
                
                var cell = getLetter(colNo)+decocObj.row
                var value = obj.value;

                // Cal total
                if (rowTotalMap[decocObj.row]){
                    rowTotalMap[decocObj.row] = rowTotalMap[decocObj.row] + obj.value
                }else{
                    rowTotalMap[decocObj.row] = obj.value
                }
                
                cellValueList.push( {
                    cell : cell,
                    value :value
                })
            })
            
            totalsMap.forEach((obj) => {
                
                var total = obj.ougroupdecoc.reduce((total,key)=>{
                    key = pivot+"-"+key;
                    if (ouGroupDecocToDataMap[key]){
                        total = total + ouGroupDecocToDataMap[key].value;
                    }
                    return total;
                },0)

                // Cal total
                if (rowTotalMap[obj.row]){
                    rowTotalMap[obj.row] = rowTotalMap[obj.row] + total
                }else{
                    rowTotalMap[obj.row] = total
                }
                
                var cell = getLetter(colNo) + obj.row
                
                cellValueList.push( {
                    cell : cell,
                    value :total,
                    style : [{
                        key : "bold",
                        value :"true"
                    }]
                })
                
            })

            cellValueList.push(getStyleCol(getLetter(colNo)));
            colNo = colNo+1;
        }

        cellValueList.push(getStyleCol(getLetter(colNo)));
        cellValueList.push({
            cell : getLetter(colNo) + startRow,
            value : "Total",
            style : [{
                key : "bold",
                value :"true"
            }]
        })
        
        var rowTotalCellValuesList = getRowTotalValuesCellMap(rowTotalMap,getLetter(colNo));

        cellValueList.push.apply(cellValueList,rowTotalCellValuesList);
        
        return cellValueList;
        
        // convert A to 1, Z to 26, AA to 27
        function getNumber(letters){
            // https://stackoverflow.com/questions/9905533/convert-excel-column-alphabet-e-g-aa-to-number-e-g-25
            return letters.split('').reduce((r, a) => r * 26 + parseInt(a, 36) - 9, 0);
        }

        function getLetter(num) {
            /**
             * Takes a positive integer and returns the corresponding column name.
             * @param {number} num  The positive integer to convert to a column name.
             * @return {string}  The column name.
             http://cwestblog.com/2013/09/05/javascript-snippet-convert-number-to-column-name/
            */
            for (var ret = '', a = 1, b = 26; (num -= a) >= 0; a = b, b *= 26) {
                ret = String.fromCharCode(parseInt((num % b) / a) + 65) + ret;
            }
            return ret;
        }

        function getStyleCol(col){

            return {
                column : col,
                style :[{
                    key:"border",
                    value : "true"
                },{
                    key:"border",
                    value : "thin"
                },{
                    key:"verticalAlignment",
                    value : "center"
                },{
                    key:"horizontalAlignment",
                    value : "center"
                },{
                    key:"wrapText",
                    value : "true"
                },{
                    key:"fontFamily",
                    value : "Arial"
                },{
                    key:"shrinkToFit",
                    value : "true"
                }]
            }
        }
        
    }
    
    this.getSelectionParametersCellValueMap = function(startPe,endPe,pcell,facility,fcell){

        var cellValueMap= [];
        
        cellValueMap.push( {
            cell : pcell,
            value :startPe + " TO " + endPe,
            style : [{
                key : "bold",
                value :"true"
            }]
        },{
            cell : fcell,
            value :facility,
            style : [{
                key : "bold",
                value :"true"
            }]
        })
        
        return cellValueMap;        
    }
    
    function getTotalsCellvalueMap(rowHeaders,totalsMap,ouGroupDecocToDataMap,pivotToColumnMap){

        var cellValueMap = [];

        for (var key in rowHeaders){

            var pivot = rowHeaders[key].id;
            
            totalsMap.forEach((obj) => {
                
                var total = obj.ougroupdecoc.reduce((total,key)=>{
                    
                    if (ouGroupDecocToDataMap[key]){
                        if (ouGroupDecocToDataMap[key].pivot == pivot){
                            total = total + ouGroupDecocToDataMap[key].value;
                        }
                    }
                    return total;
                },0)
                
                var cell = pivotToColumnMap[pivot] + obj.row
                
                cellValueMap.push( {
                    cell : cell,
                    value :total,
                    style : [{
                        key : "bold",
                        value :"true"
                    }]
                })
                
            })
        }
        return cellValueMap
    }
    
    function getRowTotalValuesCellMap(rowTotalMap,lastColumn){

        var cellValueMap= [];
        for (var key in rowTotalMap){
            var cell = lastColumn + key;
            var value = rowTotalMap[key];
            
            cellValueMap.push( {
                cell : cell,
                value :value,
                style : [{
                    key : "bold",
                    value :"true"
                }]
            })
        }
        return cellValueMap;
    }      

}

module.exports = new progressiveReportService();
