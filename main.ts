/*
Daily reminder at a specified hour to do something (e.g. take a pill)
Use flow:
After turning on: set hours, minutes, and hour of alert
Setting is done by A, B, and pressing logo to confirm.
To return to settup mode, press A+B and repeat the setup flow.
Version 0.1
*/ 
const isDebugMode = false // when true, speeds up time
const debugSpeedUp = 60

const textSpeed = 60
const timeDisplaySpeed = 150

let alertStartMillis = 0
let alertNotificationStage = 0
let currentMillis = 0
let lastMillis = 0
let isAlertOn = false
let minutes = (isDebugMode ? 55 : 0)
let mode = (isDebugMode ? 2 : 0)
let alertHour = (isDebugMode ? 9 : 15)
let hours = 8
let str = ""
let timeSinceLastAlert = 0

startSetup()


function startSetup () {
    basic.showString("SET H", 60)
    basic.showNumber(hours, textSpeed)
}

input.onButtonPressed(Button.AB, function () {
    // if clicked A+B then go back to setting time and alert
    mode = 0
    isAlertOn = false
    startSetup()
})

function displayTime ( toConsole = false ) {
    str = "" + hours + ":"
    if (minutes < 10) {
        str = "" + str + "0"
    }
    str = "" + str + Math.floor(minutes)
    if (toConsole)
        console.log(str)
    else
        basic.showString(str,timeDisplaySpeed)
}

function soundAlert (x: number) {
    for (; x > 0; x-- ) {
        music.playTone(Note.C4, music.beat(BeatFraction.Eighth))
        music.playTone(Note.D4, music.beat(BeatFraction.Quarter))
    }
}

/****** ACTION HANDLERS ********/
input.onButtonPressed(Button.A, function () {
    if (mode == 0) {
        // set hours
        hours += -1
        if (hours < 0) {
            hours = 23
        }
        basic.showNumber(hours, textSpeed)
    } else if (mode == 1) {
        // set minutes
        minutes += 0 - 1
        if (minutes < 0) {
            minutes += 60
        }
        basic.showNumber(Math.floor(minutes), textSpeed * 0.7)
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
    if (mode == 0) {
        // set hours
        hours += 1
        if (hours > 23) {
            hours = 0
        }
        basic.showNumber(hours, textSpeed)
    } else if (mode == 1) {
        // set minutes
        minutes += 1
        if (minutes > 60) {
            minutes += 0 - 60
        }
        basic.showNumber(Math.floor(minutes), textSpeed*0.7)
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
        basic.showString("SET M", textSpeed)
        basic.showNumber(Math.floor(minutes), textSpeed)
    } else if (mode == 1) { // Minutes has been set, now set alert
        mode = 2
        basic.showString("SET ALERT", textSpeed)
        basic.showNumber(alertHour, textSpeed)
    } else if (mode == 2) { // Alert has been set, now change to operational mode
        // note the millis when clock started, use it to keep track
        lastMillis = control.millis()
        mode = 3
        basic.showIcon(IconNames.Happy, 500)
        basic.pause(500)
        basic.clearScreen()
        
    }
    if (mode == 3 && isAlertOn) {
        isAlertOn = false
        basic.showIcon(IconNames.Happy,500)
        basic.pause(500)
        basic.clearScreen()
    }
})

/* When shaken, show time */
input.onShake(function () {
    if (mode == 3) displayTime()
})


/**
 * Main loop: update time display, and check alert status
 */
basic.forever(function () {
    if (mode == 3) {
        let isHourChanged = false;

        // if timer is on
        // wait one minute
        let cycleDelay = (isDebugMode ? (1000 / debugSpeedUp) : 1000);
        basic.pause(cycleDelay) // Controls cycle update intervals. default: 1000 (1 sec)
        currentMillis = control.millis()
        let minutesPassed = (currentMillis - lastMillis) / (60 * cycleDelay)
        minutes += minutesPassed; // change to speed up time, default 60000
        lastMillis = currentMillis
        timeSinceLastAlert += minutesPassed;
        
    
        if (minutes >= 60) {
            minutes += 0 - 60
            if (hours < 23) {
                hours += 1
                isHourChanged = true // mark for display of time
            } else {
                hours = 0
            }
        }

        displayTime(true) // debug: show time in console

        // Check condition for triggering alert 
        if (hours == alertHour 
            && Math.floor(minutes) == 0 
            && !(isAlertOn) 
            && Math.floor(timeSinceLastAlert) > 0) {
            // trigger alert
            isAlertOn = true
            alertStartMillis = control.millis() // mark millis time alert was kicked off
            alertNotificationStage = 0
            timeSinceLastAlert = 0 // used to prevent alert from triggering again in the same 0 minute
        }

        if (isAlertOn) {
            let alertMinutesSinceStarted = Math.floor((control.millis()- alertStartMillis ) / (cycleDelay*60)) // minutes since alert started
            //console.log(alertMinutesSinceStarted+ ", Notification stage:"+ alertNotificationStage)
            console.log(alertMinutesSinceStarted)
            basic.showLeds(`
                . . # . .
                . . # . .
                # # # # #
                . . # . .
                . . # . .
                `)
            if (alertNotificationStage == 0 && alertMinutesSinceStarted == 2) {
                soundAlert(1)
                alertNotificationStage = 1
            } else if (alertNotificationStage == 1 && alertMinutesSinceStarted == 10) {
                soundAlert(2)
                alertNotificationStage = 2
                timeSinceLastAlert = 0 // used here to prevent alert from repeating during the same minute
            } else if (alertNotificationStage == 2 
                        && alertMinutesSinceStarted % 30 == 0 
                       && hours > 8 
                       && hours < 20
                    && Math.floor(timeSinceLastAlert) > 0) {
                // every half hour, but not during night
                soundAlert(3)
                timeSinceLastAlert = 0
            }
        } else {
            // show time only on round hours
            if (isHourChanged)
                displayTime()
            else {
                let x = 0, y = 0;
                let mapped = Math.map(minutes, 0, 59, 0, 24)

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
})
