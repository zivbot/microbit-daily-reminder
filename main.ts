/*
Daily reminder at a specified hour to do something (e.g. take a pill)
Use flow:
After turning on: set hours, minutes, and hour of alert
Setting is done by A, B, and pressing logo to confirm.
To return to settup mode, press A+B and repeat the setup flow.
Version 0.1
*/ 
const isDebugMode = true // when true, speeds up time
const debugSpeedUp = 180

const textSpeed = 60
const timeDisplaySpeed = 150

let lastAlertMillis = 0
let alertMinutesSinceStarted = 0
let alertNotificationStage = 0

let millisWhenTimeSet = 0
let minutesWhenSet = (isDebugMode ? 55 : 0) // minutes as set by user
let hoursWhenSet = (isDebugMode ? 14 : 12) // hours as set by user

let currentMinutes = -1
let currentHours = -1

let previousMinutes = 0

let isAlertOn = false
let mode = 0
let alertHour = (isDebugMode ? 15 : 15)
let str = ""
let displayBusy = false

startSetup((isDebugMode ? 2 : 0))


function startSetup (setMode : number) {
    mode = setMode
    if (mode == 0) {
        basic.showString("HOURS", 60)
        if (currentHours >= 0) hoursWhenSet = currentHours;
        basic.showNumber(hoursWhenSet, textSpeed)
    }
}

input.onButtonPressed(Button.AB, function () {
    // if clicked A+B then go back to setting time and alert
    mode = 0
    isAlertOn = false
    startSetup(0)
})

function displayTime ( toConsole = false ) {
    let s = formatTime(currentHours, currentMinutes)
    if (toConsole)
        console.log(s)
    else
        pauseAndShowString(s)
}

function formatTime ( hours : number, minutes : number ) {
    let str = "" + hours + ":"
    if (minutes < 10) {
        str = "" + str + "0"
    }
    str = "" + str + Math.floor(minutes)
    return str
}

function soundAlert (x: number) {
    while (x-- > 0) {
        music.playTone(Note.C4, music.beat(BeatFraction.Eighth))
        music.playTone(Note.D4, music.beat(BeatFraction.Quarter))
    }
}

function soundConfirmation() {
    music.playTone(Note.C4, music.beat(BeatFraction.Eighth))
    music.playTone(Note.D4, music.beat(BeatFraction.Quarter))
    music.playTone(Note.E4, music.beat(BeatFraction.Eighth))
    music.playTone(Note.F4, music.beat(BeatFraction.Quarter))
}

function soundClick() {
    music.playTone(Note.E4, music.beat(BeatFraction.Sixteenth))
}

function pauseAndShowString(str: string) {
    if (displayBusy) return;
    displayBusy = true;
    basic.clearScreen()
    basic.showString(str, timeDisplaySpeed);
    basic.pause(str.length * timeDisplaySpeed)
    displayBusy = false;
}

/****** ACTION HANDLERS ********/
input.onButtonPressed(Button.A, function () {
    soundClick()
    if (mode == 0) {
        // set hours
        hoursWhenSet += -1
        if (hoursWhenSet < 0) {
            hoursWhenSet = 23
        }
        basic.showNumber(hoursWhenSet, textSpeed)
    } else if (mode == 1) {
        // set minutes
        minutesWhenSet += 0 - 1
        if (minutesWhenSet < 0) {
            minutesWhenSet += 60
        }
        basic.showNumber(Math.floor(minutesWhenSet), textSpeed * 0.7)
    } else if (mode == 2) {
        // set alert hour
        alertHour += 0 - 1
        if (alertHour < 0) {
            alertHour = 23
        }
        basic.showNumber(alertHour, textSpeed)
    }
})
input.onButtonPressed(Button.B, function () {
    soundClick()
    if (mode == 0) {
        // set hours
        hoursWhenSet += 1
        if (hoursWhenSet > 23) {
            hoursWhenSet = 0
        }
        basic.showNumber(hoursWhenSet, textSpeed)
    } else if (mode == 1) {
        // set minutes
        minutesWhenSet += 1
        if (minutesWhenSet > 60) {
            minutesWhenSet += 0 - 60
        }
        basic.showNumber(Math.floor(minutesWhenSet), textSpeed*0.7)
    } else if (mode == 2) {
        // set alert hours
        alertHour += 1
        if (alertHour > 23) {
            alertHour = 0
        }
        basic.showNumber(alertHour, textSpeed)
    }
})

input.onLogoEvent(TouchButtonEvent.Pressed, function () {
    if (mode == 0) { // Hour has been set, enter set minutes mode
        mode = 1
        basic.showString("MIN", textSpeed)
        if (currentMinutes >= 0) minutesWhenSet = currentMinutes;
        basic.showNumber(minutesWhenSet, textSpeed)
        soundClick()
    } else if (mode == 1) { // Minutes has been set, now set alert
        mode = 2
        basic.showString("ALERT", textSpeed)
        basic.showNumber(alertHour, textSpeed)
        soundClick()
    } else if (mode == 2) { // Alert has been set, now change to operational mode
        // note the millis when clock started, use it to keep track
        millisWhenTimeSet = control.millis()

        //lastMillis = control.millis()
        mode = 3
        basic.showIcon(IconNames.Happy, 500)
        basic.pause(500)
        basic.clearScreen()
        soundClick()
        
    } else if (mode == 3 && isAlertOn) {
        // Pressed to confirm an alert
        soundConfirmation()
        isAlertOn = false
        
        displayBusy = true
        basic.showIcon(IconNames.Happy,500)
        basic.pause(500)
        displayBusy = false
        basic.clearScreen()
    }
})

/* When shaken, show alert setting */
input.onShake(function () {
    if (mode == 3) {
        displayTime()
    }
})

/* On loud sound, display time */
/* DISABLED - causes leds to light up, which cannot be forced off programmatically.
/*input.onSound(DetectedSound.Loud, function() {
    if (mode == 3) displayTime()
})*/


/* Calculate currentHours and currentMinutes, based on millisWhenTimeSet, hoursWhenSet & minutesWhenSet */
function updateCurrentTime() {
    
    previousMinutes = currentMinutes // used to note when a rounded hour changes

    let minutesDifference = (control.millis() - millisWhenTimeSet) / (1000 * 60)
    
    if (isDebugMode) { // speed things up substantially
        minutesDifference *= debugSpeedUp
    }

    currentMinutes = Math.floor((minutesWhenSet + minutesDifference) % 60)
    
    let hoursDifference = Math.floor((minutesWhenSet + minutesDifference) / 60)
    currentHours = (hoursWhenSet + hoursDifference) % 24
}


/**
 * Main loop: update time display, and check alert status
 */
basic.forever(function () {
    if (mode == 3) { // Operational mode
        let isHourChanged = false;

        // wait one minute
        let cycleDelay = (isDebugMode ? (1000 / debugSpeedUp) : 1000);
        basic.pause(cycleDelay) // Controls cycle update intervals. default: 1000 (1 sec)

        updateCurrentTime()
    
        isHourChanged = (previousMinutes == 59 && currentMinutes == 0) // Mark to display time every rounded hour

        displayTime(true) // debug: show time in console

        // Check condition for triggering alert 
        if (currentHours == alertHour
            && currentMinutes == 0
            && isHourChanged
            && !(isAlertOn) ) {
            // trigger alert
            isAlertOn = true
            alertNotificationStage = 0
            lastAlertMillis = control.millis()
            console.log("ALERT")
        }

        if (isAlertOn) {

            // count minutes since alert triggered
            alertMinutesSinceStarted = (control.millis() - lastAlertMillis) / (60 * 1000)
            if (isDebugMode) { // speed things up substantially
                alertMinutesSinceStarted *= debugSpeedUp
            }
            alertMinutesSinceStarted = Math.floor(alertMinutesSinceStarted)

            if (!displayBusy) {
                basic.showLeds(`
                    . . # . .
                    . . # . .
                    # # # # #
                    . . # . .
                    . . # . .
                    `)
            }

            if (alertNotificationStage == 0 && alertMinutesSinceStarted == 2) {
                soundAlert(1)
                console.log("SOUND 1")
                alertNotificationStage = 1
                lastAlertMillis = control.millis()
            } else if (alertNotificationStage == 1 && alertMinutesSinceStarted == 10) {
                soundAlert(2)
                console.log("SOUND 2")
                alertNotificationStage = 2
                lastAlertMillis = control.millis()
            } else if (alertNotificationStage == 2 
                        && alertMinutesSinceStarted == 30 
                        && currentHours > 8 
                        && currentHours < 20) {
                // every half hour, but not during night
                lastAlertMillis = control.millis()
                soundAlert(3)
                console.log("SOUND 3")
            }
        } else {
            // show time only on round hours
            if (isHourChanged) {
                if (!displayBusy) {
                    displayTime()
                }
            }
            else {
                let x = 0, y = 0;
                let mapped = Math.map(currentMinutes, 0, 59, 0, 24)

                if (!displayBusy) {
                    // Fill screen with dots according to minutes/60
                    basic.clearScreen()
                    for (let b = 0; b <= mapped; b++) {
                        y = 4- (b % 5);
                        x = Math.floor(b/5)
                        if (b < Math.floor(mapped)) { 
                            // mark all dots as bright, except last one
                            led.plotBrightness(x, y, 5+(b/mapped)*35)
                        }
                        else // mark last dot according to part of the last dot
                            led.plotBrightness(x, y, 5+(mapped-Math.floor(mapped))*35)
                    }
                }  
            }
        }
    }
})
