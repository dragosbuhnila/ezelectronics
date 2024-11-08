# Project Estimation - CURRENT
Date: 1/05/2024

Version: 1


# Estimation approach
Consider the EZElectronics  project in CURRENT version (as given by the teachers), assume that you are going to develop the project INDEPENDENT of the deadlines of the course, and from scratch
# Estimate by size
### 
|             | Estimate                        |             
| ----------- | ------------------------------- |  
| NC =  Estimated number of classes to be developed   | 26 classes|             
|  A = Estimated average size per class, in LOC | 100 LOC | 
| S = Estimated size of project, in LOC (= NC * A) | 2600  |
| E = Estimated effort, in person hours (here use productivity 10 LOC per person hour)  | 260 |   
| C = Estimated cost, in euro (here use 1 person hour cost = 30 euro) | 7800 **€**| 
| Estimated calendar time, in calendar weeks (Assume team of 4 people, 8 hours per day, 5 days per week ) | 1.625 calendar weeks |               

# Estimate by product decomposition
### 
|         component name    | Estimated effort (person hours)   |             
| ----------- | ------------------------------- | 
|requirement document    | 28 |
| GUI prototype | 10 |
|design document | 35 |
|code | 260 |
| unit tests | 80 |
| api tests |60|
| management documents  | 20 |



# Estimate by activity decomposition

### Activities
![image](/uml/GanttTableV1.png)
### Diagram
![image](/uml/GanttDiagramV1.png)

# Summary

Report here the results of the three estimation approaches. The  estimates may differ. Discuss here the possible reasons for the difference

|             | Estimated effort                        |   Estimated duration |          
| ----------- | ------------------------------- | ---------------|
| estimate by size | 260 person hours | 1.625 calendar weeks |
| estimate by product decomposition | 493 person hours| 3.08 calendar weeks |
| estimate by activity decomposition | 1760 person hours | 11 calendar weeks |

**NOTE:** For the Gantt diagram, we considered only 4 persons working, for 8 hours on a day the 5 days of the week.

## Analysis
The difference is that we are counting more parts of the project. The estimation by size only works with lines of code. Then we add products to deliver, that also count the documents and other deliverables. And finally, the activity decompositions counts every task required to execute the project, even the test, corrections, investigations and all other activities.
