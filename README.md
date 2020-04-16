# dhis-outlier-analysis

This is a DHIS2 app which uses SQL View to do calculation on aggregated dataset and find outliers which are downloaded as excel sheet.

Input
- Facility
- DataSet/s
- Select Month
- Reference Duration
  - Last 12 months
  - Last 6 months etc..
  
 Formula 
 mean +- 3*SqRoot(mean)
 
 Use Case
User should be able to analyze the number of outliers that have been reported in the data by them or their supervised facilities. 
The analysis should be available to be done on historic data upon any facility/s which are in the jurisdiction of the user/analyst. 
The analysis should have sufficient information to figure out the exact facility , time period and data point of the outlier found and the min and max values of such cases.

Commands:

To install node files in outlier-analysis run this command

npm install 

Then run this command to build code and generate bundle.js

webpack
