const defaultResponseJson = {
  "Response1": {
    "description": "It is a Default Response",
    "components": {
      "Typography": {
        "type": "Typography",
        "key": "Typography13796",
        "props": {
          "variant": "bold",
          "children": "I'm a text component.",
          "textAlign": "left"
        }
      }
    }
  },
  "Response2": {
    "description": "textfield",
    "components": {
      "TextField": {
        "type": "TextField",
        "key": "TextField42878",
        "props": {
          "label": "",
          "variant": "outlined",
          "size": "medium",
          "defaultValue": "",
          "placeholder": "write text here",
          "type": "text"
        }
      }
    }
  },
  "Response3": {
    "description": "button",
    "components": {
      "Button": {
        "type": "Button",
        "key": "Button08759",
        "props": {
          "variant": "outlined",
          "color": "error",
          "label": "button",
          "type": "submit"
        }
      }
    }
  },
  "Response4": {
    "description": "Table",
    "components": {
      "Table": {
        "type": "Table",
        "key": "Table37374",
        "props": {
          "columns": [],
          "data": [
            {
              "id": 1,
              "name": "John",
              "age": 30
            },
            {
              "id": 2,
              "name": "Alice",
              "age": 25
            },
            {
              "id": 3,
              "name": "Bob",
              "age": 55
            },
            {
              "id": 4,
              "name": "Bosb",
              "age": 45
            }
          ]
        }
      }
    }
  },
  "Response5": {
    "description": "Radio",
    "components": {
      "Radio": {
        "type": "Radio",
        "key": "Radio33518",
        "props": {
          "color": "primary",
          "name": "Radio",
          "defaultValue": "Hello",
          "options": [
            "Hello",
            "Okk",
            "Bye"
          ]
        }
      }
    }
  },
  "Response6": {
    "description": "Checkbox",
    "components": {
      "Checkbox": {
        "type": "Checkbox",
        "key": "Checkbox49850",
        "props": {
          "color": "primary",
          "defaultChecked": false,
          "label": "Checkbox"
        }
      }
    }
  },
  "Response7": {
    "description": "Icon",
    "components": {
      "Icon": {
        "type": "Icon",
        "key": "Icon66334",
        "props": {
          "variant": "square",
          "src": "https://cdn2.hubspot.net/hubfs/53/image8-2.jpg"
        }
      }
    }
  }
}


module.exports = { defaultResponseJson }