//==============================================
//mControl Class
//==============================================


//Math Helper Function
function roundTo(n, digits) {
  if (digits === undefined) digits = 0;
  var multiplicator = Math.pow(10, digits);
  n = parseFloat((n * multiplicator).toFixed(11));
  var test =(Math.round(n) / multiplicator);
  return +(test.toFixed(digits));
}

//==============================================
class mControl {
  constructor(_containerEl, _type, _defaultValue, _numericStepValue=null, _minVal=0, _maxVal=null) {
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

    this.appUpdateFunction = null;

    //Set Default Values
    this.valueEl.textContent = _defaultValue;
    if(this.type == "checkbox") this.setCheckboxValue(_defaultValue);

    //Init Event Listeners
    if(this.type == "checkbox"){
      this.containerEl['objRef'] = this;  
      // Messy syntax to preserve reference to "this" (this class instead of this el)
      this.containerEl.onclick = function(){ this["objRef"].toggleCheckbox(); };

    }else if(this.type == "number"){
      
      this.incEl = _containerEl.querySelector(".c-inc");
      this.incEl['objRef'] = this;
      // Messy syntax to preserve reference to "this" (this class instead of this el)
      this.incEl.onclick = function(){ this["objRef"].incrementNumberValue(); };
      
      this.decEl = _containerEl.querySelector(".c-dec");
      this.decEl['objRef'] = this;
      // Messy syntax to preserve reference to "this" (this class instead of this el)
      this.decEl.onclick = function(){ this["objRef"].decrementNumberValue(); };

    }else{
      //error: Tried to initialize input with invalid type
    }

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

    if(this.value == 1 ){
      this.setCheckboxValue(0);
    }else{
      this.setCheckboxValue(1);
    }
    this.valueUpdated();
  }

  getBoolValue(){
    if(this.type != "checkbox") return;
    return Boolean(this.value)
  }

  //Numeric inputs
  incrementNumberValue(){
    var curVal = this.value;
    this.value = roundTo((curVal + this.numericStepValue), 2);
    if(this.value > this.maxValue) this.value = this.maxValue;
    this.valueEl.textContent = this.value;

    this.valueUpdated();
  }

  decrementNumberValue(){
    var curVal = this.value;
    this.value = roundTo((curVal - this.numericStepValue), 2);
    if(this.value < this.minValue) this.value = this.minValue;
    this.valueEl.textContent = this.value;
  
    this.valueUpdated();
  }

  bindUpdateCallback(_func){
    this.appUpdateFunction = _func;
  }

  valueUpdated(){
    if(this.appUpdateFunction != null) this.appUpdateFunction.call();
  }

}



