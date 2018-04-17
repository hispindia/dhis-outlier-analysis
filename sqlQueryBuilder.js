

function sqlQueryBuilder(mapping,selectedOU,selectedOUGroupUID,startDate,endDate,periodType){

    var ouLevel = selectedOU.children[0].level;
    var children = selectedOU.children;

    var selectedOUUID =  "'"+selectedOU.id+"'";
    
    startDate = getDate(periodType,startDate)
    endDate = getDate(periodType,endDate)
    var ouGroupWiseDecocStringMap = mapping.decoc.reduce((map,obj) => {
        
        var str = map[obj.ougroup];
        if (!str) {
            map[obj.ougroup] = "'"+obj.de+"-"+obj.coc+"'"
        }else{
            map[obj.ougroup] = str + ",'"+obj.de+"-"+obj.coc +"'";
            
        }
        
        
        return map;
    },[])
    
 
    function getDate(type,dateStr){

        switch(type){
        case 'monthly' : 
            return "'"+dateStr.substring(0,4)+"-"+dateStr.substring(4,6)+"-01'"
        }
         
    }
    
    this.getSQLQuery = function(){


        var decocListCommaSeparated = mapping.decoc.reduce((str,obj) => {
            if (str==""){
                str = obj.de+"-"+obj.coc +"'"
            }else{
                str = str+ ",'"+obj.de+"-"+obj.coc +"'" ;
                
            }
            return str;
        },"")

        
        var subQuery = ""
      
        for (var key in ouGroupWiseDecocStringMap){
            
            if (subQuery == ""){
                subQuery =  middleQuery(ouLevel,selectedOUUID,startDate,endDate,key,ouGroupWiseDecocStringMap[key]) ;

            }else{

            }
            subQuery = subQuery + " union " +  middleQuery(ouLevel,selectedOUUID,startDate,endDate,key,ouGroupWiseDecocStringMap[key],selectedOUGroupUID);
        }
        
        var query = `select json_agg(main.*) from (`
                                                   + subQuery
                                                   + ` )main group by pivot,pivotname order by pivotname`

        console.log(query)
        
        return query;

        

        function middleQuery(ouLevel,selectedOUUID,startDate,endDate,ouGroupUIDKeySelect,decocStr,selectedGroupUID){

            var ouGroupUIDs = ouGroupUIDKeySelect.replace("-","','");
            
            var subQuery = ` select ous.organisationunitid
	    from _orgunitstructure ous
	    where idlevel`+ouLevel+` in ( select ou.organisationunitid
	                                  from organisationunit ou
	                                  where parentid in (select organisationunitid 
			                                     from organisationunit 
			                                     where uid = `+selectedOUUID+`))`;

            var suffixQ =   ` select ou.uid as pivot,ou.name as pivotname,'null' as ougroup,'null' as decoc,0 as value 
	    from organisationunit ou
	    where parentid in (select organisationunitid 
			       from organisationunit 
			       where uid = `+selectedOUUID+`) `;
            
            if (selectedOUGroupUID!="-1"){
                subQuery = `select ous.organisationunitid
	        from orgunitgroupmembers ous
	        inner join orgunitgroup oug on oug.orgunitgroupid = ous.orgunitgroupid
	        where oug.uid in (`+"'"+selectedOUGroupUID+"'"+`)`;

                suffixQ = ` select ou.uid as pivot,ou.name as pivotname,'null' as ougroup,'null' as decoc,0 as value
                from  orgunitgroupmembers ous
	        inner join orgunitgroup oug on oug.orgunitgroupid = ous.orgunitgroupid
                inner join organisationunit ou on ous.organisationunitid = ous.organisationunitid
	        where oug.uid in (`+"'"+selectedOUGroupUID+"'"+`)`
                
            }
            
            var groupQ = `and ous.organisationunitid in (
	        select ougm.organisationunitid
	        from orgunitgroupmembers ougm
	        inner join orgunitgroup oug on oug.orgunitgroupid = ougm.orgunitgroupid
	        where oug.uid in ('`+ouGroupUIDs+`')
	    )`;

            if (ouGroupUIDKeySelect!='nogroup'){
                subQuery = subQuery + groupQ;
            }
            
            var query = `select ous.uidlevel`+ouLevel+` as pivot,
                max(ou.name) as pivotname,
                `+"'"+ouGroupUIDKeySelect+"'"+` as ougroup,concat(de.uid,'-',coc.uid) as decoc ,
            sum(dv.value :: float) as value
	    from datavalue dv
	    inner join period as pe on pe.periodid = dv.periodid 
	    inner join periodtype as pt on pt.periodtypeid = pe.periodtypeid 
	    inner join dataelement as de on de.dataelementid = dv.dataelementid 
	    inner join categoryoptioncombo coc on coc.categoryoptioncomboid = dv.categoryoptioncomboid 
	    inner join _orgunitstructure ous on ous.organisationunitid = dv.sourceid 
	    inner join organisationunit ou on ou.organisationunitid = ous.idlevel`+ouLevel+`
	    where pe.startdate >= `+startDate+`
            and pe.startdate <= `+endDate+` 
	    and dv.sourceid in ( ` + subQuery + ` )
            and concat(de.uid,'-',coc.uid) in (`+decocStr+`)
	    group by ous.uidlevel`+ouLevel+`,concat(de.uid,'-',coc.uid)
            union all `+ suffixQ;
            
            return query;
        }
    }
}

module.exports = sqlQueryBuilder;
