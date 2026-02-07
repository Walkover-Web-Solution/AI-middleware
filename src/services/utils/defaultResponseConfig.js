const defaultResponseJson = {
  Response1: {
    description: "It is a Default Response or text response.",
    components: {
      Typography: {
        type: "Typography",
        key: "Typography",
        props: {
          variant: "bold",
          children: "I'm a text component.",
          textAlign: "left"
        }
      }
    }
  },
  Response2: {
    description: "textfield",
    components: {
      TextField: {
        type: "TextField",
        key: "TextField",
        props: {
          label: "",
          variant: "outlined",
          size: "medium",
          defaultValue: "",
          placeholder: "write text here",
          type: "text"
        }
      }
    }
  },
  Response3: {
    description: "When user asks for button",
    components: {
      Button: {
        type: "Button",
        key: "Button",
        props: {
          variant: "outlined",
          color: "error",
          label: "button",
          type: "submit"
        }
      }
    }
  },
  Response4: {
    description: "When user asks for any Table related data",
    components: {
      Table: {
        type: "Table",
        key: "Table",
        props: {
          columns: [],
          data: [
            {
              id: 1,
              name: "John",
              age: 30
            },
            {
              id: 2,
              name: "Alice",
              age: 25
            },
            {
              id: 3,
              name: "Bob",
              age: 55
            },
            {
              id: 4,
              name: "Bosb",
              age: 45
            }
          ]
        }
      }
    }
  },
  Response5: {
    description: "When user asks for any options/Radio",
    components: {
      Radio: {
        type: "Radio",
        key: "Radio",
        props: {
          color: "primary",
          name: "Radio",
          defaultValue: "Hello",
          options: ["Hello", "Okk", "Bye"]
        }
      }
    }
  },
  Response6: {
    description: "when user asks to choose multiple fields/Checkboxses",
    components: {
      Checkbox: {
        type: "Checkbox",
        key: "Checkbox",
        props: {
          color: "primary",
          defaultChecked: false,
          label: "Checkbox"
        }
      }
    }
  },
  Response7: {
    description: "when user want any Icon or image",
    components: {
      Icon: {
        type: "Icon",
        key: "Icon",
        props: {
          variant: "square",
          src: "https://cdn2.hubspot.net/hubfs/53/image8-2.jpg"
        }
      }
    }
  }
};
export default defaultResponseJson;
