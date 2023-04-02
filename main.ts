/*
Daily reminder at a specified hour to do something (e.g. take a pill)
Use flow:
After turning on: set hours, minutes, and hour of alert
Setting is done by A, B, and pressing logo to confirm.
To return to settup mode, press A+B and repeat the setup flow.
Version 0.1
*/ 
const textSpeed = 60
const timeDisplaySpeed = 150

let alertDuration = 0
let currentMillis = 0
let lastMillis = 0
let isAlertOn = false
let minutes = 0
let mode = 0
let alertHour = 0
let hours = 0
let str = ""

alertHour = 15
hours = 8

startSetup()


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
        basic.showNumber(alertHour,textSpeed)
    }
})

function startSetup () {
    mode = 0
    isAlertOn = false
    basic.showString("SET H", 60)
    basic.showNumber(hours, textSpeed)
}

input.onButtonPressed(Button.AB, function () {
    // if clicked A+B then go back to setting time and alert
    startSetup()
})

function displayTime ( ) {
    str = "" + hours + ":"
    if (minutes < 10) {
        str = "" + str + "0"
    }
    str = "" + str + Math.floor(minutes)
    basic.showString(str,timeDisplaySpeed)
}

function soundAlert (x: number) {
    for (; x > 0; x-- ) {
        music.playTone(Note.C4, music.beat(BeatFraction.Eighth))
        music.playTone(Note.D4, music.beat(BeatFraction.Quarter))
    }
}
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
    if (mode == 0) {
        basic.showString("SET M", textSpeed)
basic.showNumber(Math.floor(minutes), textSpeed)
// change mode
        mode = 1
    } else if (mode == 1) {
        basic.showString("SET ALERT", textSpeed)
basic.showNumber(alertHour, textSpeed)
// change mode
        mode = 2
    } else if (mode == 2) {
        // in set alert mode
        // change mode
        mode = 3
        // note the millis when clock started, use it to keep track
        lastMillis = control.millis()
        basic.showIcon(IconNames.Happy)
        basic.pause(2000)
        basic.clearScreen()
    }
    if (mode == 3 && isAlertOn) {
        isAlertOn = false
        basic.showIcon(IconNames.Happy)
    }
})

/**
 * Main loop: update time display, and check alert status
 */
basic.forever(function () {
    if (mode == 3) {
        let isHourChanged = false;

        // if timer is on
        // wait one minute
        basic.pause(1000) //50 // Controls cycle update intervals. default: 1000 (1 sec)
        currentMillis = control.millis()
        minutes += (currentMillis - lastMillis) / 60000; // change to speed up time, default 60000
        lastMillis = currentMillis
        if (minutes >= 60) {
            minutes += 0 - 60
            if (hours < 23) {
                hours += 1
                isHourChanged = true // mark for display of time
            } else {
                hours = 0
            }
        }
        if (hours == alertHour && Math.floor(minutes) == 0 && !(isAlertOn)) {
            // trigger alert
            isAlertOn = true
            alertDuration = 0
        }
        if (isAlertOn) {
            alertDuration += 1
            /*basic.showLeds(`
                # # # # #
                # # # # #
                # # # # #
                # # # # #
                # # # # #
                `)*/
            basic.showLeds(`
                . . # . .
                . . # . .
                # # # # #
                . . # . .
                . . # . .
                `)
            if (alertDuration == 2) {
                soundAlert(1)
            } else if (alertDuration == 10) {
                soundAlert(2)
            } else if (alertDuration > 10 && alertDuration % 30 == 0 && hours > 8 && hours < 20) {
                // every half hour, but not during night
                soundAlert(3)
            }
        } else {
            // show time only on round hours
            if (isHourChanged)
                displayTime()
            else {
                let x = 0, y = 0;
                let mapped = Math.map(minutes, 0, 59, 0, 24)
                console.log(mapped)
                for (let b = 0; b <= mapped; b++) {
                    //console.log("b=" + b)
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

input.onShake(function () {
    if (mode == 3) displayTime()
})