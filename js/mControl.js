
console.log("hello from mControl");

class mControl {
  constructor(_targetContainerEl, _type, _defaultValue, _incrementValue, _minVal=0, _maxVal=null) {
    this.targetContainerEl = _targetContainerEl;
    this.targetValueEl = _targetContainerEl.querySelector(".c-value");
    this.type = _type;
    this.defaultValue = _defaultValue;
    this.incrementValue = _incrementValue;
    this.value = _defaultValue;
    this.minValue = _minVal;
    this.maxValue = _maxVal;

    if(this.type == "checkbox"){
      
    }else if(this.type == "number"){

    }else{
      //error: Tried to initialize input with invalid type
    }

    this.targetValueEl.textContent = _defaultValue;
    if(this.type == "checkbox") this.setCheckboxValue(_defaultValue);
  }
  
  //Checkboxes
  setCheckboxValue(_newValue){
    if(this.type != "checkbox") return;

    if(_newValue == 1){
      this.targetValueEl.textContent="ON";
      this.targetValueEl.classList.add("check-on");
      this.targetValueEl.classList.remove("check-off");
    }else{
      this.targetValueEl.textContent="OFF";
      this.targetValueEl.classList.add("check-off");
      this.targetValueEl.classList.remove("check-on");
    }
    this.value = _newValue;
  }

  toggleCheckbox(){
    if(this.value == 1 ){
      this.setCheckboxValue(0);
    }else{
      this.setCheckboxValue(1);
    }
  }

  incrementNumberValue(){
      
  }

}

//Pattern Duration
const patternDurationControl = new mControl(
  document.querySelector("#pattern-duration"),
  "number", 1.7, 0.5,
  0.5, 30
);


//Notes Per Pattern
const notesPerPatternControl = new mControl(
  document.querySelector("#notes-per-pattern"),
  "number", 3, 1,
  1, 10
)

//Avoid Duplicates (check)
const AvoidDuplicatesControl = new mControl(
  document.querySelector("#avoid-duplicates"),
  "checkbox", 0, null,
  null, null
)

//Loop Patterns (Check)
const LoopPatternsControl = new mControl(
  document.querySelector("#loop-pattern"),
  "checkbox", 1, null,
  null, null
)

//Auto Advance
const AutoAdvanceLoopControl = new mControl(
  document.querySelector("#auto-advance"),
  "checkbox", 1, null,
  null, null
)

//Number of Loops
const NumLoopsControl = new mControl(
  document.querySelector("#pattern-duration"),
  "number", 4, 1,
  1, 100
)




