
console.log("hello from mControl");

//Math Helper Function
function roundTo(n, digits) {
  if (digits === undefined) digits = 0;
  var multiplicator = Math.pow(10, digits);
  n = parseFloat((n * multiplicator).toFixed(11));
  var test =(Math.round(n) / multiplicator);
  return +(test.toFixed(digits));
}


class mControl {
  constructor(_containerEl, _type, _defaultValue, _numericStepValue, _minVal=0, _maxVal=null) {
    this.containerEl = _containerEl;
    this.valueEl = _containerEl.querySelector(".c-value");
    this.incEl = null;
    this.decEl = null;
    this.type = _type;
    this.defaultValue = _defaultValue;
    this.numericStepValue = _numericStepValue;
    this.value = _defaultValue;
    this.minValue = _minVal;
    this.maxValue = _maxVal;

    //Set Default Values
    this.valueEl.textContent = _defaultValue;
    if(this.type == "checkbox") this.setCheckboxValue(_defaultValue);

    //Init Event Listeners
    if(this.type == "checkbox"){
      this.containerEl['objRef'] = this;  
      this.containerEl.onclick = this.checkboxClicked;

    }else if(this.type == "number"){
      this.incEl = _containerEl.querySelector(".c-inc");
      this.incEl['objRef'] = this;
      this.incEl.onclick = this.incClicked;
      this.decEl = _containerEl.querySelector(".c-dec");
      this.decEl['objRef'] = this;      
      this.decEl.onclick = this.decClicked;

    }else{
      //error: Tried to initialize input with invalid type
    }

  }

  //Click Handlers - wrappers to make clicked methods nicer
  //========================================================
  checkboxClicked(e){
    var thisRef = this["objRef"];
    thisRef.toggleCheckbox();
  }

  incClicked(e){
    var thisRef = this["objRef"];
    thisRef.incrementNumberValue();
  }

  decClicked(e){
    var thisRef = this["objRef"];
    thisRef.decrementNumberValue();
  }

  //Checkboxes
  setCheckboxValue(_newValue){
    
    if(this.type != "checkbox") return;

    if(_newValue == 1){
      this.valueEl.textContent="ON";
      this.valueEl.classList.add("check-on");
      this.valueEl.classList.remove("check-off");
    }else{
      this.valueEl.textContent="OFF";
      this.valueEl.classList.add("check-off");
      this.valueEl.classList.remove("check-on");
    }
    this.value = _newValue;
  }

  toggleCheckbox(){
    console.log(this);

    if(this.value == 1 ){
      this.setCheckboxValue(0);
    }else{
      this.setCheckboxValue(1);
    }
  }

  //Numeric inputs
  incrementNumberValue(){

    var curVal = this.value;

    this.value = roundTo((curVal + this.numericStepValue), 2);
    if(this.value > this.maxValue) this.value = this.maxValue;
    this.valueEl.textContent = this.value;
  }
  decrementNumberValue(){

    var curVal = this.value;
    this.value = roundTo((curVal - this.numericStepValue), 2);
    if(this.value < this.minValue) this.value = this.minValue;
    this.valueEl.textContent = this.value;
  }


}

//=================================================================
// Actual Inputs, tied to DOM IDs...
//=================================================================
//Pattern Duration
const patternDurationControl = new mControl(
  document.querySelector("#pattern-duration"),
  "number", 1.7, 0.05,
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
  document.querySelector("#num-loops"),
  "number", 4, 1,
  1, 100
)




