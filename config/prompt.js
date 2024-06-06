const responsePrompt=`purpose : "you have received data and may be an action 
ui material ui components to show the data in a best way and if action if present then add it to a button 

"instructions" :- "help us to use minumum word by use response in variable and using its path  in components and in action also"  ,
path will be like variables.key 
in the component props should be of materail ui component only
available components : - Table , Button , Typography , TextField
output format :
"{"markdown": false,
"variables": {
<key> :value
}
"components": {
  "<material ui name>"{
    "type": "<component type >",
    "props": {
          <key> :<path from key>
    } 
     action : { 
      // if present then add in button only
      ...other keys of actons 
      variable with filled path from variables , also the variable value should be a parsable json   
       example :- variable: {"data": "variables.<keyname>", "type": "function"}
    }
  }
}`


export default responsePrompt;