/*
Next Steps:

 - Adjust number of notes
 - Look into creating more options for randomness:
   - 1s 3s 5s only, where 1 is random
   - 1s 3s 5s only, locked into 1 scale 
      - 1s 3s 5s only, locked into 1 scale, always starts with 1
   - Checkboxes for intervals of that note (all 12)
   - ascending/descending only
   - large/small gaps between notes


 - Think about steps and pauses between notes:
   - Hear a note, pause, try to hit it
*/
$(document).ready(function(){

    //Inputs
    input_numNotesInput       = $('#numNotesPerPatternId');
    input_minSemitonesInput   = $('#minSemitonesId');
    input_maxSemitonesInput   = $('#maxSemitonesId');
    input_loopCheckbox        = $('#loopCheckBoxId');
    input_avoidDupesCheckbox  = $('#avoidDupesCheckBoxId');
    input_autoAdvanceCheckbox = $('#autoAdvanceCheckBoxId');
    input_patternSpeedInput   = $('#patternSpeedId');
    input_numLoopsInput       = $('#numLoopsId');
  
    var slider = document.getElementById("volumeSliderEl");
    var volumeSliderValue = 20;
    
    slider.oninput = function() {
      volumeSliderValue = this.value;
    }
    
    var notesPerPattern;
    var minSemitones;
    var maxSemitones;
    var loopStepDurationSeconds;
    var noteDurationSeconds;
    var loopsUntilAutoAdvance;
    var loopIsChecked;
    var avoidDupesIsChecked
    var autoAdvanceIsChecked;
  
  
    function pollAllParameters(){
      //console.log("pollAllParameters");
  
      // Notes Per Pattern =====================================================
      notesPerPattern = parseInt(input_numNotesInput.val());
  
      if(notesPerPattern < 1) {
        notesPerPattern = 1;
        input_numNotesInput.val(1);
      }
  
  
      // Min Semitones =====================================================
      minSemitones = parseInt(input_minSemitonesInput.val());
  
      if(minSemitones < 1) {
        minSemitones = 1;
        input_minSemitonesInput.val(1);
      }
  
      if(minSemitones > maxSemitones) {
        minSemitones = maxSemitones;
        input_minSemitonesInput.val(maxSemitones);
      }
  
      // Max Semitones =====================================================
      maxSemitones = parseInt(input_maxSemitonesInput.val());
  
      if(maxSemitones < minSemitones) {
        maxSemitones = minSemitones;
        input_maxSemitonesInput.val(minSemitones);
      }
  
      // Loop Step Duration (Seconds) ==========================================
      loopStepDurationSeconds = parseFloat(input_patternSpeedInput.val());
  
      if(loopStepDurationSeconds < 0.4) {
        loopStepDurationSeconds = 0.4;
        input_patternSpeedInput.val(0.4);
      }
  
      // Note Duration (no user input) =========================================
      noteDurationSeconds     = loopStepDurationSeconds/notesPerPattern;
  
      // Loop Step Duration (Seconds) ==========================================
      loopsUntilAutoAdvance   = parseInt(input_numLoopsInput.val());
      if(loopsUntilAutoAdvance < 1) {
        loopsUntilAutoAdvance = 1;
        input_numLoopsInput.val(1);
      }
  
      loopIsChecked           = input_loopCheckbox.is(':checked');
      avoidDupesIsChecked     = input_avoidDupesCheckbox.is(':checked');
      autoAdvanceIsChecked    = input_autoAdvanceCheckbox.is(':checked');
  
    };
  
    pollAllParameters();
  
    //Sample Update
    var newPattern     = new Array();
    var currentPattern = new Array();
  
    var ignoreInput = false;
    var isPlaying   = false;
  
    var inputTimeoutVar;
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
    
    $('#start').click(startButtonPressed);
    $('#stop').click(stopButtonPressed);
    $('#stop').addClass('disabled');
  
  
    $('#params input').change(function(event){
      $(event.target).blur();
      stopButtonPressed();
      pollAllParameters();
  
    });
  
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
      if (isPlaying) return;
      console.log(">startButtonPressed<");

      stopAllNotes();

      isPlaying = true;
  
      pollAllParameters();
      playNewPattern();
      clearTimeout(inputTimeoutVar);
  
      //Aesthetic things
      $("body").addClass('playing');
      $('#start').addClass('disabled');
      $('#start').text("RUNNING...");
      $('#stop').removeClass('disabled');
  
      drawAllLoopDots();
    
    }
    function stopButtonPressed(){
      console.log(">stopButtonPressed<");
      clearTimeout(loopTimeoutVar);
  
      stopAllNotes();
  
      isPlaying = false;
      loopTimesPlayed = 0;
  
      //Aesthetic things
      $("body").removeClass('playing');
      $('#start').removeClass('disabled');
      $('#start').text("PLAY");
      $('#stop').addClass('disabled');
      removeAllLoopDots();
  
    }
  
  
    //====================================================
    //     Pattern Creation / Playback / Loop
    //====================================================
    function CreateNewPattern(){
      newPattern = [];
      
      //Init var to hold new note, and also one for checking for duplicates
      var r;
      var prevR;
  
      //Create the First Note in the pattern
      var startingNote = parseInt(rand(68,60));
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
      var maximumRandomNoteValue = startingNote + (maxSemitones * ascDescBool) + (1 * ascDescBool);
  
  
      //Initialize the safeguard (error check)
      var loopRuns = 0;
  
      //If more than one note pattern, continue making notes based on min and max values
      for (var i = 1; i < notesPerPattern; i++) {
  
        //Save previous value for checking duplicates
        if(avoidDupesIsChecked) prevR = r; 
  
        //Generate a new random note!
        r = parseInt(rand(minimumRandomNoteValue, maximumRandomNoteValue));
  
  
        //Check for Duplicates, and re-run loop
        if(avoidDupesIsChecked && prevR == r){
          i--;
          console.log("Found a duplicate; re-running loop");
  
          //Check for failures!
          loopRuns++; if(loopRuns > 100) { console.log('Error: loop overflow'); return; }
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
      console.log("play!");
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
  
      if( input_loopCheckbox.is(':checked') ){
        loopPattern();
      }else{
        window.setTimeout(function() { stopButtonPressed(); }, d*1000);
      }
    }
  
    function playNewPattern(){
      //stopAllNotes(); Removing this from here; Not Necessary
      clearTimeout(loopTimeoutVar);
      CreateNewPattern();
      play();
    }
  
    function replayCurrentPattern(){
      clearTimeout(loopTimeoutVar); //necessary?
      console.log("replayCurrentPattern");
      play();
  
    }
  
    function loopPattern(){
      loopTimeoutVar = window.setTimeout(function() { loopTick(); }, loopStepDurationSeconds*1000);
    }
  
    function loopTick(){
      loopTimesPlayed++;
  
      if(loopTimesPlayed >= loopsUntilAutoAdvance){
        loopTimesPlayed = 0;
        removeAllLoopDotsHighlights();
  
        if( input_autoAdvanceCheckbox.is(':checked') ){
  
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
        addLoopDot(i);
      }
  
    }
  
    function addLoopDot(newId){
      var newDiv = $("<div>");
      $("#loopdots").append( newDiv );
      newDiv.addClass( "loopdot" ).prop('id', 'ld_'+newId);
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
  
  