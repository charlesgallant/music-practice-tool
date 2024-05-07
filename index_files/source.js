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
  
    $("#slider").slider();
    //$(#slider).slider( "value" );
  
    $( "#slider" ).slider({ value: 20 });
    
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
  
    var bufferTimeoutVar;
    var inputTimeoutVar;
    var loopTimeoutVar;
  
    loopTimesPlayed = 0;
  
    //====================================================
    //     Audio Context Initialization 
    //====================================================
    let browserAudioContext;
    let osc;
  
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
  
    
  
    function midiToFreq(){
  
    }
  
    //Start Context Button
    $('#audioStart').click(audioStartPressed);
  
    function audioStartPressed(){
      console.log('start audio context...');
      browserAudioContext = new AudioContext();
     
      noteOn(60, 127);
    }
  
    function noteOn(_note, _velocity){
      osc = browserAudioContext.createOscillator();
      console.log("Note On!");
      osc.frequency.value = '440';
      osc.connect(browserAudioContext.destination);
      osc.start();

    }
  
    function noteOff(_note){
      
    }
  
    
  
    //====================================================
    //     Inialize MIDI plugin
    //====================================================
    /*
    MIDI.loadPlugin({
      soundfontUrl: "./soundfont/",
      instrument: "acoustic_grand_piano",
  
      onprogress: function(state, progress) {
        console.log(state, progress);
      },
      onsuccess: function() {
        
        // var note        = 50;   // the MIDI note value / pitch
        // var velocity    = 127;  // how hard the note hits
        // var noteSustain = 0.75; // How long to wait before sending noteOff 
        // var delay       = 0;    // play one note every quarter second
  
        // play the note
        // MIDI.setVolume(0, 127);
        // MIDI.noteOn   (0, note, velocity, delay);
        // MIDI.noteOff  (0, note, delay + noteSustain);
        
      }
    });
    */
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
  
  
    //$('#params input').click(function(event){
      //$(event.target).blur();
      //$(this).change();
    //});
  
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
  
      //CG: NeedsMidi Version
      //MIDI.stopAllNotes();
      isPlaying = true;
  
      pollAllParameters();
      playNewPattern();
      clearTimeout(inputTimeoutVar);
  
      //Aesthetic things
      $("body").addClass('playing');
      $('#start').addClass('disabled');
      $('#stop').removeClass('disabled');
  
      drawAllLoopDots();
    
    }
    function stopButtonPressed(){
      console.log(">stopButtonPressed<");
      clearTimeout(loopTimeoutVar);
  
      //CG: NeedsMidi Version
      //MIDI.stopAllNotes();
  
      isPlaying = false;
      loopTimesPlayed = 0;
  
      //Aesthetic things
      $("body").removeClass('playing');
      $('#start').removeClass('disabled');
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
      var n; //note
      var d; //delay
      var volPercent = $("#slider").slider( "value" )/200;
      var vol = 127.0 * volPercent;
      
      for (var i=0; i < currentPattern.length; i++) {
        n = currentPattern[i];
        d = i * noteDurationSeconds; //delay
  
        //CG: NeedsMidi Version
        //MIDI.noteOn   (0, n, vol, d);
  
      }
  
      if( input_loopCheckbox.is(':checked') ){
        loopPattern();
      }else{
        window.setTimeout(function() { stopButtonPressed(); }, d*1000);
      }
    }
  
    function playNewPattern(){
      //CG: NeedsMidi Version
      //MIDI.stopAllNotes();
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
  
          //CG: NeedsMidi Version
          //MIDI.stopAllNotes();
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
  
  