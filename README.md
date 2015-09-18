# Decision tree

[Decision tree](https://en.wikipedia.org/wiki/Decision_tree), [random forests](https://en.wikipedia.org/wiki/Random_forest) with D3.js

[决策树](https://zh.wikipedia.org/wiki/%E5%86%B3%E7%AD%96%E6%A0%91)，[随机森林](https://zh.wikipedia.org/wiki/%E9%9A%8F%E6%9C%BA%E6%A3%AE%E6%9E%97)，基于D3开发

## Usage

 ```js
 d3.json("data/iris.json", renderTree);
 // entrance
 function renderTree(json){
     decisionTree.init({
         container : '.svg-container',
         data : json,
         showPredictionPanel : true
     });
 }
 ```
 
### options

#### container

Set the container for Decision Tree Component.
    
#### data

Decision Tree data like [iris.json](https://raw.githubusercontent.com/tarobjtu/decision-tree/master/data/iris.json).
    
#### showPredictionPanel

* `true` : Show prediction panel right side. 
* `false` : Hide prediction panel right side. 

## Capture
![Capture](https://raw.githubusercontent.com/tarobjtu/decision-tree/master/images/decision_tree.gif)
![Capture](https://raw.githubusercontent.com/tarobjtu/decision-tree/master/images/decision_tree_with_prediction_path.gif)

## Demo
Please View [Demo here](http://tarobjtu.github.io/dv/decision-tree/demo.html)

## Thanks
Thanks to [pprett's demo](http://bl.ocks.org/pprett/3813537) and D3.js.