//=================================================================
//Init mControl Instances, Tie to DOM
//mControl(_containerEl, _type, _defaultValue, _numericStepValue=null, _minVal=0, _maxVal=null)
//=================================================================
//Pattern Duration
const PatternDurationControl = new mControl(
  document.querySelector("#pattern-duration"), "number", 1.7, 0.05, 0.5, 30
);

//Notes Per Pattern
const NotesPerPatternControl = new mControl(
  document.querySelector("#notes-per-pattern"), "number", 3, 1, 1, 64
)

//Allow Duplicates (check)
const AllowDuplicatesControl = new mControl(
  document.querySelector("#allow-duplicates"), "checkbox", 1
)

//Loop Patterns (check)
const LoopPatternsControl = new mControl(
  document.querySelector("#loop-pattern"), "checkbox", 1
)

//Auto Advance // Forever Mode (check)
const AutoAdvanceLoopControl = new mControl(
  document.querySelector("#auto-advance"), "checkbox", 1
)

//Number of Loops
const NumLoopsControl = new mControl(
  document.querySelector("#num-loops"), "number", 4, 1, 1, 100
)

//Range Min
const RangeMinControl = new mControl(
  document.querySelector("#range-min"), "number", 1, 1, 1, 100
)

//Range Max
const RangeMaxControl = new mControl(
  document.querySelector("#range-max"), "number", 7, 1, 1, 100
)

const slider = document.getElementById("volumeSliderEl");
var volumeSliderValue = 20;


$(document).ready(function(){

  //Inputs
  
  slider.oninput = function() {
    volumeSliderValue = this.value;
  }
  
  var notesPerPattern;
  var minSemitones;
  var maxSemitones;
  var patternDurationSeconds;
  var noteDurationSeconds;
  var loopsUntilAutoAdvance;
  var loopIsChecked;
  var allowDupesIsChecked
  var autoAdvanceIsChecked;
  
  function pollAllParameters(){
    //console.log("pollAllParameters");

    notesPerPattern = NotesPerPatternControl.value;
    minSemitones = RangeMinControl.value;
    maxSemitones = RangeMaxControl.value;
    patternDurationSeconds = PatternDurationControl.value;
    noteDurationSeconds     = patternDurationSeconds/notesPerPattern; //(no user input)
    loopsUntilAutoAdvance   = NumLoopsControl.value;
    loopIsChecked           = LoopPatternsControl.getBoolValue();
    allowDupesIsChecked     = AllowDuplicatesControl.getBoolValue();
    autoAdvanceIsChecked    = AutoAdvanceLoopControl.getBoolValue();

  };

  pollAllParameters();

  //Sample Update
  var newPattern     = new Array();
  var currentPattern = new Array();

  var ignoreInput = false;
  var isPlaying   = false;

  var loopTimeoutVar;

  loopTimesPlayed = 0;

  //====================================================
  //     Audio Context Initialization 
  //====================================================
  let browserAudioContext = null;
  let oscillators = {};

  window.AudioContext = window.AudioContext || window.webkitAudioContext;

  
  function midiToFreq(_n){
    const a = 440;
    return (a/32) * (2 ** ((_n-9) / 12));
  }

  function cueSingleNote(_note, _velocity, _delay){

    //Make a note id so we can access it in the stop function
    var _id = rand(0, 999).toString();

    //Tell Oscillator to Make Note!
    noteOscOn(_id, _note, _velocity, _delay);

    //Tell Oscillator to Stop + Delete Note!
    setTimeout(() => { noteOscOff(_id); }, ((_delay + noteDurationSeconds) * 1000));
  }

  function stopAllNotes(){
    console.log("====== stopAllNotes =====");
    if(oscillators == {}) return;

    for (let i in oscillators) {
      noteOscOff(i);
    };

    return;
    // if(browserAudioContext){
    //   browserAudioContext.close();
    // }else{
    //   console.log('catch exception: cant stop notes because no context');
    // }
    // if(oscillators.length > 0){
    //   oscillators = {};
    // }
    // browserAudioContext = null;
    
  }

  function noteOscOn(_id, _note, _velocity, _delay){
    // console.log("Note On!: vel = " + _velocity);
    var _vel = _velocity/3;
    var _startTime = browserAudioContext.currentTime + _delay;

    //Initialize Oscillators (weird? each time?)
    let osc = browserAudioContext.createOscillator();
    let oscGain = browserAudioContext.createGain();

    //Set unique values based on params
    osc.frequency.value = midiToFreq(_note);
    oscGain.gain.setValueAtTime(0.0, _startTime);

    var _rampTime = 0.02;//fixed ramp time
    oscGain.gain.linearRampToValueAtTime(_vel, _startTime+_rampTime);

    //Connect Oscillators to context + gain
    osc.connect(oscGain);
    oscGain.connect(browserAudioContext.destination);

    //start the note at the startTime (delay)
    osc.start(_startTime);

    //Store references for later access / cleanup
    osc.gainRef = oscGain;
    oscillators[_id] = osc;

  }

  function noteOscOff(_id){
    
    if(browserAudioContext == null) return;
    
    let osc = oscillators[_id];

    //We could have killed the note via StopAllNotes
    //in that scenario, there may be lingering setTimeouts that try to call a null ref
    if(osc == undefined) return; 

    //ramp down the gain
    var _gainRef = osc.gainRef.gain;
    _gainRef.setValueAtTime(_gainRef.value, browserAudioContext.currentTime);
    var _rampTime = noteDurationSeconds/2;
    _gainRef.exponentialRampToValueAtTime(0.001, browserAudioContext.currentTime + _rampTime);

    //clean up the note's data
    setTimeout(() => {
      osc.stop();
      osc.disconnect();
      delete oscillators[_id];
    }, ((_rampTime) * 1000));
    
  }


  //====================================================
  //     UI Events
  //====================================================
  
  const startButton = document.querySelector("#playstop")

  startButton.onclick = startButtonPressed;
  // TEMP DISABLE; Remake These $('#start').click(startButtonPressed);
  // TEMP DISABLE; Remake These $('#stop').click(stopButtonPressed);
  // TEMP DISABLE; Remake These $('#stop').addClass('disabled');


  PatternDurationControl.bindUpdateCallback(mControlUpdated);
  NotesPerPatternControl.bindUpdateCallback(mControlUpdated);
  AllowDuplicatesControl.bindUpdateCallback(mControlUpdated);
  LoopPatternsControl.bindUpdateCallback(mControlUpdated);
  AutoAdvanceLoopControl.bindUpdateCallback(mControlUpdated);
  NumLoopsControl.bindUpdateCallback(mControlUpdated);
  RangeMinControl.bindUpdateCallback(mControlUpdated);
  RangeMaxControl.bindUpdateCallback(mControlUpdated);
  
  
  function mControlUpdated(){
    stopButtonPressed();
    pollAllParameters();
  }
  
// handled elsewhere now; deprecated
  // $('#params input').change(function(event){
  //   $(event.target).blur();
  //   stopButtonPressed();
  //   pollAllParameters();

  // });

  window.onkeyup = function(e) {
    console.log("!! " + e.key);
    if(ignoreInput) return;
    if(e.key === " ") {
      if( isPlaying == false ) {
        startButtonPressed();
      }else{
        stopButtonPressed();
      }
    }
  };


  //====================================================
  //     Start / Stop
  //====================================================

  function startButtonPressed(){
    if (isPlaying) {
      stopButtonPressed();
      return;
    }
    console.log(">startButtonPressed<");

    stopAllNotes();

    isPlaying = true;

    pollAllParameters();
    playNewPattern();
    //Unused? clearTimeout(inputTimeoutVar);

    //Aesthetic things
    // $("body").addClass('playing');
    // $('#start').addClass('disabled');
    // $('#start').text("RUNNING...");
    // $('#stop').removeClass('disabled');

    drawAllLoopDots();
  
  }
  function stopButtonPressed(){
    console.log(">stopButtonPressed<");
    clearTimeout(loopTimeoutVar);

    stopAllNotes();

    isPlaying = false;
    loopTimesPlayed = 0;

    //Aesthetic things
    // $("body").removeClass('playing');
    // $('#start').removeClass('disabled');
    // $('#start').text("PLAY");
    // $('#stop').addClass('disabled');
    removeAllLoopDots();

  }


  //====================================================
  //     Pattern Creation / Playback / Loop
  //====================================================
  function createNewPattern(){
    newPattern = [];
    
    //Init var to hold new note, and also one for checking for duplicates
    var r;
    var prevR;

    //Create the First Note in the pattern
    var startingNote = parseInt(rand(70,60));
    r = startingNote; 
    newPattern.push(r);
    
    //If this is all we need, stop here
    if(notesPerPattern == 1){
      currentPattern = newPattern;
      return;  
    }

    //Allow random notes to be above or below the initial/root note,
    // so that min/max ranges work as expected
    var ascDescBool = getRandomMultiplier();

    //Consider user inputs for range limits
    var minimumRandomNoteValue = startingNote + (minSemitones * ascDescBool);
    // var maximumRandomNoteValue = startingNote + (maxSemitones * ascDescBool) + (1 * ascDescBool);
      //^ I don't know why I did this, but I'm removing it.
    
    var maximumRandomNoteValue = startingNote + (maxSemitones * ascDescBool);

    //Initialize the safeguard (error check)
    var loopRuns = 0;

    //If more than one note pattern, continue making notes based on min and max values
    for (var i = 1; i < notesPerPattern; i++) {

      //Save previous value for checking duplicates
      if(!allowDupesIsChecked) prevR = r; 

      //Generate a new random note!
      r = parseInt(rand(minimumRandomNoteValue, maximumRandomNoteValue));


      //Check for Duplicates, and re-run loop
      if(!allowDupesIsChecked && prevR == r){
        i--;
        console.log("Found a duplicate; re-running loop");

        //Check for failures!
        loopRuns++; if(loopRuns > 50) { console.log('Error: loop overflow'); return; }
        continue;
      }

      //no dupes were detected; add note to pattern array
      newPattern.push( r );
    }
    currentPattern = newPattern;
    console.log(newPattern);
  }

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }


  //There has to be a smarter way to do this...
  function getRandomMultiplier() {
    if ( Boolean(Math.round(Math.random())) ) {
      return 1;
    }else{
      return -1;
    }
  }

  function play(){
    //console.log("play!");
    // console.log('start audio context...');
    if(browserAudioContext == null) browserAudioContext = new AudioContext();

    var n; //note
    var d; //delay

    var volPercent = volumeSliderValue / 100;
    
    for (var i=0; i < currentPattern.length; i++) {
      n = currentPattern[i];
      d = i * noteDurationSeconds; //delay
      //Cue the Note!
      cueSingleNote(n, volPercent, d);
    }

    if( loopIsChecked ){
      loopPattern();
    }else{
      window.setTimeout(function() { stopButtonPressed(); }, d*1000);
    }
  }

  function playNewPattern(){
    //stopAllNotes(); Removing this from here; Not Necessary
    clearTimeout(loopTimeoutVar);
    createNewPattern();
    play();
  }

  function replayCurrentPattern(){
    clearTimeout(loopTimeoutVar); //necessary?
    console.log("replayCurrentPattern");
    play();

  }

  function loopPattern(){
    loopTimeoutVar = window.setTimeout(function() { loopTick(); }, patternDurationSeconds*1000);
  }

  function loopTick(){
    loopTimesPlayed++;

    if(loopTimesPlayed >= loopsUntilAutoAdvance){
      loopTimesPlayed = 0;
      removeAllLoopDotsHighlights();

      if( autoAdvanceIsChecked ){

        stopAllNotes();
        playNewPattern();
      } else {
        stopButtonPressed();
      }
    }else{
      replayCurrentPattern();
      highlightLoopDot(loopTimesPlayed);
    }
    
  }

  //====================================================
  //     Loopdots
  //====================================================

  function drawAllLoopDots(){
    var numDots = loopsUntilAutoAdvance;
    removeAllLoopDots();

    for (var i = 0; i < numDots; i++) {
      addLoopDot(i, numDots);
    }

  }

  function addLoopDot(newId, _totalDots){
    var newDiv = $("<div>");
    $("#loopdots").append( newDiv );
    newDiv.addClass( "loopdot" ).prop('id', 'ld_'+newId);

    var dotWidthInDvw = 100/_totalDots;
    var str = dotWidthInDvw + "dvw";
    console.log("dot width is..." + str);
    newDiv.css({"width":str});

    if(newId == 0) newDiv.addClass('firstdot');
  }
  
  function highlightLoopDot(newId){
    $('#ld_'+newId).addClass('highlighted');
  }

  function removeAllLoopDots(){
    $(".loopdot").remove();
  }

  function removeAllLoopDotsHighlights(){
    $('.loopdot').removeClass('highlighted');
  }
  



});
  
  